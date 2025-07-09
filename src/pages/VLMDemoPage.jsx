import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Eye, Upload, Send, User, Bot, Image as ImageIcon, Lightbulb, MessageSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';
import apiService from '../services/api';

const VLMDemoPage = () => {
  const [message, setMessage] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { state, dispatch } = useApp();
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.aiDemos.vlm.results]);

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      setCameraStream(stream);
      setShowCamera(true);
      
      // Wait for next tick to ensure video element is rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
          };
        }
      }, 100);
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
      
      // Ensure video has loaded and has dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.error('Video not ready for capture');
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      console.log('Captured image:', imageDataUrl.substring(0, 50) + '...');
      setCapturedImage(imageDataUrl);
      stopCamera();
    } else {
      console.error('Video or canvas ref not available');
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!message.trim() && !capturedImage) || state.aiDemos.vlm.isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message.trim() || 'Analisis imej ini',
      image: capturedImage,
      timestamp: new Date()
    };

    dispatch({ type: 'ADD_VLM_MESSAGE', payload: userMessage });
    setMessage('');
    const currentImage = capturedImage;
    setCapturedImage(null);
    setIsTyping(true);
    dispatch({ type: 'SET_VLM_LOADING', payload: true });

    try {
      // Convert image to base64 if needed
      const imageBase64 = currentImage.startsWith('data:')
        ? currentImage.split(',')[1]
        : currentImage;

      // Call the VLM API with corrected field name
      const response = await apiService.analyzeImage(imageBase64, userMessage.content);
      
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.analysis || response.description || response.response || 'Maaf, tidak dapat menganalisis imej pada masa ini.',
        timestamp: new Date()
      };

      dispatch({ type: 'ADD_VLM_MESSAGE', payload: botResponse });
    } catch (error) {
      console.error('VLM API Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Maaf, terdapat masalah dengan sambungan ke model penglihatan AI. Sila pastikan backend server berjalan dan cuba lagi.',
        timestamp: new Date()
      };
      dispatch({ type: 'ADD_VLM_MESSAGE', payload: errorMessage });
    } finally {
      setIsTyping(false);
      dispatch({ type: 'SET_VLM_LOADING', payload: false });
    }
  };

  const suggestedQuestions = [
    "Apakah yang terdapat dalam imej ini?",
    "Terangkan objek utama dalam gambar",
    "Apakah warna dominan dalam imej?",
    "Adakah terdapat manusia dalam gambar ini?"
  ];

  const handleSuggestedQuestion = (question) => {
    setMessage(question);
    inputRef.current?.focus();
  };

  const removeImage = () => {
    setCapturedImage(null);
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
                  <MessageSquare className="text-purple-600" size={10} />
                  <h3 className="font-semibold text-purple-800 text-xs">Cuba Tanya</h3>
                </div>
                <div className="space-y-0.5">
                  {suggestedQuestions.slice(0, 2).map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="w-full text-left text-xs bg-white border border-purple-200 rounded p-1 hover:bg-purple-100 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Chat Interface */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 flex flex-col h-full"
        >
          <div className="bg-white rounded shadow-sm flex flex-col h-full">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-1.5 rounded-t flex-shrink-0">
              <div className="flex items-center space-x-1">
                <Eye size={12} />
                <div>
                  <h3 className="font-semibold text-xs">AI Vision Assistant</h3>
                  <p className="text-green-100 text-xs">
                    Hantar imej, {state.user.name}!
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
              {state.aiDemos.vlm.results.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-2"
                >
                  <Eye className="mx-auto text-gray-400 mb-1" size={20} />
                  <p className="text-gray-500 text-xs">
                    Ambil gambar dan tanya AI tentang imej!
                  </p>
                </motion.div>
              )}

              <AnimatePresence>
                {state.aiDemos.vlm.results.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-1 max-w-[80%] ${
                      msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        msg.type === 'user'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {msg.type === 'user' ? <User size={8} /> : <Bot size={8} />}
                      </div>
                      
                      <div className={`rounded p-1.5 ${
                        msg.type === 'user'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {msg.type === 'user' && msg.image && (
                          <img
                            src={msg.image}
                            alt="User uploaded"
                            className="w-20 h-20 object-cover rounded mb-1"
                          />
                        )}
                        <p className="text-xs">{msg.content}</p>
                        <p className={`text-xs mt-0.5 ${
                          msg.type === 'user' ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {msg.timestamp.toLocaleTimeString('ms-MY', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start space-x-1">
                    <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                      <Bot size={8} className="text-gray-600" />
                    </div>
                    <div className="bg-gray-100 rounded p-1.5">
                      <div className="flex space-x-0.5">
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>


            {/* Input Form - Fixed at bottom */}
            <div className="flex-shrink-0 border-t border-gray-200">
              {/* Image Preview in Input */}
              {capturedImage && (
                <div className="p-2 border-b border-gray-200">
                  <div className="relative inline-block">
                    <img 
                      src={capturedImage} 
                      alt="Preview" 
                      className="w-16 h-16 object-cover rounded border"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-xs"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="p-1.5">
                <div className="flex space-x-1">
                  {/* Camera Button */}
                  <motion.button
                    type="button"
                    onClick={startCamera}
                    disabled={isCapturing || showCamera}
                    className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 text-xs"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Camera size={12} />
                  </motion.button>

                  {/* Upload Button */}
                  <motion.button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Upload size={12} />
                  </motion.button>

                  {/* Text Input */}
                  <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={capturedImage ? "Tanya tentang imej..." : "Ambil gambar dahulu..."}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-green-500 text-xs"
                    disabled={state.aiDemos.vlm.isLoading}
                  />

                  {/* Send Button */}
                  <motion.button
                    type="submit"
                    disabled={(!message.trim() && !capturedImage) || state.aiDemos.vlm.isLoading}
                    className={`px-2 py-1 rounded transition-all text-xs ${
                      (message.trim() || capturedImage) && !state.aiDemos.vlm.isLoading
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    whileHover={(message.trim() || capturedImage) && !state.aiDemos.vlm.isLoading ? { scale: 1.05 } : {}}
                    whileTap={(message.trim() || capturedImage) && !state.aiDemos.vlm.isLoading ? { scale: 0.95 } : {}}
                  >
                    <Send size={12} />
                  </motion.button>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera View Modal - Fixed positioning */}
      {showCamera && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
        >
          <div className="bg-white rounded-lg p-4 max-w-sm w-full mx-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-48 object-cover rounded mb-2"
            />
            <div className="flex justify-center space-x-2">
              <motion.button
                onClick={capturePhoto}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Camera size={16} className="inline mr-1" />
                Ambil
              </motion.button>
              <motion.button
                onClick={stopCamera}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Batal
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default VLMDemoPage;