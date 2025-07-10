import asyncio
import os
import logging
from contextlib import asynccontextmanager
from typing import List, Optional, Dict, Any
import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel
import torch
import whisper
import ollama
from gtts import gTTS
import io
import base64
import tempfile
import aiofiles
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import queue
import time
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER
import gc
import psutil
import asyncio
from asyncio import Semaphore
import httpx

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for models and pools
whisper_model = None
executor = None
whisper_workers = []
tts_workers = []
ollama_semaphore = None
whisper_semaphore = None
tts_semaphore = None

# Performance monitoring
request_stats = {
    "llm_requests": 0,
    "vlm_requests": 0,
    "whisper_requests": 0,
    "tts_requests": 0,
    "active_requests": 0,
    "failed_requests": 0
}

# GPU allocation
GPU_0 = "cuda:0"  # For LLM (Ollama Llama3.2:1b) and VLM (LLaVA)
GPU_1 = "cuda:1"  # For Whisper and TTS

# Configuration for high performance
CONFIG = {
    "max_workers": 50,  # Increased thread pool
    "whisper_workers": 8,  # Multiple Whisper workers
    "tts_workers": 8,  # Multiple TTS workers
    "ollama_max_concurrent": 10,  # Max concurrent Ollama requests
    "whisper_max_concurrent": 8,  # Max concurrent Whisper requests
    "tts_max_concurrent": 8,  # Max concurrent TTS requests
    "request_timeout": 15,  # Reduced timeout
    "queue_maxsize": 500,  # Larger queues
    "gpu_memory_fraction": 0.8,  # GPU memory management
}

class PerformanceMonitor:
    def __init__(self):
        self.active_requests = 0
        self.request_times = []
        self.lock = threading.Lock()
    
    def start_request(self):
        with self.lock:
            self.active_requests += 1
            request_stats["active_requests"] = self.active_requests
    
    def end_request(self, duration: float, success: bool = True):
        with self.lock:
            self.active_requests -= 1
            request_stats["active_requests"] = self.active_requests
            self.request_times.append(duration)
            if not success:
                request_stats["failed_requests"] += 1
            
            # Keep only last 100 request times
            if len(self.request_times) > 100:
                self.request_times = self.request_times[-100:]
    
    def get_stats(self):
        with self.lock:
            avg_time = sum(self.request_times) / len(self.request_times) if self.request_times else 0
            return {
                "active_requests": self.active_requests,
                "average_response_time": avg_time,
                "total_requests": len(self.request_times),
                "memory_usage": psutil.virtual_memory().percent,
                "gpu_memory": self._get_gpu_memory()
            }
    
    def _get_gpu_memory(self):
        try:
            if torch.cuda.is_available():
                return {
                    f"gpu_{i}": {
                        "allocated": torch.cuda.memory_allocated(i) / 1024**3,
                        "cached": torch.cuda.memory_reserved(i) / 1024**3
                    }
                    for i in range(torch.cuda.device_count())
                }
        except:
            pass
        return {}

monitor = PerformanceMonitor()

class OptimizedGPUManager:
    def __init__(self):
        self.gpu_0_semaphore = Semaphore(CONFIG["ollama_max_concurrent"])
        self.gpu_1_semaphore = Semaphore(max(CONFIG["whisper_max_concurrent"], CONFIG["tts_max_concurrent"]))
        
    async def acquire_gpu_0(self):
        await self.gpu_0_semaphore.acquire()
        
    def release_gpu_0(self):
        self.gpu_0_semaphore.release()
        
    async def acquire_gpu_1(self):
        await self.gpu_1_semaphore.acquire()
        
    def release_gpu_1(self):
        self.gpu_1_semaphore.release()

gpu_manager = OptimizedGPUManager()

# Request/Response Models
class LLMRequest(BaseModel):
    message: str
    user_name: str = "User"

class LLMResponse(BaseModel):
    response: str
    timestamp: datetime

class VLMRequest(BaseModel):
    prompt: str
    image_base64: str
    user_name: str = "User"

class VLMResponse(BaseModel):
    response: str
    timestamp: datetime

class TTSRequest(BaseModel):
    text: str
    voice: str = "default"
    speed: float = 1.0
    user_name: str = "User"

class WhisperResponse(BaseModel):
    text: str
    duration: float
    timestamp: datetime

class TTSResponse(BaseModel):
    audio_base64: str
    timestamp: datetime

