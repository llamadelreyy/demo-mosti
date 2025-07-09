#!/bin/bash

# AI Demo Full Stack Startup Script
echo "🚀 Starting AI Demo Full Stack Application..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -i:$1 >/dev/null 2>&1
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    
    # Kill background processes
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "  ✅ Frontend stopped"
    fi
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "  ✅ Backend stopped"
    fi
    
    if [ ! -z "$OLLAMA_PID" ]; then
        kill $OLLAMA_PID 2>/dev/null
        echo "  ✅ Ollama stopped"
    fi
    
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "🔍 Checking system requirements..."

# Check Node.js
if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node --version)"
    exit 1
fi
echo "✅ Node.js version: $(node --version)"

# Check Python
if ! command_exists python3; then
    echo "❌ Python 3.8+ is required but not found."
    exit 1
fi

python_version=$(python3 --version 2>&1 | grep -Po '(?<=Python )\d+\.\d+')
echo "✅ Python version: $python_version"

# Check GPU
if command_exists nvidia-smi; then
    echo "✅ NVIDIA GPU detected:"
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits | head -2
else
    echo "⚠️  No NVIDIA GPU detected. Will run on CPU (slower performance)"
fi

# Setup Frontend
echo ""
echo "📦 Setting up Frontend..."
if [ ! -d "node_modules" ]; then
    echo "  Installing npm dependencies..."
    npm install
else
    echo "  ✅ npm dependencies already installed"
fi

# Setup Backend
echo ""
echo "🐍 Setting up Backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "  Creating Python virtual environment..."
    
    # Check if python3-venv is installed
    if ! python3 -c "import venv" 2>/dev/null; then
        echo "  📦 Installing python3-venv package..."
        sudo apt update && sudo apt install -y python3-venv python3-pip
        if [ $? -ne 0 ]; then
            echo "  ❌ Failed to install python3-venv. Please run: sudo apt install python3-venv python3-pip"
            exit 1
        fi
    fi
    
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "  ❌ Failed to create virtual environment"
        exit 1
    fi
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
if [ ! -f "venv/installed.flag" ]; then
    echo "  Installing Python dependencies..."
    pip install --upgrade pip
    
    # Install PyTorch with CUDA support
    echo "  Installing PyTorch with CUDA..."
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
    
    # Install other requirements
    pip install -r requirements.txt
    
    # Mark as installed
    touch venv/installed.flag
    echo "  ✅ Python dependencies installed"
else
    echo "  ✅ Python dependencies already installed"
fi

# Setup Ollama
echo ""
echo "🦙 Setting up Ollama..."
if ! command_exists ollama; then
    echo "  Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
else
    echo "  ✅ Ollama already installed"
fi

# Stop system Ollama service if running
echo "  Stopping system Ollama service..."
sudo systemctl stop ollama 2>/dev/null || true

# Start Ollama service with keep alive forever
if ! port_in_use 11434; then
    echo "  Starting Ollama service with keep-alive forever..."
    OLLAMA_KEEP_ALIVE=-1 ollama serve &
    OLLAMA_PID=$!
    sleep 10
else
    echo "  ✅ Ollama service already running"
fi

# Pull required models
echo "  Checking AI models..."
if ! ollama list | grep -q "llama3.2:1b"; then
    echo "  Downloading Llama3.2:1b (SLM) model..."
    ollama pull llama3.2:1b
else
    echo "  ✅ Llama3.2:1b model ready"
fi

if ! ollama list | grep -q "llava"; then
    echo "  Downloading LLaVA model..."
    ollama pull llava
else
    echo "  ✅ LLaVA model ready"
fi

# Download Whisper and TTS models (using virtual environment)
echo "  Checking Whisper model..."
source venv/bin/activate
python3 -c "
try:
    import whisper
    whisper.load_model('base')
    print('  ✅ Whisper model ready')
except:
    print('  📥 Downloading Whisper model...')
    import whisper
    whisper.load_model('base')
" 2>/dev/null || echo "  ⚠️  Whisper will be downloaded when needed"

echo "  Checking TTS model..."
python3 -c "
try:
    import pyttsx3
    engine = pyttsx3.init()
    print('  ✅ TTS (pyttsx3) ready')
except:
    print('  ⚠️  TTS will use system speech synthesis')
" 2>/dev/null || echo "  ⚠️  TTS will use system speech synthesis"

cd ..

echo ""
echo "🚀 Starting services..."

# Start Backend with Ollama keep-alive setting
echo "  Starting Backend server..."
cd backend
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    OLLAMA_KEEP_ALIVE=-1 python3 main.py &
    BACKEND_PID=$!
else
    echo "  ❌ Virtual environment not found. Creating it..."
    
    # Check if python3-venv is installed
    if ! python3 -c "import venv" 2>/dev/null; then
        echo "  📦 Installing python3-venv package..."
        sudo apt update && sudo apt install -y python3-venv python3-pip
        if [ $? -ne 0 ]; then
            echo "  ❌ Failed to install python3-venv. Please run: sudo apt install python3-venv python3-pip"
            exit 1
        fi
    fi
    
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "  ❌ Failed to create virtual environment"
        exit 1
    fi
    
    source venv/bin/activate
    pip install --upgrade pip
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
    pip install -r requirements.txt
    OLLAMA_KEEP_ALIVE=-1 python3 main.py &
    BACKEND_PID=$!
fi
cd ..

# Wait for backend to start
echo "  Waiting for backend to initialize..."
sleep 10

# Check if backend is running
if port_in_use 8002; then
    echo "  ✅ Backend server running on http://localhost:8002"
else
    echo "  ❌ Backend failed to start"
    cleanup
    exit 1
fi

# Start Frontend
echo "  Starting Frontend server..."
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
echo "  Waiting for frontend to initialize..."
sleep 5

# Check if frontend is running
if port_in_use 5173; then
    echo "  ✅ Frontend server running on http://localhost:5173"
else
    echo "  ❌ Frontend failed to start"
    cleanup
    exit 1
fi

echo ""
echo "🎉 All services started successfully!"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:8002"
echo "📚 API Docs: http://localhost:8002/docs"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Keep script running and wait for user interrupt
while true; do
    sleep 1
done