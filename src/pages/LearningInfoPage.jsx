import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Eye, Mic, Volume2, BookOpen, Target, Award, Clock } from 'lucide-react';

const LearningInfoPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1
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

  const aiModels = [
    {
      icon: Brain,
      title: 'Model Bahasa Besar (LLM)',
      description: 'Belajar bagaimana AI boleh memahami dan menjana teks seperti manusia',
      features: ['Perbualan interaktif', 'Menjawab soalan', 'Menulis kreatif'],
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Eye,
      title: 'Model Penglihatan-Bahasa (VLM)',
      description: 'Temui bagaimana AI boleh "melihat" dan memahami imej',
      features: ['Analisis gambar', 'Pengenalan objek', 'Deskripsi visual'],
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Mic,
      title: 'Whisper (Suara ke Teks)',
      description: 'Rasai teknologi yang menukar pertuturan kepada teks dengan tepat',
      features: ['Transkripsi suara', 'Pelbagai bahasa', 'Ketepatan tinggi'],
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Volume2,
      title: 'Sintesis Suara (TTS)',
      description: 'Lihat bagaimana AI boleh "bercakap" dengan suara yang natural',
      features: ['Teks ke suara', 'Suara realistik', 'Pelbagai gaya'],
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const learningObjectives = [
    {
      icon: Target,
      title: 'Objektif Pembelajaran',
      items: [
        'Memahami konsep asas AI dan machine learning',
        'Mengenali perbezaan antara jenis-jenis model AI',
        'Mengalami sendiri keupayaan setiap model',
        'Menilai potensi aplikasi dalam kehidupan seharian'
      ]
    },
    {
      icon: Clock,
      title: 'Tempoh Pembelajaran',
      items: [
        'Demo interaktif: 15-20 minit',
        'Kuiz penilaian: 5-10 minit',
        'Jumlah masa: 20-30 minit',
        'Belajar mengikut kadar sendiri'
      ]
    },
    {
      icon: Award,
      title: 'Pencapaian',
      items: [
        'Sijil digital selepas tamat',
        'Pengetahuan praktikal AI',
        'Pengalaman hands-on',
        'Asas untuk pembelajaran lanjut'
      ]
    }
  ];

  return (
    <motion.div
      className="max-w-6xl mx-auto py-4 px-4 min-h-screen flex flex-col justify-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center mb-6">
        <motion.div
          className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-4"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <BookOpen className="text-white" size={24} />
        </motion.div>
        
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
          Apa Yang Akan Anda Pelajari Hari Ini?
        </h1>
        
        <p className="text-base text-gray-600 max-w-2xl mx-auto">
          Sertai kami dalam perjalanan menarik untuk memahami 4 jenis teknologi AI
          yang sedang mengubah dunia.
        </p>
      </motion.div>

      {/* AI Models Grid */}
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-xl font-bold text-center text-gray-800 mb-4">
          Model AI Yang Akan Anda Jelajahi
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {aiModels.map((model, index) => (
            <motion.div
              key={model.title}
              className={`${model.bgColor} rounded-lg p-3 border border-gray-200 shadow-sm`}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center">
                <motion.div
                  className={`w-8 h-8 bg-gradient-to-r ${model.color} rounded-lg flex items-center justify-center mx-auto mb-2`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <model.icon className="text-white" size={16} />
                </motion.div>
                
                <h3 className="text-sm font-semibold text-gray-800 mb-1">
                  {model.title}
                </h3>
                <p className="text-xs text-gray-600">
                  {model.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Learning Objectives - Simplified */}
      <motion.div variants={itemVariants} className="mb-6">
        <h2 className="text-lg font-bold text-center text-gray-800 mb-4">
          Maklumat Pembelajaran
        </h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          {learningObjectives.map((objective, index) => (
            <motion.div
              key={objective.title}
              className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
              variants={itemVariants}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded flex items-center justify-center">
                  <objective.icon className="text-white" size={12} />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">
                  {objective.title}
                </h3>
              </div>
              
              <ul className="space-y-1">
                {objective.items.slice(0, 2).map((item, idx) => (
                  <motion.li
                    key={idx}
                    className="flex items-start space-x-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                  >
                    <div className="w-1 h-1 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />
                    <span className="text-xs text-gray-600">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        variants={itemVariants}
        className="text-center"
      >
        <motion.div
          className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Mari Mulakan! 🚀
        </motion.div>
        <p className="text-gray-500 mt-2 text-sm">
          Klik "Seterusnya" untuk memasukkan nama anda
        </p>
      </motion.div>
    </motion.div>
  );
};

export default LearningInfoPage;