class CertificateRequest(BaseModel):
    name: str
    date: str
    certificate_id: str

# Optimized model initialization
async def init_whisper_model():
    """Initialize Whisper model on GPU 1 with optimization"""
    global whisper_model
    try:
        if torch.cuda.is_available():
            gpu_count = torch.cuda.device_count()
            logger.info(f"PyTorch detects {gpu_count} GPU(s)")
            
            if gpu_count > 1:
                device = "cuda:1"
                logger.info("Loading Whisper model on GPU 1...")
                torch.cuda.set_device(1)
            else:
                device = "cuda:0"
                logger.info("Only 1 GPU detected, loading Whisper model on GPU 0...")
                torch.cuda.set_device(0)
        else:
            device = "cpu"
            logger.info("CUDA not available, loading Whisper model on CPU...")
        
        # Load model with optimization
        whisper_model = whisper.load_model("base", device=device)
        
        # Optimize for inference
        if device.startswith("cuda"):
            # Keep full precision to avoid type mismatch errors
            torch.cuda.empty_cache()  # Clear cache
            
        logger.info(f"Whisper model loaded and optimized on {device}")
        
    except Exception as e:
        logger.error(f"Failed to load Whisper model: {e}")
        whisper_model = None
        raise

async def init_tts_model():
    """Initialize gTTS with connection pooling"""
    try:
        logger.info("Initializing gTTS with connection pooling...")
        
        # Test gTTS functionality with timeout
        try:
            test_tts = gTTS(text="Test", lang='en', slow=False)
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=True) as test_file:
                test_tts.save(test_file.name)
                logger.info("gTTS test completed successfully")
        except Exception as e:
            logger.warning(f"gTTS test failed: {e}")
            
        logger.info("gTTS initialized successfully")
            
    except Exception as e:
        logger.error(f"Failed to initialize gTTS: {e}")
        raise

async def init_ollama():
    """Initialize Ollama with connection optimization"""
    try:
        logger.info("Initializing Ollama with connection optimization...")
        
        # Test Ollama connection
        try:
            models = await asyncio.to_thread(ollama.list)
            logger.info(f"Ollama connected, available models: {len(models.get('models', []))}")
        except Exception as e:
            logger.warning(f"Ollama connection test failed: {e}")
            
        logger.info("Ollama initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Ollama: {e}")
        raise

# Optimized worker functions
class WhisperWorker:
    def __init__(self, worker_id: int):
        self.worker_id = worker_id
        self.queue = asyncio.Queue(maxsize=CONFIG["queue_maxsize"])
        self.running = True
        
    async def start(self):
        """Start the worker"""
        while self.running:
            try:
                task = await asyncio.wait_for(self.queue.get(), timeout=1.0)
                if task is None:
                    break
                    
                audio_file, result_future = task
                
                await gpu_manager.acquire_gpu_1()
                try:
                    start_time = time.time()
                    logger.info(f"Worker {self.worker_id} processing audio: {audio_file}")
                    
                    if whisper_model is None:
                        raise Exception("Whisper model not loaded")
                    
                    # Process in thread to avoid blocking
                    result = await asyncio.to_thread(whisper_model.transcribe, audio_file)
                    
                    duration = time.time() - start_time
                    logger.info(f"Worker {self.worker_id} completed in {duration:.2f}s")
                    
                    if not result_future.cancelled():
                        result_future.set_result({
                            "text": result["text"],
                            "duration": result.get("duration", 0),
                            "success": True
                        })
                        
                except Exception as e:
                    logger.error(f"Worker {self.worker_id} error: {str(e)}")
                    if not result_future.cancelled():
                        result_future.set_result({
                            "error": str(e),
                            "success": False
                        })
                finally:
                    gpu_manager.release_gpu_1()
                    self.queue.task_done()
                    
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Whisper worker {self.worker_id} error: {e}")
    
    async def add_task(self, audio_file: str) -> Dict[str, Any]:
        """Add task to worker queue"""
        result_future = asyncio.Future()
        await self.queue.put((audio_file, result_future))
        return await asyncio.wait_for(result_future, timeout=CONFIG["request_timeout"])

