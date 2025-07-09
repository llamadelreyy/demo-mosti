import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const ProgressBar = () => {
  const location = useLocation();
  
  const routes = [
    '/',
    '/info',
    '/nama',
    '/llm',
    '/vlm',
    '/whisper',
    '/tts',
    '/kuiz',
    '/keputusan',
    '/sijil'
  ];
  
  const currentIndex = routes.indexOf(location.pathname);
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / routes.length) * 100 : 0;
  
  return (
    <div className="w-full bg-white/20 backdrop-blur-sm border-b border-white/30">
      <div className="container mx-auto px-2 py-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">
            {currentIndex + 1}/{routes.length}
          </span>
          <span className="text-xs font-medium text-gray-700">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-1 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;