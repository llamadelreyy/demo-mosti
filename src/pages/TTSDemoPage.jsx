import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Play, Pause, Square, Download, Lightbulb, Zap, Type, VolumeX } from 'lucide-react';
import { useApp } from '../context/AppContext';
import apiService from '../services/api';

const TTSDemoPage = () => {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [speechRate, setSpeechRate] = useState(1);
  const [speechPitch, setSpeechPitch] = useState(1);
  const [availableVoices, setAvailableVoices] = useState([]);
  
  const { state, dispatch } = useApp();
  const audioRef = useRef(null);

  // Load available voices
  React.useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      const malayVoices = voices.filter(voice => 
        voice.lang.includes('ms') || voice.lang.includes('id') || voice.lang.includes('en')
      );
      setAvailableVoices(malayVoices.length > 0 ? malayVoices : voices.slice(0, 5));
      if (malayVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(malayVoices[0].name);
      } else if (voices.length > 0 && !selectedVoice) {
        setSelectedVoice(voices[0].name);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [selectedVoice]);

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

      // Call the real TTS API
      const audioBlob = await apiService.synthesizeSpeech(text.trim(), 'ms');
      
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
        voice: 'XTTS v2',
        language: 'ms',
        timestamp: new Date()
      };

      dispatch({ type: 'ADD_TTS_AUDIO', payload: audioData });

    } catch (error) {
      console.error('TTS API Error:', error);
      
      // Fallback to browser TTS
      console.log('Falling back to browser TTS...');
      const utterance = new SpeechSynthesisUtterance(text.trim());
      
      const voice = availableVoices.find(v => v.name === selectedVoice);
      if (voice) {
        utterance.voice = voice;
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
        voice: selectedVoice + ' (Browser)',
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

            <div className="space-y-2">
              <motion.div
                className="bg-orange-50 rounded-lg p-2"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-1 mb-1">
                  <Lightbulb className="text-orange-600" size={12} />
                  <h3 className="font-semibold text-orange-800 text-xs">Apa itu TTS?</h3>
                </div>
                <p className="text-orange-700 text-xs">
                  Teknologi yang menukar teks bertulis kepada pertuturan yang
                  kedengaran natural menggunakan kecerdasan buatan.
                </p>
              </motion.div>

              <motion.div
                className="bg-blue-50 rounded-lg p-2"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-1 mb-1">
                  <Zap className="text-blue-600" size={12} />
                  <h3 className="font-semibold text-blue-800 text-xs">Keupayaan</h3>
                </div>
                <ul className="text-blue-700 text-xs space-y-0.5">
                  <li>• Suara yang natural</li>
                  <li>• Pelbagai gaya suara</li>
                  <li>• Kawalan kelajuan & nada</li>
                  <li>• Sokongan pelbagai bahasa</li>
                </ul>
              </motion.div>

              <motion.div
                className="bg-green-50 rounded-lg p-2"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-1 mb-1">
                  <Type className="text-green-600" size={12} />
                  <h3 className="font-semibold text-green-800 text-xs">Aplikasi</h3>
                </div>
                <ul className="text-green-700 text-xs space-y-0.5">
                  <li>• Asisten suara</li>
                  <li>• Buku audio</li>
                  <li>• Aksesibiliti</li>
                  <li>• Pembelajaran bahasa</li>
                </ul>
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
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-2">
              <div className="flex items-center space-x-2">
                <Volume2 size={16} />
                <div>
                  <h3 className="font-semibold text-sm">Tukar Teks kepada Suara</h3>
                  <p className="text-orange-100 text-xs">
                    Taip teks dan dengar bagaimana AI mengucapkannya, {state.user.name}!
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2 space-y-1 flex-1 flex flex-col min-h-0">
              {/* Text Input */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Masukkan Teks untuk Diucapkan:
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Taip teks anda di sini..."
                  className="w-full h-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-orange-500 resize-none text-xs"
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {text.length}/500 aksara
                  </span>
                  <button
                    onClick={clearText}
                    className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>

              {/* Sample Texts */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Atau Pilih Contoh Teks:
                </label>
                <div className="grid grid-cols-1 gap-1">
                  {sampleTexts.slice(0, 2).map((sample, index) => (
                    <button
                      key={index}
                      onClick={() => handleSampleText(sample)}
                      className="text-left text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded p-1 transition-colors"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Settings */}
              <div className="grid md:grid-cols-3 gap-1">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Pilih Suara:
                  </label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-orange-500 text-xs"
                  >
                    {availableVoices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>

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
                    className="w-full"
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
                    className="w-full"
                  />
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <motion.button
                  onClick={generateSpeech}
                  disabled={!text.trim() || state.aiDemos.tts.isGenerating}
                  className={`flex-1 py-2 px-3 rounded font-semibold transition-all text-sm ${
                    text.trim() && !state.aiDemos.tts.isGenerating
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  whileHover={text.trim() && !state.aiDemos.tts.isGenerating ? { scale: 1.02 } : {}}
                  whileTap={text.trim() && !state.aiDemos.tts.isGenerating ? { scale: 0.98 } : {}}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <Play size={12} />
                    <span>Jana Suara</span>
                  </div>
                </motion.button>

                {isPlaying && (
                  <motion.button
                    onClick={speechSynthesis.paused ? resumeSpeech : pauseSpeech}
                    className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-1">
                      {speechSynthesis.paused ? <Play size={12} /> : <Pause size={12} />}
                      <span>{speechSynthesis.paused ? 'Sambung' : 'Jeda'}</span>
                    </div>
                  </motion.button>
                )}

                {(isPlaying || speechSynthesis.speaking) && (
                  <motion.button
                    onClick={stopSpeech}
                    className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-1">
                      <Square size={12} />
                      <span>Berhenti</span>
                    </div>
                  </motion.button>
                )}
              </div>

              {/* Status Indicator */}
              <AnimatePresence>
                {isPlaying && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-orange-50 border border-orange-200 rounded p-2"
                  >
                    <div className="flex items-center space-x-2">
                      <motion.div
                        className="w-2 h-2 bg-orange-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <span className="text-orange-800 font-medium text-xs">
                        Sedang memainkan audio...
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Audio History */}
              {state.aiDemos.tts.audioFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-1 overflow-y-auto"
                  style={{ maxHeight: '80px' }}
                >
                  <h3 className="font-semibold text-gray-800 text-xs">Sejarah Audio:</h3>
                  <div className="space-y-1 overflow-y-auto">
                    {state.aiDemos.tts.audioFiles.slice(-1).map((audio) => (
                      <div key={audio.id} className="bg-gray-50 rounded p-1.5">
                        <div className="flex justify-between items-start mb-0.5">
                          <div className="flex-1">
                            <p className="text-xs text-gray-800 line-clamp-1">
                              {audio.text}
                            </p>
                            <div className="flex items-center space-x-1 mt-0.5 text-xs text-gray-500">
                              <span>Suara: {audio.voice.split(' ')[0]}</span>
                              <span>Kelajuan: {audio.rate}x</span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 ml-1">
                            {audio.timestamp.toLocaleTimeString('ms-MY')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
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