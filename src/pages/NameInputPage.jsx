import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, CheckCircle, AlertCircle, Brain, Eye, Mic, Volume2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const NameInputPage = () => {
  // Floating background icons
  const floatingIcons = [
    { Icon: Brain, delay: 0, color: 'text-blue-500' },
    { Icon: Eye, delay: 0.5, color: 'text-green-500' },
    { Icon: Mic, delay: 1, color: 'text-purple-500' },
    { Icon: Volume2, delay: 1.5, color: 'text-orange-500' }
  ];

  const [name, setName] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [showError, setShowError] = useState(false);
  const { dispatch } = useApp();
  const navigate = useNavigate();

  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    setIsValid(value.trim().length >= 2);
    setShowError(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim().length >= 2) {
      dispatch({ type: 'SET_USER_NAME', payload: name.trim() });
      navigate('/llm');
    } else {
      setShowError(true);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Floating background icons */}
      {floatingIcons.map(({ Icon, delay, color }, index) => (
        <motion.div
          key={index}
          className={`absolute ${color} opacity-10`}
          initial={{ scale: 0, rotate: 0 }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
            x: [0, 50, -50, 0],
            y: [0, -30, 30, 0]
          }}
          transition={{
            duration: 8,
            delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            left: `${20 + index * 20}%`,
            top: `${30 + index * 15}%`
          }}
        >
          <Icon size={60} />
        </motion.div>
      ))}

      <motion.div
        className="max-w-md w-full mx-auto z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-6">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-4"
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 3, -3, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <User className="text-white" size={28} />
          </motion.div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
            Sebelum Kita Mula...
          </h1>
          
          <p className="text-base text-gray-600">
            Sila masukkan nama anda untuk pengalaman yang lebih personal
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          variants={itemVariants}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="relative">
            <motion.div
              className="relative"
              whileFocus={{ scale: 1.02 }}
            >
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Masukkan nama anda di sini..."
                className={`w-full px-4 py-4 text-lg border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                  showError
                    ? 'border-red-400 bg-red-50'
                    : isValid
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 bg-white focus:border-indigo-500'
                }`}
                autoFocus
              />
              
              {/* Validation Icon */}
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                {showError && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-red-500"
                  >
                    <AlertCircle size={24} />
                  </motion.div>
                )}
                {isValid && !showError && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-green-500"
                  >
                    <CheckCircle size={24} />
                  </motion.div>
                )}
              </div>
            </motion.div>
            
            {/* Error Message */}
            {showError && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm mt-2 ml-1"
              >
                Sila masukkan nama yang sah (sekurang-kurangnya 2 huruf)
              </motion.p>
            )}
            
            {/* Character Count */}
            <motion.p
              className={`text-sm mt-2 ml-1 transition-colors ${
                name.length >= 2 ? 'text-green-600' : 'text-gray-500'
              }`}
              animate={{ opacity: name.length > 0 ? 1 : 0 }}
            >
              {name.length}/50 aksara
            </motion.p>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
              isValid
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!isValid}
            whileHover={isValid ? { scale: 1.02 } : {}}
            whileTap={isValid ? { scale: 0.98 } : {}}
          >
            {isValid ? 'Teruskan ke Demo AI' : 'Masukkan Nama Anda'}
          </motion.button>
        </motion.form>

        {/* Preview */}
        {name.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg"
          >
            <p className="text-center text-gray-700 text-sm">
              <span className="font-medium">Pratonton:</span> Selamat datang, {' '}
              <span className="font-bold text-indigo-600">{name.trim()}</span>!
              Mari jelajahi dunia AI bersama-sama.
            </p>
          </motion.div>
        )}

        {/* Simple Info */}
        <motion.div
          variants={itemVariants}
          className="mt-6"
        >
          <p className="text-center text-xs text-gray-500">
            🔒 Nama anda hanya digunakan untuk personalisasi dan sijil
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NameInputPage;