import asyncio
import os
import logging
from contextlib import asynccontextmanager
from typing import List, Optional
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
from concurrent.futures import ThreadPoolExecutor
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

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for models
whisper_model = None
executor = None
whisper_queue = None
tts_queue = None

# GPU allocation
GPU_0 = "cuda:0"  # For LLM (Ollama Llama3.2:1b) and VLM (LLaVA)
GPU_1 = "cuda:1"  # For Whisper and TTS

class GPUManager:
    def __init__(self):
        self.gpu_0_lock = threading.Lock()
        self.gpu_1_lock = threading.Lock()
        
    def get_gpu_0_lock(self):
        return self.gpu_0_lock
        
    def get_gpu_1_lock(self):
        return self.gpu_1_lock

gpu_manager = GPUManager()

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

# Initialize models
async def init_whisper_model():
    """Initialize Whisper model on GPU 1"""
    global whisper_model
    try:
        with gpu_manager.get_gpu_1_lock():
            # Check available GPUs and use appropriate device
            if torch.cuda.is_available():
                gpu_count = torch.cuda.device_count()
                logger.info(f"PyTorch detects {gpu_count} GPU(s)")
                
                if gpu_count > 1:
                    device = "cuda:1"
                    logger.info("Loading Whisper model on GPU 1...")
                    # Set GPU 1 for this process
                    torch.cuda.set_device(1)
                else:
                    device = "cuda:0"
                    logger.info("Only 1 GPU detected by PyTorch, loading Whisper model on GPU 0...")
                    torch.cuda.set_device(0)
            else:
                device = "cpu"
                logger.info("CUDA not available, loading Whisper model on CPU...")
            
            whisper_model = whisper.load_model("base", device=device)
            logger.info(f"Whisper model loaded successfully on {device}")
            
            # Verify model is loaded and on correct device
            logger.info("Whisper model initialization complete")
            if hasattr(whisper_model, 'device'):
                logger.info(f"Whisper model device: {whisper_model.device}")
            
    except Exception as e:
        logger.error(f"Failed to load Whisper model: {e}")
        whisper_model = None
        raise

async def init_tts_model():
    """Initialize gTTS (Google Text-to-Speech)"""
    try:
        logger.info("Initializing gTTS (Google Text-to-Speech)...")
        
        # Test gTTS functionality
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
    """Initialize Ollama models on GPU 0"""
    try:
        logger.info("Initializing Ollama models on GPU 0...")
        
        # Pull models if not exists
        try:
            await asyncio.to_thread(ollama.pull, "llama3.2:1b")
            logger.info("Llama3.2:1b model ready")
        except Exception as e:
            logger.warning(f"Could not pull llama3.2:1b: {e}")
            
        try:
            await asyncio.to_thread(ollama.pull, "llava")
            logger.info("LLaVA model ready")
        except Exception as e:
            logger.warning(f"Could not pull llava: {e}")
            
        logger.info("Ollama models initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Ollama: {e}")
        raise

# Worker functions for concurrent processing
def whisper_worker():
    """Worker function for Whisper processing"""
    global whisper_queue
    while True:
        try:
            task = whisper_queue.get(timeout=1)
            if task is None:
                break
                
            audio_file, result_queue = task
            
            with gpu_manager.get_gpu_1_lock():
                try:
                    logger.info(f"Processing audio file: {audio_file}")
                    if whisper_model is None:
                        raise Exception("Whisper model not loaded")
                    
                    result = whisper_model.transcribe(audio_file)
                    logger.info(f"Transcription successful: {result.get('text', '')[:50]}...")
                    result_queue.put({
                        "text": result["text"],
                        "duration": result.get("duration", 0),
                        "success": True
                    })
                except Exception as e:
                    logger.error(f"Whisper transcription error: {str(e)}")
                    result_queue.put({
                        "error": str(e),
                        "success": False
                    })
                    
            whisper_queue.task_done()
        except queue.Empty:
            continue
        except Exception as e:
            logger.error(f"Whisper worker error: {e}")

