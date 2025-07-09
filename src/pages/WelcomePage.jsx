import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Eye, Mic, Volume2 } from 'lucide-react';
import logo from '../assets/logo.png';

const WelcomePage = () => {
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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  const floatingIcons = [
    { Icon: Brain, delay: 0, color: 'text-blue-500' },
    { Icon: Eye, delay: 0.5, color: 'text-green-500' },
    { Icon: Mic, delay: 1, color: 'text-purple-500' },
    { Icon: Volume2, delay: 1.5, color: 'text-orange-500' }
  ];

  return (
    <div className="h-full flex items-center justify-center relative overflow-hidden">
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
        className="text-center z-10 max-w-4xl mx-auto px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-4">
          <motion.div
            className="inline-flex items-center justify-center mb-4"
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 2, -2, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <img
              src={logo}
              alt="MOSTI Logo"
              className="w-24 h-24 object-contain"
            />
          </motion.div>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2"
        >
          Selamat Datang
        </motion.h1>

        <motion.h2
          variants={itemVariants}
          className="text-lg md:text-xl font-semibold text-gray-700 mb-4"
        >
          Demo Stack Model AI
        </motion.h2>

        <motion.p
          variants={itemVariants}
          className="text-sm md:text-base text-gray-600 mb-6 leading-relaxed max-w-2xl mx-auto"
        >
          Jelajahi dunia Kecerdasan Buatan melalui demonstrasi interaktif yang menarik.
          Pelajari tentang 4 jenis model AI yang revolusioner dan rasai sendiri kuasa teknologi masa depan.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        >
          {[
            { icon: Brain, title: 'LLM', desc: 'Model Bahasa Besar' },
            { icon: Eye, title: 'VLM', desc: 'Model Penglihatan' },
            { icon: Mic, title: 'Whisper', desc: 'Tukar Suara ke Teks' },
            { icon: Volume2, title: 'TTS', desc: 'Tukar Teks ke Suara' }
          ].map(({ icon: Icon, title, desc }, index) => (
            <motion.div
              key={title}
              className="ai-card text-center p-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
            >
              <Icon className="mx-auto mb-2 text-blue-500" size={24} />
              <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
              <p className="text-xs text-gray-600">{desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="text-center"
        >
          <motion.div
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-semibold shadow-lg"
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
            whileTap={{ scale: 0.95 }}
          >
            Mulakan Perjalanan AI Anda
          </motion.div>
          <p className="text-sm text-gray-500 mt-3">
            Klik "Seterusnya" untuk mula
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default WelcomePage;