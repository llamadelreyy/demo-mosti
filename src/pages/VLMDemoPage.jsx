import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Eye, Upload, Send, Image as ImageIcon, Zap, Lightbulb, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import apiService from '../services/api';

const VLMDemoPage = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const { state, dispatch } = useApp();
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setCameraStream(stream);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Tidak dapat mengakses kamera. Sila pastikan kebenaran diberikan.');
    } finally {
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageDataUrl);
      stopCamera();
    }
  }, [cameraStream]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!capturedImage || !prompt.trim()) return;

    dispatch({ type: 'SET_VLM_LOADING', payload: true });

    try {
      // Convert image to base64 if needed
      const imageBase64 = capturedImage.startsWith('data:')
        ? capturedImage.split(',')[1]
        : capturedImage;

      // Call the real VLM API
      const response = await apiService.analyzeImage(imageBase64, prompt.trim());
      
      const result = {
        image: capturedImage,
        prompt: prompt.trim(),
        response: response.analysis || response.description || response.response || 'Maaf, tidak dapat menganalisis imej pada masa ini.',
        timestamp: new Date()
      };

      dispatch({ type: 'ADD_VLM_RESULT', payload: { image: capturedImage, result }});
      setPrompt('');
    } catch (error) {
      console.error('VLM API Error:', error);
      const errorResult = {
        image: capturedImage,
        prompt: prompt.trim(),
        response: 'Maaf, terdapat masalah dengan sambungan ke model penglihatan AI. Sila pastikan backend server berjalan dan cuba lagi.',
        timestamp: new Date()
      };
      dispatch({ type: 'ADD_VLM_RESULT', payload: { image: capturedImage, result: errorResult }});
    } finally {
      dispatch({ type: 'SET_VLM_LOADING', payload: false });
    }
  };

  const suggestedPrompts = [
    "Apakah yang terdapat dalam imej ini?",
    "Terangkan objek utama dalam gambar",
    "Apakah warna dominan dalam imej?",
    "Adakah terdapat manusia dalam gambar ini?"
  ];

  const resetCapture = () => {
    setCapturedImage(null);
    setPrompt('');
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
            <div className="flex items-center space-x-1 mb-2">
              <motion.div
                className="w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Eye className="text-white" size={12} />
              </motion.div>
              <div>
                <h2 className="text-xs font-bold text-gray-800">Model Penglihatan</h2>
                <p className="text-xs text-gray-600">VLM</p>
              </div>
            </div>

            <div className="space-y-1">
              <motion.div
                className="bg-green-50 rounded p-1.5"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-1 mb-0.5">
                  <Lightbulb className="text-green-600" size={10} />
                  <h3 className="font-semibold text-green-800 text-xs">Apa itu VLM?</h3>
                </div>
                <p className="text-green-700 text-xs">
                  Model AI untuk "melihat" dan memahami imej.
                </p>
              </motion.div>

              <motion.div
                className="bg-purple-50 rounded p-1.5"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-1 mb-0.5">
                  <Camera className="text-purple-600" size={10} />
                  <h3 className="font-semibold text-purple-800 text-xs">Cara Guna</h3>
                </div>
                <ol className="text-purple-700 text-xs space-y-0.5">
                  <li>1. Ambil gambar atau muat naik</li>
                  <li>2. Tulis soalan tentang imej</li>
                  <li>3. Klik analisis untuk jawapan</li>
                </ol>
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
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-1.5">
              <div className="flex items-center space-x-1">
                <Eye size={12} />
                <div>
                  <h3 className="font-semibold text-xs">Analisis Imej AI</h3>
                  <p className="text-green-100 text-xs">
                    Ambil gambar, {state.user.name}!
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2 flex-1 flex flex-col min-h-0">
              {/* Camera/Upload Section */}
              {!capturedImage && !showCamera && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-3 flex-1 flex flex-col justify-center"
                >
                  <ImageIcon className="mx-auto text-gray-400 mb-2" size={20} />
                  <h3 className="text-xs font-semibold text-gray-800 mb-2">
                    Pilih Cara Mendapatkan Imej
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row gap-1 justify-center">
                    <motion.button
                      onClick={startCamera}
                      disabled={isCapturing}
                      className="flex items-center space-x-1 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 text-xs"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Camera size={12} />
                      <span>{isCapturing ? 'Membuka...' : 'Kamera'}</span>
                    </motion.button>
                    
                    <motion.button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-1 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Upload size={12} />
                      <span>Muat Naik</span>
                    </motion.button>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </motion.div>
              )}

              {/* Camera View */}
              {showCamera && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative flex-1"
                  style={{ maxHeight: '150px' }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover rounded"
                  />
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
                    <motion.button
                      onClick={capturePhoto}
                      className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Camera className="text-green-600" size={12} />
                    </motion.button>
                    <motion.button
                      onClick={stopCamera}
                      className="px-1.5 py-0.5 bg-red-500 text-white rounded text-xs"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Batal
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Captured Image and Analysis */}
              {capturedImage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2 flex-1 flex flex-col"
                >
                  {/* Image Preview */}
                  <div className="relative flex-1" style={{ maxHeight: '120px' }}>
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="w-full h-full object-contain rounded border"
                    />
                    <button
                      onClick={resetCapture}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-xs"
                    >
                      ×
                    </button>
                  </div>

                  {/* Prompt Input */}
                  <div className="space-y-1">
                    <h3 className="font-semibold text-gray-800 text-xs">
                      Tanya tentang imej:
                    </h3>
                    
                    {/* Suggested Prompts */}
                    <div className="flex flex-wrap gap-0.5">
                      {suggestedPrompts.slice(0, 2).map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setPrompt(suggestion)}
                          className="text-xs bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5 rounded transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>

                    {/* Text Input */}
                    <div className="flex space-x-1">
                      <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Tulis soalan..."
                        className="flex-1 px-1.5 py-0.5 border border-gray-300 rounded focus:outline-none focus:border-green-500 text-xs"
                        disabled={state.aiDemos.vlm.isLoading}
                      />
                      <motion.button
                        onClick={handleAnalyzeImage}
                        disabled={!prompt.trim() || state.aiDemos.vlm.isLoading}
                        className={`px-1.5 py-0.5 rounded transition-all text-xs ${
                          prompt.trim() && !state.aiDemos.vlm.isLoading
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        whileHover={prompt.trim() && !state.aiDemos.vlm.isLoading ? { scale: 1.05 } : {}}
                        whileTap={prompt.trim() && !state.aiDemos.vlm.isLoading ? { scale: 0.95 } : {}}
                      >
                        {state.aiDemos.vlm.isLoading ? (
                          <div className="flex items-center space-x-0.5">
                            <div className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs">...</span>
                          </div>
                        ) : (
                          <Send size={10} />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Results */}
              {state.aiDemos.vlm.results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 space-y-1 overflow-y-auto"
                  style={{ maxHeight: '80px' }}
                >
                  <h3 className="font-semibold text-gray-800 text-xs">Hasil:</h3>
                  {state.aiDemos.vlm.results.slice(-1).map((result, index) => (
                    <div key={index} className="bg-gray-50 rounded p-1.5">
                      <p className="text-xs text-gray-600 mb-0.5">
                        <strong>Soalan:</strong> {result.prompt}
                      </p>
                      <p className="text-gray-800 text-xs">{result.response}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default VLMDemoPage;