def tts_worker():
    """Worker function for TTS processing using gTTS"""
    global tts_queue
    while True:
        try:
            task = tts_queue.get(timeout=1)
            if task is None:
                break
                
            text, voice, speed, result_queue = task
            
            try:
                logger.info(f"gTTS processing text: {text[:50]}...")
                
                # Detect language for better TTS quality
                detected_lang = detect_language(text)
                
                # Map voice selection to language and TLD for gTTS
                voice_config = {
                    'female': {'lang': 'en', 'tld': 'com'},      # English US female-like
                    'male': {'lang': 'en', 'tld': 'co.uk'},     # English UK male-like
                    'female_us': {'lang': 'en', 'tld': 'com'},  # English US
                    'male_us': {'lang': 'en', 'tld': 'us'},     # English US alternative
                    'default': {'lang': 'en', 'tld': 'com'}     # Default
                }
                
                # Use detected language if Malay
                if detected_lang == "malay":
                    lang = 'ms'  # Malay language code
                    tld = 'com'
                else:
                    config = voice_config.get(voice, voice_config['default'])
                    lang = config['lang']
                    tld = config['tld']
                
                # Adjust speed (gTTS has slow parameter)
                slow = speed < 0.8  # Use slow speech if speed is less than 0.8
                
                # Generate audio using gTTS
                tts = gTTS(text=text, lang=lang, slow=slow, tld=tld)
                
                # Save to temporary file and read as bytes
                with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_file:
                    tts.save(tmp_file.name)
                    
                    # Read the generated audio file
                    with open(tmp_file.name, "rb") as f:
                        audio_data = f.read()
                    
                    # Clean up temporary file
                    os.unlink(tmp_file.name)
                    
                    if len(audio_data) == 0:
                        raise Exception("gTTS generated empty audio")
                    
                    # Encode to base64 for transmission
                    audio_base64 = base64.b64encode(audio_data).decode()
                    logger.info(f"gTTS audio generated with lang='{lang}', tld='{tld}', slow={slow}, size: {len(audio_data)} bytes")
                
                result_queue.put({
                    "audio_base64": audio_base64,
                    "success": True
                })
                logger.info("gTTS processing completed successfully")
                    
            except Exception as e:
                logger.error(f"gTTS processing error: {str(e)}")
                result_queue.put({
                    "error": str(e),
                    "success": False
                })
                    
            tts_queue.task_done()
        except queue.Empty:
            continue
        except Exception as e:
            logger.error(f"gTTS worker error: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global executor, whisper_queue, tts_queue
    
    logger.info("Starting AI Demo Backend...")
    
    # Initialize thread pool executor
    executor = ThreadPoolExecutor(max_workers=20)
    
    # Initialize queues
    whisper_queue = queue.Queue(maxsize=100)
    tts_queue = queue.Queue(maxsize=100)
    
    # Initialize models
    await init_ollama()
    await init_whisper_model()
    await init_tts_model()
    
    # Start worker threads
    whisper_thread = threading.Thread(target=whisper_worker, daemon=True)
    tts_thread = threading.Thread(target=tts_worker, daemon=True)
    
    whisper_thread.start()
    tts_thread.start()
    
    logger.info("All models loaded and workers started successfully!")
    
    yield
    
    # Cleanup
    logger.info("Shutting down...")
    whisper_queue.put(None)
    tts_queue.put(None)
    executor.shutdown(wait=True)

# Create FastAPI app
app = FastAPI(
    title="AI Demo Backend",
    description="Backend API for AI Demo with LLM, VLM, Whisper, and TTS",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "gpu_available": torch.cuda.is_available(),
        "gpu_count": torch.cuda.device_count() if torch.cuda.is_available() else 0
    }

def generate_certificate_pdf(name: str, date: str, certificate_id: str) -> bytes:
    """Generate a PDF certificate using ReportLab"""
    try:
        # Create a BytesIO buffer to store the PDF
        buffer = io.BytesIO()
        
        # Create the PDF document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=20*mm,
            leftMargin=20*mm,
            topMargin=20*mm,
            bottomMargin=20*mm
        )
        
        # Get styles
        styles = getSampleStyleSheet()
        
        # Create custom styles
        title_style = styles['Title']
        title_style.fontSize = 28
        title_style.textColor = Color(0.6, 0.4, 0.2)  # Amber color
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
        
        # Build the content
        content = []
        
        # Add logo if it exists
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
        
        # Title
        content.append(Paragraph("SIJIL PENCAPAIAN", title_style))
        content.append(Spacer(1, 20*mm))
        
        # Certificate text
        content.append(Paragraph("Dengan ini disahkan bahawa", normal_style))
        content.append(Spacer(1, 15*mm))
        
        # Name
        content.append(Paragraph(name, name_style))
        content.append(Spacer(1, 15*mm))
        
        # Achievement text
        content.append(Paragraph("telah diiktiraf sebagai", normal_style))
        content.append(Spacer(1, 10*mm))
        
        # Certification title
        content.append(Paragraph("Certified Gen-AI Learner", heading_style))
        content.append(Spacer(1, 15*mm))
        
        # Description
        description = """dan telah menunjukkan pemahaman yang baik tentang teknologi AI termasuk
        Large Language Models (LLM), Vision Language Models (VLM),
        Speech-to-Text (Whisper), dan Text-to-Speech (TTS)"""
        content.append(Paragraph(description, normal_style))
        content.append(Spacer(1, 20*mm))
        
        # Date and ID
        content.append(Paragraph(f"Tarikh: {date}", normal_style))
        content.append(Spacer(1, 5*mm))
        content.append(Paragraph(f"ID Sijil: {certificate_id}", normal_style))
        
        # Build the PDF
        doc.build(content)
        
        # Get the PDF data
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
        # Default to English if unclear
        return "english"

