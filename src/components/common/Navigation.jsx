import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const routes = [
    { path: '/', name: 'Selamat Datang' },
    { path: '/info', name: 'Maklumat' },
    { path: '/nama', name: 'Nama' },
    { path: '/llm', name: 'LLM' },
    { path: '/vlm', name: 'VLM' },
    { path: '/whisper', name: 'Whisper' },
    { path: '/tts', name: 'TTS' },
    { path: '/kuiz', name: 'Kuiz' },
    { path: '/keputusan', name: 'Keputusan' },
    { path: '/sijil', name: 'Sijil' }
  ];
  
  const currentIndex = routes.findIndex(route => route.path === location.pathname);
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < routes.length - 1;
  
  const handlePrevious = () => {
    if (canGoBack) {
      navigate(routes[currentIndex - 1].path);
    }
  };
  
  const handleNext = () => {
    if (canGoForward) {
      navigate(routes[currentIndex + 1].path);
    }
  };
  
  const handleHome = () => {
    navigate('/');
  };
  
  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 p-2"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto flex items-center justify-between max-w-md">
        <button
          onClick={handlePrevious}
          disabled={!canGoBack}
          className={`flex items-center space-x-1 px-3 py-1 rounded transition-all text-sm ${
            canGoBack
              ? 'bg-blue-500 text-white hover:bg-blue-600 shadow'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <ChevronLeft size={16} />
          <span>Kembali</span>
        </button>
        
        <button
          onClick={handleHome}
          className="flex items-center justify-center w-8 h-8 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-all shadow"
        >
          <Home size={16} />
        </button>
        
        <button
          onClick={handleNext}
          disabled={!canGoForward}
          className={`flex items-center space-x-1 px-3 py-1 rounded transition-all text-sm ${
            canGoForward
              ? 'bg-blue-500 text-white hover:bg-blue-600 shadow'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span>Seterusnya</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>
  );
};

export default Navigation;