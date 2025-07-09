# Demo Stack Model AI - MOSTI

Aplikasi web interaktif untuk demonstrasi 4 jenis model Kecerdasan Buatan (AI) dalam Bahasa Malaysia dengan backend FastAPI yang lengkap.

## 🚀 Ciri-ciri Utama

### 10 Halaman Pembelajaran Interaktif:
1. **Selamat Datang** - Pengenalan kepada demo AI
2. **Maklumat Pembelajaran** - Overview teknologi yang akan dipelajari
3. **Input Nama** - Personalisasi pengalaman pengguna
4. **Demo LLM** - Chat dengan Large Language Model (Gemma2:4b)
5. **Demo VLM** - Vision Language Model dengan kamera (LLaVA)
6. **Demo Whisper** - Speech-to-Text dengan rakaman suara (Whisper Turbo)
7. **Demo TTS** - Text-to-Speech dengan sintesis suara (XTTS v2)
8. **Kuiz** - 10 soalan tentang AI
9. **Keputusan** - Semakan markah dan analisis
10. **Sijil Digital** - Sijil dengan QR code dan PDF

### 4 Model AI yang Didemonstrasikan:
- **LLM (Large Language Model)** - Gemma2:4b melalui Ollama
- **VLM (Vision Language Model)** - LLaVA untuk analisis imej
- **Whisper** - OpenAI Whisper Turbo untuk speech-to-text
- **TTS (Text-to-Speech)** - XTTS v2 untuk sintesis suara natural

## 🛠️ Teknologi

### Frontend
- **React 18** + Vite
- **Tailwind CSS** + Radix UI
- **Framer Motion** untuk animasi
- **React Router DOM** untuk routing
- **jsPDF** + html2canvas untuk PDF
- **qrcode** library untuk QR codes

### Backend
- **FastAPI** dengan Python 3.8+
- **Ollama** untuk LLM dan VLM
- **OpenAI Whisper** untuk speech-to-text
- **TTS (XTTS v2)** untuk text-to-speech
- **PyTorch** dengan sokongan CUDA
- **Async/await** untuk concurrent processing

### Infrastructure
- **Docker** support dengan multi-stage builds
- **Nginx** untuk reverse proxy
- **Supervisor** untuk process management
- **GPU allocation** untuk 20 concurrent users

## 📋 Keperluan Sistem

### Minimum Requirements
- **CPU**: 8 cores (Intel i7 atau AMD Ryzen 7)
- **RAM**: 32GB DDR4
- **GPU**: 2x RTX 4090 (24GB VRAM each)
- **Storage**: 100GB SSD free space
- **OS**: Ubuntu 22.04 LTS atau Windows 11

### Software Requirements
- **Node.js** 18+
- **Python** 3.8+
- **Docker** 24+ (optional)
- **NVIDIA Drivers** 535+ dengan CUDA 12.1
- **Browser** moden dengan sokongan kamera dan mikrofon

## 🚀 Pemasangan Cepat

### Menggunakan Script Automatik (Disyorkan)

1. **Clone repository**
```bash
git clone <repository-url>
cd demo-mosti
```

2. **Jalankan setup script**
```bash
chmod +x start.sh
./start.sh
```

Script ini akan:
- ✅ Memeriksa keperluan sistem
- 📦 Memasang semua dependencies
- 🦙 Setup Ollama dan download models
- 🐍 Setup Python virtual environment
- 🚀 Memulakan frontend dan backend secara serentak

### Pemasangan Manual

#### 1. Setup Frontend
```bash
# Install Node.js dependencies
npm install

# Copy environment file
cp .env.example .env
```

#### 2. Setup Backend
```bash
# Create Python virtual environment
cd backend
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install -r requirements.txt

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
ollama serve &

# Download AI models
ollama pull gemma2:4b
ollama pull llava

# Download Whisper and TTS models
python3 -c "import whisper; whisper.load_model('turbo')"
python3 -c "from TTS.api import TTS; TTS('tts_models/multilingual/multi-dataset/xtts_v2')"
```

#### 3. Jalankan Aplikasi
```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
python main.py

# Terminal 2: Frontend
npm run dev
```

## 🐳 Docker Deployment

### Build dan Run dengan Docker Compose
```bash
# Build dan start semua services
docker-compose up --build

# Run in background
docker-compose up -d --build
```

### Manual Docker Build
```bash
# Build image
docker build -t ai-demo .

# Run container dengan GPU support
docker run --gpus all -p 80:80 -p 8000:8000 ai-demo
```

## 🔧 Konfigurasi

### Environment Variables
```env
# Backend API Configuration
VITE_API_URL=http://localhost:8000
VITE_API_TIMEOUT=300000

# Application Configuration
VITE_APP_NAME=Demo Stack Model AI - MOSTI
VITE_SITE_URL=http://localhost:5173
VITE_SITE_NAME=AI Demo Stack

# Development Settings
VITE_DEV_MODE=true
VITE_DEBUG_API=false
```

### GPU Allocation
- **GPU 0**: LLM (Gemma2:4b) + VLM (LLaVA)
- **GPU 1**: Whisper (Speech-to-Text) + TTS (Text-to-Speech)

### Concurrent Users
- **Capacity**: 20 concurrent users
- **Queue System**: ThreadPoolExecutor dengan worker threads
- **Load Balancing**: Round-robin GPU allocation

## 📡 API Endpoints

### Backend API (Port 8000)
- `POST /llm/chat` - Chat dengan LLM
- `POST /vlm/analyze` - Analisis imej dengan VLM
- `POST /whisper/transcribe` - Speech-to-text transcription
- `POST /tts/synthesize` - Text-to-speech synthesis
- `GET /health` - Health check
- `GET /models` - List available models
- `GET /docs` - API documentation (Swagger UI)

### Frontend (Port 5173)
- Aplikasi React dengan routing
- Real-time API integration
- Responsive design untuk semua devices

## 🎯 Penggunaan

1. **Akses aplikasi** di `http://localhost:5173`
2. **Mula di halaman Selamat Datang**
3. **Baca maklumat pembelajaran**
4. **Masukkan nama untuk personalisasi**
5. **Jelajahi setiap demo AI:**
   - Chat dengan LLM (Gemma2:4b)
   - Ambil gambar dan analisis dengan VLM (LLaVA)
   - Rakam suara untuk Whisper transcription
   - Jana suara dengan TTS (XTTS v2)
6. **Jawab kuiz 10 soalan**
7. **Semak keputusan**
8. **Dapatkan sijil digital**

## 🔒 Privasi & Keselamatan

- ✅ Semua model berjalan secara local
- ✅ Tiada data pengguna dihantar ke cloud
- ✅ Session-based storage sahaja
- ✅ CORS protection untuk API
- ✅ Rate limiting untuk API endpoints
- ✅ GPU memory management

## 🚀 Performance Optimization

### Frontend
- Code splitting dengan React.lazy()
- Image optimization dan lazy loading
- Memoization untuk expensive operations
- Efficient re-rendering dengan React.memo

### Backend
- Async/await untuk non-blocking operations
- Connection pooling untuk database
- Model caching untuk faster inference
- Queue system untuk concurrent requests

### Infrastructure
- Nginx reverse proxy dengan caching
- Gzip compression untuk static assets
- Health checks dan auto-restart
- Resource monitoring dan alerting

## 🛠️ Development

### Struktur Projek
```
demo-mosti/
├── src/                    # Frontend React app
│   ├── components/         # UI components
│   ├── pages/             # Page components
│   ├── context/           # React Context
│   ├── services/          # API services
│   └── utils/             # Utility functions
├── backend/               # FastAPI backend
│   ├── main.py           # FastAPI application
│   ├── requirements.txt  # Python dependencies
│   └── models/           # AI model handlers
├── docker/               # Docker configuration
├── start.sh             # Startup script
├── Dockerfile           # Docker build file
└── docker-compose.yml   # Docker Compose config
```

### Available Scripts
- `./start.sh` - Start full stack application
- `npm run dev` - Frontend development server
- `npm run build` - Build untuk production
- `python backend/main.py` - Backend server
- `docker-compose up` - Docker deployment

### Development Workflow
1. **Frontend changes**: Hot reload dengan Vite
2. **Backend changes**: Auto-reload dengan uvicorn
3. **API testing**: Swagger UI di `/docs`
4. **Debugging**: Console logs dan error handling

## 📊 Monitoring & Logging

### Application Logs
- Frontend: Browser console dan network tab
- Backend: FastAPI logs dengan structured logging
- GPU: nvidia-smi monitoring
- System: Resource usage tracking

### Health Checks
- `/health` endpoint untuk backend status
- Model availability checks
- GPU memory monitoring
- Queue status tracking

## 🤝 Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 🐛 Troubleshooting

### Common Issues

**Backend tidak start:**
```bash
# Check Python version
python3 --version

# Check CUDA availability
nvidia-smi

# Check Ollama service
ollama list
```

**Frontend tidak connect ke backend:**
```bash
# Check backend is running
curl http://localhost:8000/health

# Check environment variables
cat .env
```

**GPU memory issues:**
```bash
# Check GPU usage
nvidia-smi

# Restart Ollama
pkill ollama
ollama serve &
```

**Model download gagal:**
```bash
# Manual model download
ollama pull gemma2:4b
ollama pull llava

# Check disk space
df -h
```

## 📄 Lesen

Projek ini adalah untuk tujuan demonstrasi MOSTI.

## 📞 Sokongan

Untuk sokongan teknikal atau pertanyaan:
- **Email**: support@mosti.gov.my
- **GitHub Issues**: Buat issue di repository ini
- **Documentation**: Rujuk `/docs` endpoint untuk API docs

---

**Dibina dengan ❤️ untuk MOSTI - Kementerian Sains, Teknologi dan Inovasi Malaysia**

### System Requirements Summary
- **Minimum**: 2x RTX 4090, 32GB RAM, 8-core CPU
- **Recommended**: 2x RTX 4090, 64GB RAM, 16-core CPU
- **Concurrent Users**: Up to 20 users simultaneously
- **Models**: Gemma2:4b, LLaVA, Whisper Turbo, XTTS v2