# LLM endpoint
@app.post("/api/llm", response_model=LLMResponse)
async def llm_chat(request: LLMRequest):
    """Chat with LLM using Ollama Llama3.2:1b on GPU 0"""
    try:
        with gpu_manager.get_gpu_0_lock():
            # Detect input language
            detected_lang = detect_language(request.message)
            
            # Prepare prompt based on detected language
            if detected_lang == "malay":
                prompt = f"Jawab dalam Bahasa Malaysia: {request.message}"
            else:
                prompt = f"Please respond in English: {request.message}"
            
            # Use Ollama for LLM
            response = await asyncio.to_thread(
                ollama.chat,
                model="llama3.2:1b",
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )
            
            return LLMResponse(
                response=response["message"]["content"],
                timestamp=datetime.now()
            )
    except Exception as e:
        logger.error(f"LLM error: {e}")
        raise HTTPException(status_code=500, detail=f"LLM processing failed: {str(e)}")

# VLM endpoint
@app.post("/api/vlm", response_model=VLMResponse)
async def vlm_analyze(request: VLMRequest):
    """Analyze image with VLM using Ollama LLaVA on GPU 0"""
    try:
        with gpu_manager.get_gpu_0_lock():
            # Detect input language
            detected_lang = detect_language(request.prompt)
            
            # Prepare prompt based on detected language
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
                
                # Use Ollama LLaVA for VLM
                response = await asyncio.to_thread(
                    ollama.chat,
                    model="llava",
                    messages=[{
                        "role": "user",
                        "content": prompt,
                        "images": [tmp_file.name]
                    }]
                )
                
                os.unlink(tmp_file.name)
                
                return VLMResponse(
                    response=response["message"]["content"],
                    timestamp=datetime.now()
                )
    except Exception as e:
        logger.error(f"VLM error: {e}")
        raise HTTPException(status_code=500, detail=f"VLM processing failed: {str(e)}")

# Whisper endpoint
@app.post("/api/whisper", response_model=WhisperResponse)
async def whisper_transcribe(audio: UploadFile = File(...)):
    """Transcribe audio using Whisper on GPU 1"""
    try:
        # Save uploaded audio to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
            content = await audio.read()
            tmp_file.write(content)
            tmp_file.flush()
            
            # Create result queue
            result_queue = queue.Queue()
            
            # Add task to whisper queue
            whisper_queue.put((tmp_file.name, result_queue))
            
            # Wait for result with timeout
            try:
                result = result_queue.get(timeout=30)
                os.unlink(tmp_file.name)
                
                if result["success"]:
                    return WhisperResponse(
                        text=result["text"],
                        duration=result["duration"],
                        timestamp=datetime.now()
                    )
                else:
                    raise HTTPException(status_code=500, detail=result["error"])
                    
            except queue.Empty:
                os.unlink(tmp_file.name)
                raise HTTPException(status_code=408, detail="Whisper processing timeout")
                
    except Exception as e:
        logger.error(f"Whisper error: {e}")
        raise HTTPException(status_code=500, detail=f"Whisper processing failed: {str(e)}")

# TTS endpoint
@app.post("/api/tts", response_model=TTSResponse)
async def tts_generate(request: TTSRequest):
    """Generate speech using TTS on GPU 1"""
    try:
        # Create result queue
        result_queue = queue.Queue()
        
        # Add task to TTS queue
        tts_queue.put((request.text, request.voice, request.speed, result_queue))
        
        # Wait for result with timeout
        try:
            result = result_queue.get(timeout=30)
            
            if result["success"]:
                return TTSResponse(
                    audio_base64=result["audio_base64"],
                    timestamp=datetime.now()
                )
            else:
                raise HTTPException(status_code=500, detail=result["error"])
                
        except queue.Empty:
            raise HTTPException(status_code=408, detail="TTS processing timeout")
            
    except Exception as e:
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

# Status endpoint
@app.get("/api/status")
async def get_status():
    """Get system status"""
    return {
        "whisper_queue_size": whisper_queue.qsize() if whisper_queue else 0,
        "tts_queue_size": tts_queue.qsize() if tts_queue else 0,
        "gpu_0_available": torch.cuda.is_available(),
        "gpu_1_available": torch.cuda.is_available() and torch.cuda.device_count() > 1,
        "timestamp": datetime.now()
    }

# Certificate PDF endpoint
@app.get("/api/certificate/pdf")
async def generate_certificate_pdf_endpoint(name: str, date: str, certificate_id: str):
    """Generate and serve PDF certificate via GET request with query parameters"""
    try:
        logger.info(f"Generating PDF certificate for: {name}")
        
        # Generate the PDF
        pdf_data = generate_certificate_pdf(
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
        workers=1,
        log_level="info"
    )