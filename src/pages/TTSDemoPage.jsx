import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Play, Pause, Square, Download, Lightbulb, Zap, Type, VolumeX } from 'lucide-react';
import { useApp } from '../context/AppContext';
import apiService from '../services/api';

const TTSDemoPage = () => {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [speechRate, setSpeechRate] = useState(1);
  const [speechPitch, setSpeechPitch] = useState(1);
  const [availableVoices, setAvailableVoices] = useState([]);
  
  const { state, dispatch } = useApp();
  const audioRef = useRef(null);

  // Load available voices for fallback
  React.useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      const malayVoices = voices.filter(voice =>
        voice.lang.includes('ms') || voice.lang.includes('id') || voice.lang.includes('en')
      );
      setAvailableVoices(malayVoices.length > 0 ? malayVoices : voices.slice(0, 5));
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const generateSpeech = async () => {
    if (!text.trim()) return;

    dispatch({ type: 'SET_TTS_GENERATING', payload: true });

    try {
      // Stop any current speech
      speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Call the real TTS API with default voice and speed
      const audioBlob = await apiService.synthesizeSpeech(text.trim(), 'female', speechRate);
      
      // Create audio URL and play
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onloadeddata = () => {
          audioRef.current.play();
          setIsPlaying(true);
        };
        
        audioRef.current.onended = () => {
          setIsPlaying(false);
          dispatch({ type: 'SET_TTS_GENERATING', payload: false });
        };
        
        audioRef.current.onerror = (event) => {
          console.error('Audio playback error:', event);
          setIsPlaying(false);
          dispatch({ type: 'SET_TTS_GENERATING', payload: false });
        };
      }

      // Add to history
      const audioData = {
        id: Date.now(),
        text: text.trim(),
        audioUrl: audioUrl,
        voice: 'AI Voice',
        rate: speechRate,
        timestamp: new Date()
      };

      dispatch({ type: 'ADD_TTS_AUDIO', payload: audioData });

    } catch (error) {
      console.error('TTS API Error:', error);
      
      // Fallback to browser TTS
      console.log('Falling back to browser TTS...');
      const utterance = new SpeechSynthesisUtterance(text.trim());
      
      if (availableVoices.length > 0) {
        utterance.voice = availableVoices[0];
      }
      
      utterance.rate = speechRate;
      utterance.pitch = speechPitch;
      utterance.volume = 1;

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => {
        setIsPlaying(false);
        dispatch({ type: 'SET_TTS_GENERATING', payload: false });
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        dispatch({ type: 'SET_TTS_GENERATING', payload: false });
      };

      speechSynthesis.speak(utterance);
      setCurrentAudio(utterance);

      const audioData = {
        id: Date.now(),
        text: text.trim(),
        voice: 'Browser Voice',
        rate: speechRate,
        pitch: speechPitch,
        timestamp: new Date()
      };

      dispatch({ type: 'ADD_TTS_AUDIO', payload: audioData });
    }
  };

  const stopSpeech = () => {
    speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    dispatch({ type: 'SET_TTS_GENERATING', payload: false });
  };

  const pauseSpeech = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      setIsPlaying(false);
    }
  };

  const resumeSpeech = () => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setIsPlaying(true);
    }
  };

  const sampleTexts = [
    "Selamat datang ke demo Text-to-Speech. Teknologi ini membolehkan komputer bercakap seperti manusia.",
    "Kecerdasan buatan telah mengubah cara kita berinteraksi dengan teknologi dalam kehidupan seharian.",
    "Malaysia sedang membangunkan ekosistem AI yang kukuh untuk masa depan yang lebih cerah.",
    "Suara sintetik ini dihasilkan menggunakan algoritma pembelajaran mesin yang canggih."
  ];

  const handleSampleText = (sample) => {
    setText(sample);
  };

  const clearText = () => {
    setText('');
    stopSpeech();
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
                className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Volume2 className="text-white" size={16} />
              </motion.div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">Text-to-Speech</h2>
                <p className="text-xs text-gray-600">Sintesis Suara AI</p>
              </div>
            </div>

            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <motion.div
                className="bg-orange-50 rounded-lg p-2"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-1 mb-1">
                  <Lightbulb className="text-orange-600" size={12} />
                  <h3 className="font-semibold text-orange-800 text-xs">Apa itu Text-to-Speech?</h3>
                </div>
                <p className="text-orange-700 text-xs mb-2">
                  TTS adalah teknologi AI yang menukar teks bertulis kepada pertuturan yang kedengaran natural dan ekspresif.
                </p>
                <div className="text-orange-700 text-xs space-y-1">
                  <p><strong>Teknologi Asas:</strong></p>
                  <p>• Neural vocoder untuk sintesis audio berkualiti tinggi</p>
                  <p>• Deep learning models untuk intonasi natural</p>
                  <p>• Prosody modeling untuk ritma dan penekanan</p>
                  <p>• Phoneme-to-audio conversion dengan neural networks</p>
                </div>
              </motion.div>

              <motion.div
                className="bg-blue-50 rounded-lg p-2"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-1 mb-1">
                  <Zap className="text-blue-600" size={12} />
                  <h3 className="font-semibold text-blue-800 text-xs">Keupayaan TTS Moden</h3>
                </div>
                <div className="text-blue-700 text-xs space-y-1">
                  <p><strong>Kualiti Suara:</strong></p>
                  <p>• Suara yang hampir tidak dapat dibezakan dari manusia</p>
                  <p>• Intonasi dan emosi yang natural</p>
                  <p>• Kawalan kelajuan, nada, dan volume</p>
                  <p>• Pelbagai gaya suara (formal, kasual, dramatik)</p>
                  
                  <p className="mt-2"><strong>Ciri-ciri Lanjutan:</strong></p>
                  <p>• Real-time synthesis dengan latency rendah</p>
                  <p>• Sokongan SSML untuk kawalan lanjutan</p>
                  <p>• Voice cloning dan personalisasi</p>
                  <p>• Multilingual dengan accent preservation</p>
                </div>
              </motion.div>

              <motion.div
                className="bg-green-50 rounded-lg p-2"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-1 mb-1">
                  <Type className="text-green-600" size={12} />
                  <h3 className="font-semibold text-green-800 text-xs">Cara Kerja TTS</h3>
                </div>
                <div className="text-green-700 text-xs space-y-1">
                  <p><strong>Pipeline Pemprosesan:</strong></p>
                  <p>1. <strong>Text Analysis:</strong> Parsing dan normalisasi teks input</p>
                  <p>2. <strong>Linguistic Processing:</strong> Phoneme conversion dan stress marking</p>
                  <p>3. <strong>Prosody Generation:</strong> Rhythm, intonation, dan timing</p>
                  <p>4. <strong>Acoustic Modeling:</strong> Mel-spectrogram generation</p>
                  <p>5. <strong>Vocoding:</strong> Neural vocoder menghasilkan waveform</p>
                  <p>6. <strong>Post-processing:</strong> Audio enhancement dan normalisasi</p>
                </div>
              </motion.div>

              <motion.div
                className="bg-purple-50 rounded-lg p-2"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-1 mb-1">
                  <Volume2 className="text-purple-600" size={12} />
                  <h3 className="font-semibold text-purple-800 text-xs">Aplikasi Dunia Sebenar</h3>
                </div>
                <div className="text-purple-700 text-xs space-y-1">
                  <p><strong>Industri & Kegunaan:</strong></p>
                  <p>• <strong>Aksesibiliti:</strong> Screen readers untuk OKU penglihatan</p>
                  <p>• <strong>Pendidikan:</strong> E-learning dan buku audio interaktif</p>
                  <p>• <strong>Hiburan:</strong> Dubbing, podcast, dan content creation</p>
                  <p>• <strong>Perniagaan:</strong> IVR systems dan customer service</p>
                  <p>• <strong>Automotif:</strong> Navigation dan in-car assistants</p>
                  <p>• <strong>IoT:</strong> Smart speakers dan home automation</p>
                </div>
              </motion.div>

              <motion.div
                className="bg-red-50 rounded-lg p-2"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-1 mb-1">
                  <Lightbulb className="text-red-600" size={12} />
                  <h3 className="font-semibold text-red-800 text-xs">Tips Penggunaan Optimum</h3>
                </div>
                <div className="text-red-700 text-xs space-y-1">
                  <p><strong>Penulisan Teks:</strong></p>
                  <p>• Gunakan tanda baca yang betul untuk intonasi</p>
                  <p>• Elakkan singkatan yang tidak standard</p>
                  <p>• Tulis nombor dalam bentuk perkataan untuk kejelasan</p>
                  
                  <p className="mt-2"><strong>Kawalan Suara:</strong></p>
                  <p>• Laraskan kelajuan mengikut jenis kandungan</p>
                  <p>• Gunakan pause untuk penekanan</p>
                  <p>• Pilih nada yang sesuai dengan konteks</p>
                  <p>• Test dengan pelbagai peranti audio</p>
                </div>
              </motion.div>

              <motion.div
                className="bg-indigo-50 rounded-lg p-2"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-1 mb-1">
                  <Zap className="text-indigo-600" size={12} />
                  <h3 className="font-semibold text-indigo-800 text-xs">Kualiti & Limitasi</h3>
                </div>
                <div className="text-indigo-700 text-xs space-y-1">
                  <p><strong>Faktor Kualiti:</strong></p>
                  <p>• Model quality: Neural TTS (95%) vs Concatenative (70%)</p>
                  <p>• Bahasa: Native language (98%) vs foreign (85%)</p>
                  <p>• Teks: Simple prose (95%) vs technical terms (80%)</p>
                  
                  <p className="mt-2"><strong>Cabaran Semasa:</strong></p>
                  <p>• Emotional expression masih terhad</p>
                  <p>• Pronunciation untuk nama khas</p>
                  <p>• Context-dependent intonation</p>
                  <p>• Computational requirements untuk real-time</p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* TTS Interface */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 flex flex-col h-full"
        >
          <div className="bg-white rounded shadow-sm flex flex-col h-full">
            {/* TTS Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-1.5 rounded-t flex-shrink-0">
              <div className="flex items-center space-x-1">
                <Volume2 size={12} />
                <div>
                  <h3 className="font-semibold text-xs">AI Text-to-Speech</h3>
                  <p className="text-orange-100 text-xs">
                    Tukar teks kepada suara, {state.user.name}!
                  </p>
                </div>
              </div>
            </div>

            {/* Audio History & Status */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
              {state.aiDemos.tts.audioFiles.length === 0 && !isPlaying && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-4"
                >
                  <Volume2 className="mx-auto text-gray-400 mb-2" size={24} />
                  <p className="text-gray-500 text-sm">
                    Taip teks di bawah untuk menjana suara AI!
                  </p>
                </motion.div>
              )}

              {/* Status Indicator */}
              <AnimatePresence>
                {isPlaying && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-orange-50 border border-orange-200 rounded-lg p-3"
                  >
                    <div className="flex items-center space-x-2">
                      <motion.div
                        className="w-3 h-3 bg-orange-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <span className="text-orange-800 font-medium text-sm">
                        Sedang memainkan audio...
                      </span>
                      <div className="flex space-x-1 ml-auto">
                        {isPlaying && (
                          <motion.button
                            onClick={speechSynthesis.paused ? resumeSpeech : pauseSpeech}
                            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {speechSynthesis.paused ? <Play size={10} /> : <Pause size={10} />}
                          </motion.button>
                        )}
                        {(isPlaying || speechSynthesis.speaking) && (
                          <motion.button
                            onClick={stopSpeech}
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Square size={10} />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Audio History */}
              <AnimatePresence>
                {state.aiDemos.tts.audioFiles.map((audio) => (
                  <motion.div
                    key={audio.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-gray-50 rounded-lg p-3"
                  >
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Volume2 size={12} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 mb-1">{audio.text}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>Suara: {audio.voice}</span>
                          <span>Kelajuan: {audio.rate}x</span>
                          <span>{audio.timestamp.toLocaleTimeString('ms-MY')}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Voice Settings - Compact */}
            {(speechRate !== 1 || speechPitch !== 1) && (
              <div className="flex-shrink-0 border-t border-gray-200 p-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Kelajuan: {speechRate.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={speechRate}
                      onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                      className="w-full h-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Nada: {speechPitch.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={speechPitch}
                      onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                      className="w-full h-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Input Form - Fixed at bottom */}
            <div className="flex-shrink-0 border-t border-gray-200">
              <form onSubmit={(e) => { e.preventDefault(); generateSpeech(); }} className="p-1.5">
                <div className="flex space-x-1">
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Taip teks untuk dijana suara..."
                    className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-orange-500 text-xs"
                    disabled={state.aiDemos.tts.isGenerating}
                    maxLength={500}
                  />
                  <motion.button
                    type="submit"
                    disabled={!text.trim() || state.aiDemos.tts.isGenerating}
                    className={`px-2 py-1 rounded transition-all text-xs ${
                      text.trim() && !state.aiDemos.tts.isGenerating
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    whileHover={text.trim() && !state.aiDemos.tts.isGenerating ? { scale: 1.05 } : {}}
                    whileTap={text.trim() && !state.aiDemos.tts.isGenerating ? { scale: 0.95 } : {}}
                  >
                    <Play size={12} />
                  </motion.button>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {text.length}/500 aksara
                  </span>
                  <button
                    type="button"
                    onClick={() => setSpeechRate(speechRate === 1 && speechPitch === 1 ? 1.2 : 1)}
                    className="text-xs text-gray-500 hover:text-orange-500 transition-colors"
                  >
                    {speechRate === 1 && speechPitch === 1 ? 'Tetapan' : 'Reset'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default TTSDemoPage;