class TTSWorker:
    def __init__(self, worker_id: int):
        self.worker_id = worker_id
        self.queue = asyncio.Queue(maxsize=CONFIG["queue_maxsize"])
        self.running = True
        
    async def start(self):
        """Start the worker"""
        while self.running:
            try:
                task = await asyncio.wait_for(self.queue.get(), timeout=1.0)
                if task is None:
                    break
                    
                text, voice, speed, result_future = task
                
                try:
                    start_time = time.time()
                    logger.info(f"TTS Worker {self.worker_id} processing: {text[:50]}...")
                    
                    # Detect language for better TTS quality
                    detected_lang = detect_language(text)
                    
                    # Map voice selection to language and TLD for gTTS
                    voice_config = {
                        'female': {'lang': 'en', 'tld': 'com'},
                        'male': {'lang': 'en', 'tld': 'co.uk'},
                        'female_us': {'lang': 'en', 'tld': 'com'},
                        'male_us': {'lang': 'en', 'tld': 'us'},
                        'default': {'lang': 'en', 'tld': 'com'}
                    }
                    
                    if detected_lang == "malay":
                        lang = 'ms'
                        tld = 'com'
                    else:
                        config = voice_config.get(voice, voice_config['default'])
                        lang = config['lang']
                        tld = config['tld']
                    
                    slow = speed < 0.8
                    
                    # Generate audio using gTTS in thread
                    tts = gTTS(text=text, lang=lang, slow=slow, tld=tld)
                    
                    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_file:
                        await asyncio.to_thread(tts.save, tmp_file.name)
                        
                        async with aiofiles.open(tmp_file.name, "rb") as f:
                            audio_data = await f.read()
                        
                        os.unlink(tmp_file.name)
                        
                        if len(audio_data) == 0:
                            raise Exception("gTTS generated empty audio")
                        
                        audio_base64 = base64.b64encode(audio_data).decode()
                        duration = time.time() - start_time
                        
                        logger.info(f"TTS Worker {self.worker_id} completed in {duration:.2f}s")
                    
                    if not result_future.cancelled():
                        result_future.set_result({
                            "audio_base64": audio_base64,
                            "success": True
                        })
                        
                except Exception as e:
                    logger.error(f"TTS Worker {self.worker_id} error: {str(e)}")
                    if not result_future.cancelled():
                        result_future.set_result({
                            "error": str(e),
                            "success": False
                        })
                finally:
                    self.queue.task_done()
                    
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"TTS worker {self.worker_id} error: {e}")
    
    async def add_task(self, text: str, voice: str, speed: float) -> Dict[str, Any]:
        """Add task to worker queue"""
        result_future = asyncio.Future()
        await self.queue.put((text, voice, speed, result_future))
        return await asyncio.wait_for(result_future, timeout=CONFIG["request_timeout"])

