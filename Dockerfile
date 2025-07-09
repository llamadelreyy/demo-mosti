# Multi-stage Docker build for AI Demo Application
FROM nvidia/cuda:12.1-devel-ubuntu22.04 as backend-base

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV CUDA_VISIBLE_DEVICES=0,1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    wget \
    git \
    build-essential \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.ai/install.sh | sh

# Create app directory
WORKDIR /app

# Copy backend requirements and install Python dependencies
COPY backend/requirements.txt /app/backend/
RUN python3 -m pip install --upgrade pip
RUN python3 -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
RUN python3 -m pip install -r backend/requirements.txt

# Download AI models
RUN python3 -c "import whisper; whisper.load_model('turbo')"
RUN python3 -c "from TTS.api import TTS; TTS('tts_models/multilingual/multi-dataset/xtts_v2')"

# Frontend build stage
FROM node:18-alpine as frontend-build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Final stage
FROM nvidia/cuda:12.1-runtime-ubuntu22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV CUDA_VISIBLE_DEVICES=0,1

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    nginx \
    supervisor \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.ai/install.sh | sh

# Create app directory
WORKDIR /app

# Copy Python dependencies from backend-base
COPY --from=backend-base /usr/local/lib/python3.10/dist-packages /usr/local/lib/python3.10/dist-packages
COPY --from=backend-base /usr/local/bin /usr/local/bin

# Copy backend code
COPY backend/ /app/backend/

# Copy frontend build
COPY --from=frontend-build /app/dist /app/frontend/

# Copy configuration files
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/start-services.sh /app/start-services.sh

# Make scripts executable
RUN chmod +x /app/start-services.sh

# Expose ports
EXPOSE 80 8000 11434

# Start services
CMD ["/app/start-services.sh"]