import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Play, Pause, Square, Download, Lightbulb, Zap, Volume2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import apiService from '../services/api';

const WhisperDemoPage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const { state, dispatch } = useApp();
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Setup audio analysis for visualization
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      // Start audio level monitoring
      const updateAudioLevel = () => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);
        animationRef.current = requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // Stop audio level monitoring
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        setAudioLevel(0);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      dispatch({ type: 'SET_WHISPER_RECORDING', payload: true });
      
      // Start timer
      setRecordingTime(0);
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Tidak dapat mengakses mikrofon. Sila pastikan kebenaran diberikan.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      dispatch({ type: 'SET_WHISPER_RECORDING', payload: false });
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    dispatch({ type: 'SET_WHISPER_LOADING', payload: true });

    try {
      // Call the real Whisper API
      const response = await apiService.transcribeAudio(audioBlob);
      
      const transcription = {
        id: Date.now(),
        audioUrl: audioUrl,
        text: response.text || response.transcription || 'Maaf, tidak dapat mentranskripsikan audio pada masa ini.',
        timestamp: new Date(),
        duration: recordingTime,
        language: response.language || 'ms',
        confidence: response.confidence || null
      };

      dispatch({ type: 'ADD_WHISPER_TRANSCRIPTION', payload: transcription });
    } catch (error) {
      console.error('Whisper API Error:', error);
      const errorTranscription = {
        id: Date.now(),
        audioUrl: audioUrl,
        text: 'Maaf, terdapat masalah dengan sambungan ke model Whisper. Sila pastikan backend server berjalan dan cuba lagi.',
        timestamp: new Date(),
        duration: recordingTime,
        isError: true
      };
      dispatch({ type: 'ADD_WHISPER_TRANSCRIPTION', payload: errorTranscription });
    } finally {
      dispatch({ type: 'SET_WHISPER_LOADING', payload: false });
    }
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `recording-${Date.now()}.wav`;
      a.click();
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-2 h-full flex flex-col">
      <div className="grid lg:grid-cols-3 gap-2 flex-1">
        {/* Info Panel */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded shadow-sm p-2 h-full">
            <div className="flex items-center space-x-2 mb-2">
              <motion.div
                className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Mic className="text-white" size={16} />
              </motion.div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">Whisper AI</h2>
                <p className="text-xs text-gray-600">Speech-to-Text Model</p>
              </div>
            </div>

            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <motion.div
                className="bg-purple-50 rounded-lg p-2"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-1 mb-1">
                  <Lightbulb className="text-purple-600" size={12} />
                  <h3 className="font-semibold text-purple-800 text-xs">Apa itu Whisper?</h3>
                </div>
                <p className="text-purple-700 text-xs mb-2">
                  Whisper adalah model AI canggih yang dibangunkan oleh OpenAI untuk menukar pertuturan kepada teks dengan ketepatan tinggi.
                </p>
                <div className="text-purple-700 text-xs space-y-1">
                  <p><strong>Teknologi Asas:</strong></p>
                  <p>• Transformer neural network architecture</p>
                  <p>• Dilatih dengan 680,000 jam audio pelbagai bahasa</p>
                  <p>• Menggunakan attention mechanism untuk fokus pada bahagian audio yang relevan</p>
                  <p>• Pemprosesan mel-spectrogram untuk analisis frekuensi audio</p>
                </div>
              </motion.div>

              <motion.div
                className="bg-blue-50 rounded-lg p-2"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-1 mb-1">
                  <Zap className="text-blue-600" size={12} />
                  <h3 className="font-semibold text-blue-800 text-xs">Keupayaan Whisper</h3>
                </div>
                <div className="text-blue-700 text-xs space-y-1">
                  <p><strong>Sokongan Bahasa:</strong></p>
                  <p>• 99 bahasa termasuk Bahasa Malaysia</p>
                  <p>• Pengenalan dialek dan loghat tempatan</p>
                  <p>• Terjemahan automatik ke bahasa Inggeris</p>
                  
                  <p className="mt-2"><strong>Ciri-ciri Teknikal:</strong></p>
                  <p>• Ketepatan hingga 95% dalam keadaan ideal</p>
                  <p>• Pemprosesan audio real-time</p>
                  <p>• Pengenalan bunyi latar dan pembersihan noise</p>
                  <p>• Timestamp untuk setiap segmen perkataan</p>
                </div>
              </motion.div>

              <motion.div
                className="bg-green-50 rounded-lg p-2"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-1 mb-1">
                  <Volume2 className="text-green-600" size={12} />
                  <h3 className="font-semibold text-green-800 text-xs">Cara Kerja Speech Recognition</h3>
                </div>
                <div className="text-green-700 text-xs space-y-1">
                  <p><strong>Proses Pemprosesan Audio:</strong></p>
                  <p>1. <strong>Pengambilan Audio:</strong> Mikrofon menangkap gelombang bunyi</p>
                  <p>2. <strong>Digitalisasi:</strong> Analog-to-digital conversion pada 16kHz</p>
                  <p>3. <strong>Mel-Spectrogram:</strong> Transformasi ke domain frekuensi</p>
                  <p>4. <strong>Feature Extraction:</strong> Neural network mengekstrak ciri audio</p>
                  <p>5. <strong>Sequence Modeling:</strong> Transformer memetakan audio ke teks</p>
                  <p>6. <strong>Language Modeling:</strong> Konteks linguistik untuk ketepatan</p>
                </div>
              </motion.div>

              <motion.div
                className="bg-orange-50 rounded-lg p-2"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-1 mb-1">
                  <Lightbulb className="text-orange-600" size={12} />
                  <h3 className="font-semibold text-orange-800 text-xs">Aplikasi Dunia Sebenar</h3>
                </div>
                <div className="text-orange-700 text-xs space-y-1">
                  <p><strong>Industri & Kegunaan:</strong></p>
                  <p>• <strong>Perubatan:</strong> Transkripsi nota doktor dan laporan</p>
                  <p>• <strong>Pendidikan:</strong> Subtitle kuliah dan bahan pembelajaran</p>
                  <p>• <strong>Media:</strong> Subtitle video dan podcast</p>
                  <p>• <strong>Perniagaan:</strong> Minit mesyuarat dan panggilan</p>
                  <p>• <strong>Aksesibiliti:</strong> Bantuan untuk OKU pendengaran</p>
                  <p>• <strong>Terjemahan:</strong> Komunikasi antara bahasa</p>
                </div>
              </motion.div>

              <motion.div
                className="bg-red-50 rounded-lg p-2"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-1 mb-1">
                  <Volume2 className="text-red-600" size={12} />
                  <h3 className="font-semibold text-red-800 text-xs">Tips Optimum untuk Transkripsi</h3>
                </div>
                <div className="text-red-700 text-xs space-y-1">
                  <p><strong>Persekitaran Rakaman:</strong></p>
                  <p>• Bilik senyap dengan minimum echo</p>
                  <p>• Jarak mikrofon 15-30cm dari mulut</p>
                  <p>• Elakkan bunyi latar seperti kipas atau traffic</p>
                  
                  <p className="mt-2"><strong>Teknik Pertuturan:</strong></p>
                  <p>• Bercakap dengan kelajuan sederhana (150-180 wpm)</p>
                  <p>• Sebutan yang jelas dan tidak bergumam</p>
                  <p>• Pause sebentar antara ayat</p>
                  <p>• Elakkan "um", "ah" yang berlebihan</p>
                </div>
              </motion.div>

              <motion.div
                className="bg-indigo-50 rounded-lg p-2"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-1 mb-1">
                  <Zap className="text-indigo-600" size={12} />
                  <h3 className="font-semibold text-indigo-800 text-xs">Ketepatan & Limitasi</h3>
                </div>
                <div className="text-indigo-700 text-xs space-y-1">
                  <p><strong>Faktor Ketepatan:</strong></p>
                  <p>• Kualiti audio: 95% (studio) vs 70% (bising)</p>
                  <p>• Bahasa: Inggeris (98%) vs bahasa lain (85-95%)</p>
                  <p>• Dialek: Standard (95%) vs dialek kuat (80%)</p>
                  
                  <p className="mt-2"><strong>Cabaran Teknikal:</strong></p>
                  <p>• Pertuturan pantas atau bergumam</p>
                  <p>• Istilah teknikal atau nama khas</p>
                  <p>• Audio berkualiti rendah atau terdistorsi</p>
                  <p>• Pelbagai penutur dalam satu rakaman</p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Main Interface */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 flex flex-col"
        >
          <div className="bg-white rounded shadow-sm overflow-hidden flex flex-col flex-1">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-2">
              <div className="flex items-center space-x-2">
                <Mic size={16} />
                <div>
                  <h3 className="font-semibold text-sm">Rakam & Transkripsi Suara</h3>
                  <p className="text-purple-100 text-xs">
                    Rakam suara anda dan lihat bagaimana AI menukarnya kepada teks, {state.user.name}!
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2 flex-1 flex flex-col min-h-0">
              {/* Recording Interface */}
              <div className="text-center mb-2 flex-1 flex flex-col justify-center" style={{ maxHeight: '150px' }}>
                {/* Audio Visualizer */}
                <motion.div
                  className="w-16 h-16 mx-auto mb-2 relative"
                  animate={{ scale: isRecording ? [1, 1.1, 1] : 1 }}
                  transition={{ duration: 1, repeat: isRecording ? Infinity : 0 }}
                >
                  <div className="w-full h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center relative overflow-hidden">
                    {/* Audio level visualization */}
                    {isRecording && (
                      <motion.div
                        className="absolute inset-0 bg-white/20 rounded-full"
                        animate={{ scale: 1 + (audioLevel / 255) * 0.5 }}
                        transition={{ duration: 0.1 }}
                      />
                    )}
                    
                    <motion.button
                      onClick={isRecording ? stopRecording : startRecording}
                      className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg z-10"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {isRecording ? (
                        <Square className="text-red-500" size={12} fill="currentColor" />
                      ) : (
                        <Mic className="text-purple-600" size={12} />
                      )}
                    </motion.button>
                  </div>
                </motion.div>

                {/* Recording Status */}
                <AnimatePresence>
                  {isRecording && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="mb-2"
                    >
                      <div className="flex items-center justify-center space-x-1 text-red-600">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="font-semibold text-xs">MERAKAM</span>
                      </div>
                      <p className="text-sm font-mono text-gray-800 mt-1">
                        {formatTime(recordingTime)}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isRecording && !audioBlob && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-1">
                      Tekan untuk Mula Merakam
                    </h3>
                    <p className="text-gray-600 text-xs">
                      Bercakap dengan jelas untuk hasil transkripsi yang terbaik
                    </p>
                  </div>
                )}
              </div>

              {/* Audio Playback and Controls */}
              {audioBlob && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  {/* Audio Player */}
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 text-sm">Rakaman Audio</h3>
                      <span className="text-xs text-gray-600">
                        Tempoh: {formatTime(recordingTime)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <motion.button
                        onClick={isPlaying ? pauseAudio : playAudio}
                        className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {isPlaying ? <Pause size={10} /> : <Play size={10} />}
                      </motion.button>
                      
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div className="bg-purple-500 h-1.5 rounded-full w-0" />
                      </div>
                      
                      <motion.button
                        onClick={downloadAudio}
                        className="p-1 text-gray-600 hover:text-purple-600 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Download size={12} />
                      </motion.button>
                    </div>
                    
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onEnded={handleAudioEnded}
                      className="hidden"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <motion.button
                      onClick={transcribeAudio}
                      disabled={state.aiDemos.whisper.isLoading}
                      className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all text-sm ${
                        state.aiDemos.whisper.isLoading
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-purple-500 text-white hover:bg-purple-600'
                      }`}
                      whileHover={!state.aiDemos.whisper.isLoading ? { scale: 1.02 } : {}}
                      whileTap={!state.aiDemos.whisper.isLoading ? { scale: 0.98 } : {}}
                    >
                      {state.aiDemos.whisper.isLoading ? (
                        <div className="flex items-center justify-center space-x-1">
                          <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs">Memproses...</span>
                        </div>
                      ) : (
                        'Transkripsi Audio'
                      )}
                    </motion.button>
                    
                    <motion.button
                      onClick={resetRecording}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Rakam Semula
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Transcription Results */}
              {state.aiDemos.whisper.transcriptions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 space-y-1 overflow-y-auto"
                  style={{ maxHeight: '100px' }}
                >
                  <h3 className="font-semibold text-gray-800 text-xs">Hasil Transkripsi:</h3>
                  {state.aiDemos.whisper.transcriptions.slice(-1).map((transcription) => (
                    <div key={transcription.id} className="bg-gray-50 rounded p-1.5">
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="text-xs text-gray-600">
                          Tempoh: {formatTime(transcription.duration)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {transcription.timestamp.toLocaleTimeString('ms-MY')}
                        </span>
                      </div>
                      <p className="text-gray-800 text-xs">
                        {transcription.text}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WhisperDemoPage;