# Worker pools
whisper_worker_pool = []
tts_worker_pool = []

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager with optimizations"""
    global executor, whisper_worker_pool, tts_worker_pool
    
    logger.info("Starting Optimized AI Demo Backend...")
    
    # Initialize thread pool executor with more workers
    executor = ThreadPoolExecutor(max_workers=CONFIG["max_workers"])
    
    # Initialize models
    await init_ollama()
    await init_whisper_model()
    await init_tts_model()
    
    # Create worker pools
    logger.info(f"Creating {CONFIG['whisper_workers']} Whisper workers...")
    for i in range(CONFIG["whisper_workers"]):
        worker = WhisperWorker(i)
        whisper_worker_pool.append(worker)
        asyncio.create_task(worker.start())
    
    logger.info(f"Creating {CONFIG['tts_workers']} TTS workers...")
    for i in range(CONFIG["tts_workers"]):
        worker = TTSWorker(i)
        tts_worker_pool.append(worker)
        asyncio.create_task(worker.start())
    
    # GPU memory optimization
    if torch.cuda.is_available():
        for i in range(torch.cuda.device_count()):
            torch.cuda.empty_cache()
            torch.cuda.set_per_process_memory_fraction(CONFIG["gpu_memory_fraction"], device=i)
    
    logger.info("All optimized models loaded and workers started successfully!")
    
    yield
    
    # Cleanup
    logger.info("Shutting down optimized backend...")
    
    # Stop workers
    for worker in whisper_worker_pool:
        worker.running = False
        await worker.queue.put(None)
    
    for worker in tts_worker_pool:
        worker.running = False
        await worker.queue.put(None)
    
    executor.shutdown(wait=True)
    
    # Clear GPU memory
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

# Create FastAPI app
app = FastAPI(
    title="Optimized AI Demo Backend",
    description="High-performance backend API for AI Demo with LLM, VLM, Whisper, and TTS",
    version="2.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint with performance stats
@app.get("/health")
async def health_check():
    stats = monitor.get_stats()
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "gpu_available": torch.cuda.is_available(),
        "gpu_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
        "performance": stats,
        "config": CONFIG
    }

def generate_certificate_pdf(name: str, date: str, certificate_id: str) -> bytes:
    """Generate a PDF certificate using ReportLab"""
    try:
        buffer = io.BytesIO()
        
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=20*mm,
            leftMargin=20*mm,
            topMargin=20*mm,
            bottomMargin=20*mm
        )
        
        styles = getSampleStyleSheet()
        
        title_style = styles['Title']
        title_style.fontSize = 28
        title_style.textColor = Color(0.6, 0.4, 0.2)
        title_style.alignment = TA_CENTER
        
        heading_style = styles['Heading1']
        heading_style.fontSize = 20
        heading_style.textColor = Color(0.6, 0.4, 0.2)
        heading_style.alignment = TA_CENTER
        
        normal_style = styles['Normal']
        normal_style.fontSize = 14
        normal_style.textColor = Color(0.4, 0.3, 0.1)
        normal_style.alignment = TA_CENTER
        
        name_style = styles['Heading2']
        name_style.fontSize = 24
        name_style.textColor = Color(0.6, 0.4, 0.2)
        name_style.alignment = TA_CENTER
        
        content = []
        
        logo_path = os.path.join(os.path.dirname(__file__), "logo.png")
        if os.path.exists(logo_path):
            try:
                logo = Image(logo_path, width=60*mm, height=60*mm)
                logo.hAlign = 'CENTER'
                content.append(logo)
                content.append(Spacer(1, 10*mm))
            except Exception as e:
                logger.warning(f"Could not load logo: {e}")
                content.append(Spacer(1, 30*mm))
        else:
            content.append(Spacer(1, 30*mm))
        
        content.append(Paragraph("SIJIL PENCAPAIAN", title_style))
        content.append(Spacer(1, 20*mm))
        content.append(Paragraph("Dengan ini disahkan bahawa", normal_style))
        content.append(Spacer(1, 15*mm))
        content.append(Paragraph(name, name_style))
        content.append(Spacer(1, 15*mm))
        content.append(Paragraph("telah diiktiraf sebagai", normal_style))
        content.append(Spacer(1, 10*mm))
        content.append(Paragraph("Certified Gen-AI Learner", heading_style))
        content.append(Spacer(1, 15*mm))
        
        description = """dan telah menunjukkan pemahaman yang baik tentang teknologi AI termasuk
        Large Language Models (LLM), Vision Language Models (VLM),
        Speech-to-Text (Whisper), dan Text-to-Speech (TTS)"""
        content.append(Paragraph(description, normal_style))
        content.append(Spacer(1, 20*mm))
        content.append(Paragraph(f"Tarikh: {date}", normal_style))
        content.append(Spacer(1, 5*mm))
        content.append(Paragraph(f"ID Sijil: {certificate_id}", normal_style))
        
        doc.build(content)
        pdf_data = buffer.getvalue()
        buffer.close()
        
        return pdf_data
        
    except Exception as e:
        logger.error(f"Error generating PDF certificate: {e}")
        raise

def detect_language(text: str) -> str:
    """Simple language detection based on common words"""
    malay_words = ['saya', 'anda', 'adalah', 'dengan', 'untuk', 'dalam', 'pada', 'ini', 'itu', 'yang', 'dan', 'atau', 'tidak', 'ada', 'akan', 'sudah', 'boleh', 'mahu', 'hendak', 'bagaimana', 'mengapa', 'bila', 'dimana', 'siapa', 'apa']
    english_words = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'what', 'where', 'when', 'why', 'how', 'who', 'which', 'whose', 'whom']
    
    text_lower = text.lower()
    words = text_lower.split()
    
    malay_count = sum(1 for word in words if word in malay_words)
    english_count = sum(1 for word in words if word in english_words)
    
    if malay_count > english_count:
        return "malay"
    elif english_count > malay_count:
        return "english"
    else:
        return "english"

# Optimized LLM endpoint
@app.post("/api/llm", response_model=LLMResponse)
async def llm_chat(request: LLMRequest):
    """Chat with LLM using Ollama Llama3.2:1b on GPU 0 - Optimized"""
    start_time = time.time()
    monitor.start_request()
    request_stats["llm_requests"] += 1
    
    try:
        await gpu_manager.acquire_gpu_0()
        try:
            detected_lang = detect_language(request.message)
            
            if detected_lang == "malay":
                prompt = f"Jawab dalam Bahasa Malaysia: {request.message}"
            else:
                prompt = f"Please respond in English: {request.message}"
            
            # Use asyncio.to_thread for better concurrency
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    ollama.chat,
                    model="llama3.2:1b",
                    messages=[{
                        "role": "user",
                        "content": prompt
                    }]
                ),
                timeout=CONFIG["request_timeout"]
            )
            
            duration = time.time() - start_time
            monitor.end_request(duration, True)
            
            return LLMResponse(
                response=response["message"]["content"],
                timestamp=datetime.now()
            )
            
        finally:
            gpu_manager.release_gpu_0()
            
    except asyncio.TimeoutError:
        duration = time.time() - start_time
        monitor.end_request(duration, False)
        logger.error("LLM request timeout")
        raise HTTPException(status_code=408, detail="LLM request timeout")
    except Exception as e:
        duration = time.time() - start_time
        monitor.end_request(duration, False)
        logger.error(f"LLM error: {e}")
        raise HTTPException(status_code=500, detail=f"LLM processing failed: {str(e)}")

# Optimized VLM endpoint
@app.post("/api/vlm", response_model=VLMResponse)
async def vlm_analyze(request: VLMRequest):
    """Analyze image with VLM using Ollama LLaVA on GPU 0 - Optimized"""
    start_time = time.time()
    monitor.start_request()
    request_stats["vlm_requests"] += 1
    
    try:
        await gpu_manager.acquire_gpu_0()
        try:
            detected_lang = detect_language(request.prompt)
            
            if detected_lang == "malay":
                prompt = f"Jawab dalam Bahasa Malaysia: {request.prompt}"
            else:
                prompt = f"Please respond in English: {request.prompt}"
            
            # Decode base64 image
            image_data = base64.b64decode(request.image_base64.split(',')[1] if ',' in request.image_base64 else request.image_base64)
            
            # Save temporary image
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp_file:
                tmp_file.write(image_data)
                tmp_file.flush()
                
                # Use asyncio.to_thread for better concurrency
                response = await asyncio.wait_for(
                    asyncio.to_thread(
                        ollama.chat,
                        model="llava",
                        messages=[{
                            "role": "user",
                            "content": prompt,
                            "images": [tmp_file.name]
                        }]
                    ),
                    timeout=CONFIG["request_timeout"]
                )
                
                os.unlink(tmp_file.name)
                
                duration = time.time() - start_time
                monitor.end_request(duration, True)
                
                return VLMResponse(
                    response=response["message"]["content"],
                    timestamp=datetime.now()
                )
                
        finally:
            gpu_manager.release_gpu_0()
            
    except asyncio.TimeoutError:
        duration = time.time() - start_time
        monitor.end_request(duration, False)
        logger.error("VLM request timeout")
        raise HTTPException(status_code=408, detail="VLM request timeout")
    except Exception as e:
        duration = time.time() - start_time
        monitor.end_request(duration, False)
        logger.error(f"VLM error: {e}")
        raise HTTPException(status_code=500, detail=f"VLM processing failed: {str(e)}")

# Optimized Whisper endpoint with load balancing
@app.post("/api/whisper", response_model=WhisperResponse)
async def whisper_transcribe(audio: UploadFile = File(...)):
    """Transcribe audio using Whisper with load balancing"""
    start_time = time.time()
    monitor.start_request()
    request_stats["whisper_requests"] += 1
    
    try:
        # Save uploaded audio to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
            content = await audio.read()
            tmp_file.write(content)
            tmp_file.flush()
            
            # Find worker with smallest queue
            best_worker = min(whisper_worker_pool, key=lambda w: w.queue.qsize())
            
            try:
                result = await best_worker.add_task(tmp_file.name)
                os.unlink(tmp_file.name)
                
                if result["success"]:
                    duration = time.time() - start_time
                    monitor.end_request(duration, True)
                    
                    return WhisperResponse(
                        text=result["text"],
                        duration=result["duration"],
                        timestamp=datetime.now()
                    )
                else:
                    raise HTTPException(status_code=500, detail=result["error"])
                    
            except asyncio.TimeoutError:
                os.unlink(tmp_file.name)
                duration = time.time() - start_time
                monitor.end_request(duration, False)
                raise HTTPException(status_code=408, detail="Whisper processing timeout")
                
    except Exception as e:
        duration = time.time() - start_time
        monitor.end_request(duration, False)
        logger.error(f"Whisper error: {e}")
        raise HTTPException(status_code=500, detail=f"Whisper processing failed: {str(e)}")

# Optimized TTS endpoint with load balancing
@app.post("/api/tts", response_model=TTSResponse)
async def tts_generate(request: TTSRequest):
    """Generate speech using TTS with load balancing"""
    start_time = time.time()
    monitor.start_request()
    request_stats["tts_requests"] += 1
    
    try:
        # Find worker with smallest queue
        best_worker = min(tts_worker_pool, key=lambda w: w.queue.qsize())
        
        try:
            result = await best_worker.add_task(request.text, request.voice, request.speed)
            
            if result["success"]:
                duration = time.time() - start_time
                monitor.end_request(duration, True)
                
                return TTSResponse(
                    audio_base64=result["audio_base64"],
                    timestamp=datetime.now()
                )
            else:
                raise HTTPException(status_code=500, detail=result["error"])
                
        except asyncio.TimeoutError:
            duration = time.time() - start_time
            monitor.end_request(duration, False)
            raise HTTPException(status_code=408, detail="TTS processing timeout")
            
    except Exception as e:
        duration = time.time() - start_time
        monitor.end_request(duration, False)
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail=f"TTS processing failed: {str(e)}")

# TTS voices endpoint
@app.get("/api/tts/voices")
async def get_tts_voices():
    """Get available gTTS voices"""
    return {
        "voices": [
            {
                "id": "female",
                "name": "Female English (US)",
                "language": "en",
                "gender": "female",
                "description": "Google TTS English US voice"
            },
            {
                "id": "male",
                "name": "Male English (UK)",
                "language": "en",
                "gender": "male",
                "description": "Google TTS English UK voice"
            },
            {
                "id": "female_us",
                "name": "Female US English",
                "language": "en-us",
                "gender": "female",
                "description": "Google TTS American English voice"
            },
            {
                "id": "male_us",
                "name": "Male US English Alt",
                "language": "en-us",
                "gender": "male",
                "description": "Google TTS American English alternative voice"
            }
        ],
        "default": "female"
    }

# Enhanced status endpoint with performance metrics
@app.get("/api/status")
async def get_status():
    """Get system status with performance metrics"""
    stats = monitor.get_stats()
    return {
        "whisper_workers": len(whisper_worker_pool),
        "tts_workers": len(tts_worker_pool),
        "whisper_queue_sizes": [w.queue.qsize() for w in whisper_worker_pool],
        "tts_queue_sizes": [w.queue.qsize() for w in tts_worker_pool],
        "gpu_0_available": torch.cuda.is_available(),
        "gpu_1_available": torch.cuda.is_available() and torch.cuda.device_count() > 1,
        "performance": stats,
        "request_stats": request_stats,
        "timestamp": datetime.now()
    }

# Performance monitoring endpoint
@app.get("/api/performance")
async def get_performance():
    """Get detailed performance metrics"""
    return {
        "stats": monitor.get_stats(),
        "request_stats": request_stats,
        "config": CONFIG,
        "system": {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage('/').percent
        }
    }

# Certificate PDF endpoint
@app.get("/api/certificate/pdf")
async def generate_certificate_pdf_endpoint(name: str, date: str, certificate_id: str):
    """Generate and serve PDF certificate via GET request with query parameters"""
    try:
        logger.info(f"Generating PDF certificate for: {name}")
        
        # Generate the PDF in thread pool to avoid blocking
        pdf_data = await asyncio.to_thread(
            generate_certificate_pdf,
            name=name,
            date=date,
            certificate_id=certificate_id
        )
        
        # Create filename
        safe_name = "".join(c for c in name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        filename = f"Sijil-AI-{safe_name}-{certificate_id}.pdf"
        
        logger.info(f"PDF certificate generated successfully, size: {len(pdf_data)} bytes")
        
        # Return PDF as response
        return Response(
            content=pdf_data,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename={filename}",
                "Content-Type": "application/pdf"
            }
        )
        
    except Exception as e:
        logger.error(f"Certificate PDF generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Certificate generation failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8002,
        reload=False,
        workers=1,  # Keep single worker for GPU management
        log_level="info",
        access_log=False,  # Disable access logs for performance
        loop="asyncio"
    )