#!/bin/bash

# AI Demo Docker Services Startup Script
echo "🚀 Starting AI Demo services in Docker..."

# Create log directories
mkdir -p /var/log/supervisor

# Start Ollama service first
echo "🦙 Starting Ollama service..."
ollama serve &
sleep 10

# Load AI models
echo "📥 Loading AI models..."
ollama pull gemma2:4b &
ollama pull llava &

# Wait for models to download
wait

echo "✅ AI models loaded successfully"

# Start supervisor to manage all services
echo "🔧 Starting all services with supervisor..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf