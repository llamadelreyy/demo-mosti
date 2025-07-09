# Demo Stack Model AI - MOSTI

Aplikasi web interaktif untuk demonstrasi 4 jenis model Kecerdasan Buatan (AI) dalam Bahasa Malaysia.

## 🚀 Ciri-ciri Utama

### 10 Halaman Pembelajaran Interaktif:
1. **Selamat Datang** - Pengenalan kepada demo AI
2. **Maklumat Pembelajaran** - Overview teknologi yang akan dipelajari
3. **Input Nama** - Personalisasi pengalaman pengguna
4. **Demo LLM** - Chat dengan Large Language Model
5. **Demo VLM** - Vision Language Model dengan kamera
6. **Demo Whisper** - Speech-to-Text dengan rakaman suara
7. **Demo TTS** - Text-to-Speech dengan sintesis suara
8. **Kuiz** - 10 soalan tentang AI
9. **Keputusan** - Semakan markah dan analisis
10. **Sijil Digital** - Sijil dengan QR code dan PDF

### 4 Model AI yang Didemonstrasikan:
- **LLM (Large Language Model)** - Chat AI untuk soalan dan jawapan
- **VLM (Vision Language Model)** - Analisis imej dengan AI
- **Whisper** - Tukar suara kepada teks
- **TTS (Text-to-Speech)** - Tukar teks kepada suara

## 🛠️ Teknologi

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS + Radix UI
- **Animasi**: Framer Motion
- **Routing**: React Router DOM
- **PDF**: jsPDF + html2canvas
- **QR Code**: qrcode library

## 📋 Keperluan Sistem

- Node.js 16+ 
- npm atau yarn
- Browser moden dengan sokongan kamera dan mikrofon
- Sambungan internet untuk API AI

## 🚀 Pemasangan

1. **Clone repository**
```bash
git clone <repository-url>
cd demo-mosti
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

Edit `.env` dan masukkan API keys yang diperlukan:
```env
# AI Model Configuration
AI_BASE_URL=http://192.168.50.125:5501
AI_MODEL=Qwen3-14B
AI_API_KEY=not-needed-for-vllm

# OpenRouter Configuration (for VLM)
VITE_OPENROUTER_API_KEY=your-openrouter-api-key-here
VITE_OPENROUTER_MODEL=qwen/qwen2.5-vl-32b-instruct:free

# Application Configuration
VITE_APP_NAME=Demo Stack Model AI - MOSTI
VITE_SITE_URL=http://localhost:3000
VITE_SITE_NAME=AI Demo Stack
```

4. **Jalankan aplikasi**
```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## 🔧 Konfigurasi AI Models

### LLM (Local vLLM Server)
- Server: `http://192.168.50.125:5501`
- Model: Qwen3-14B
- Endpoint: `/v1/chat/completions` (standard OpenAI format)

### VLM (OpenRouter)
- Service: OpenRouter API
- Model: `qwen/qwen2.5-vl-32b-instruct:free`
- Memerlukan API key dari OpenRouter

### Whisper (Browser API)
- Menggunakan browser MediaRecorder API
- Placeholder untuk integrasi dengan OpenAI Whisper API

### TTS (Browser API)
- Menggunakan browser Speech Synthesis API
- Sokongan pelbagai suara dan bahasa

## 📱 Ciri-ciri Aplikasi

### Responsive Design
- Optimized untuk desktop dan mobile
- Touch-friendly interface
- Adaptive layouts

### Accessibility
- Proper ARIA labels
- Keyboard navigation
- Screen reader support

### Progressive Features
- Camera access untuk VLM
- Microphone access untuk Whisper
- File upload support
- PDF generation
- QR code generation

## 🎯 Penggunaan

1. **Mula di halaman Selamat Datang**
2. **Baca maklumat pembelajaran**
3. **Masukkan nama untuk personalisasi**
4. **Jelajahi setiap demo AI:**
   - Chat dengan LLM
   - Ambil gambar dan analisis dengan VLM
   - Rakam suara untuk Whisper
   - Jana suara dengan TTS
5. **Jawab kuiz 10 soalan**
6. **Semak keputusan**
7. **Dapatkan sijil digital**

## 🔒 Privasi & Keselamatan

- Tiada data pengguna disimpan di server
- Semua data hanya dalam browser session
- API keys disimpan dalam environment variables
- Sijil dijana secara local

## 🚀 Deployment

### Build untuk production
```bash
npm run build
```

### Preview build
```bash
npm run preview
```

### Deploy ke hosting
Upload folder `dist` ke web hosting pilihan anda.

## 🛠️ Development

### Struktur Projek
```
src/
├── components/
│   ├── ui/                 # Radix UI components
│   ├── layout/            # Layout components
│   ├── common/            # Shared components
├── pages/                 # Page components
├── context/               # React Context
├── services/              # API services
├── utils/                 # Utility functions
├── hooks/                 # Custom hooks
└── styles/                # Global styles
```

### Available Scripts
- `npm run dev` - Development server
- `npm run build` - Build untuk production
- `npm run preview` - Preview build
- `npm run lint` - ESLint checking

## 🤝 Kontribusi

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Buat Pull Request

## 📄 Lesen

Projek ini adalah untuk tujuan demonstrasi MOSTI.

## 📞 Sokongan

Untuk sokongan teknikal atau pertanyaan, sila hubungi pasukan MOSTI.

---

**Dibina dengan ❤️ untuk MOSTI - Kementerian Sains, Teknologi dan Inovasi Malaysia**