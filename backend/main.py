import asyncio
import os
import logging
from contextlib import asynccontextmanager
from typing import List, Optional
import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import torch
import whisper
import ollama
from TTS.api import TTS
import io
import base64
import tempfile
import aiofiles
from concurrent.futures import ThreadPoolExecutor
import threading
import queue
import time
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for models
whisper_model = None
tts_model = None
executor = None
whisper_queue = None
tts_queue = None

# GPU allocation
GPU_0 = "cuda:0"  # For LLM (Ollama Gemma2:4b) and VLM (LLaVA)
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
    voice: str = "tts_models/multilingual/multi-dataset/xtts_v2"
    speed: float = 1.0
    user_name: str = "User"

class WhisperResponse(BaseModel):
    text: str
    duration: float
    timestamp: datetime

class TTSResponse(BaseModel):
    audio_base64: str
    timestamp: datetime

# Initialize models
async def init_whisper_model():
    """Initialize Whisper model on GPU 1"""
    global whisper_model
    try:
        with gpu_manager.get_gpu_1_lock():
            logger.info("Loading Whisper model on GPU 1...")
            device = GPU_1 if torch.cuda.is_available() else "cpu"
            whisper_model = whisper.load_model("turbo", device=device)
            logger.info(f"Whisper model loaded successfully on {device}")
    except Exception as e:
        logger.error(f"Failed to load Whisper model: {e}")
        raise

async def init_tts_model():
    """Initialize TTS model on GPU 1"""
    global tts_model
    try:
        with gpu_manager.get_gpu_1_lock():
            logger.info("Loading TTS model on GPU 1...")
            device = GPU_1 if torch.cuda.is_available() else "cpu"
            tts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
            logger.info(f"TTS model loaded successfully on {device}")
    except Exception as e:
        logger.error(f"Failed to load TTS model: {e}")
        raise

async def init_ollama():
    """Initialize Ollama models on GPU 0"""
    try:
        logger.info("Initializing Ollama models on GPU 0...")
        
        # Set CUDA_VISIBLE_DEVICES for Ollama to use GPU 0
        os.environ["CUDA_VISIBLE_DEVICES"] = "0"
        
        # Pull models if not exists
        try:
            await asyncio.to_thread(ollama.pull, "gemma2:4b")
            logger.info("Gemma2:4b model ready")
        except Exception as e:
            logger.warning(f"Could not pull gemma2:4b: {e}")
            
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
                    result = whisper_model.transcribe(audio_file)
                    result_queue.put({
                        "text": result["text"],
                        "duration": result.get("duration", 0),
                        "success": True
                    })
                except Exception as e:
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
    """Worker function for TTS processing"""
    global tts_queue
    while True:
        try:
            task = tts_queue.get(timeout=1)
            if task is None:
                break
                
            text, voice, speed, result_queue = task
            
            with gpu_manager.get_gpu_1_lock():
                try:
                    # Generate audio
                    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
                        tts_model.tts_to_file(
                            text=text,
                            file_path=tmp_file.name,
                            speed=speed
                        )
                        
                        # Read and encode audio
                        with open(tmp_file.name, "rb") as audio_file:
                            audio_data = audio_file.read()
                            audio_base64 = base64.b64encode(audio_data).decode()
                            
                        os.unlink(tmp_file.name)
                        
                        result_queue.put({
                            "audio_base64": audio_base64,
                            "success": True
                        })
                except Exception as e:
                    result_queue.put({
                        "error": str(e),
                        "success": False
                    })
                    
            tts_queue.task_done()
        except queue.Empty:
            continue
        except Exception as e:
            logger.error(f"TTS worker error: {e}")

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

# LLM endpoint
@app.post("/api/llm", response_model=LLMResponse)
async def llm_chat(request: LLMRequest):
    """Chat with LLM using Ollama Gemma2:4b on GPU 0"""
    try:
        with gpu_manager.get_gpu_0_lock():
            # Use Ollama for LLM
            response = await asyncio.to_thread(
                ollama.chat,
                model="gemma2:4b",
                messages=[{
                    "role": "user",
                    "content": f"Jawab dalam Bahasa Malaysia: {request.message}"
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
                        "content": f"Jawab dalam Bahasa Malaysia: {request.prompt}",
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

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        workers=1,
        log_level="info"
    )