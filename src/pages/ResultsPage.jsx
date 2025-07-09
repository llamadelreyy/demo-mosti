import React from 'react';
import { motion } from 'framer-motion';
import { Award, CheckCircle, XCircle, Target, TrendingUp, Star, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const ResultsPage = () => {
  const { state } = useApp();
  const navigate = useNavigate();

  const questions = [
    {
      id: 1,
      question: "Apakah kepanjangan AI dalam konteks teknologi?",
      options: [
        "Automated Intelligence",
        "Artificial Intelligence", 
        "Advanced Integration",
        "Algorithmic Interface"
      ],
      correct: 1,
      explanation: "AI bermaksud Artificial Intelligence atau Kecerdasan Buatan dalam Bahasa Malaysia."
    },
    {
      id: 2,
      question: "Model AI manakah yang paling sesuai untuk memahami dan menjana teks?",
      options: [
        "Convolutional Neural Network (CNN)",
        "Large Language Model (LLM)",
        "Recurrent Neural Network (RNN)",
        "Support Vector Machine (SVM)"
      ],
      correct: 1,
      explanation: "Large Language Model (LLM) direka khusus untuk memproses dan menjana bahasa manusia."
    },
    {
      id: 3,
      question: "Teknologi AI manakah yang digunakan untuk menukar suara kepada teks?",
      options: [
        "Text-to-Speech (TTS)",
        "Natural Language Processing (NLP)",
        "Speech-to-Text (STT)",
        "Computer Vision"
      ],
      correct: 2,
      explanation: "Speech-to-Text (STT) atau Whisper adalah teknologi yang menukar audio suara kepada teks."
    },
    {
      id: 4,
      question: "Apakah fungsi utama Vision Language Model (VLM)?",
      options: [
        "Menjana muzik dari teks",
        "Memahami dan menerangkan kandungan visual",
        "Menterjemah bahasa sahaja",
        "Mengoptimumkan kod program"
      ],
      correct: 1,
      explanation: "VLM boleh 'melihat' imej dan memberikan deskripsi atau menjawab soalan tentang kandungan visual."
    },
    {
      id: 5,
      question: "Machine Learning adalah subset daripada:",
      options: [
        "Data Science",
        "Artificial Intelligence",
        "Computer Graphics",
        "Database Management"
      ],
      correct: 1,
      explanation: "Machine Learning adalah cabang atau subset daripada Artificial Intelligence yang lebih luas."
    },
    {
      id: 6,
      question: "Apakah perbezaan utama antara AI tradisional dan Deep Learning?",
      options: [
        "Deep Learning menggunakan neural networks berlapis",
        "AI tradisional lebih pantas",
        "Deep Learning hanya untuk imej",
        "Tiada perbezaan yang ketara"
      ],
      correct: 0,
      explanation: "Deep Learning menggunakan neural networks dengan banyak lapisan tersembunyi untuk pembelajaran yang lebih kompleks."
    },
    {
      id: 7,
      question: "Teknologi AI manakah yang paling sesuai untuk mengenal wajah dalam gambar?",
      options: [
        "Natural Language Processing",
        "Computer Vision",
        "Speech Recognition",
        "Expert Systems"
      ],
      correct: 1,
      explanation: "Computer Vision adalah bidang AI yang membolehkan komputer memahami dan menganalisis kandungan visual."
    },
    {
      id: 8,
      question: "Apakah yang dimaksudkan dengan 'training data' dalam konteks AI?",
      options: [
        "Data untuk menguji prestasi model",
        "Data yang digunakan untuk mengajar model AI",
        "Data yang rosak atau tidak lengkap",
        "Data yang disimpan dalam cloud"
      ],
      correct: 1,
      explanation: "Training data adalah set data yang digunakan untuk melatih model AI supaya ia dapat membuat ramalan atau keputusan."
    },
    {
      id: 9,
      question: "Manakah antara berikut BUKAN aplikasi umum AI dalam kehidupan seharian?",
      options: [
        "Sistem pengesyoran Netflix",
        "Asisten suara seperti Siri",
        "GPS dan navigasi",
        "Kalkulator matematik asas"
      ],
      correct: 3,
      explanation: "Kalkulator matematik asas menggunakan algoritma mudah, bukan AI. Yang lain menggunakan teknologi AI."
    },
    {
      id: 10,
      question: "Apakah cabaran etika utama dalam pembangunan AI?",
      options: [
        "Kos pembangunan yang tinggi",
        "Bias dan keadilan dalam keputusan AI",
        "Kelajuan pemprosesan yang perlahan",
        "Saiz fail yang besar"
      ],
      correct: 1,
      explanation: "Bias dan keadilan adalah isu etika penting kerana AI boleh membuat keputusan yang tidak adil jika data latihan mengandungi bias."
    }
  ];

  const score = state.quiz.score;
  const totalQuestions = questions.length;
  const percentage = Math.round((score / totalQuestions) * 100);

  const getGrade = () => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-50' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-50' };
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (percentage >= 60) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (percentage >= 50) return { grade: 'D', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { grade: 'F', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const getPerformanceMessage = () => {
    if (percentage >= 90) return "Cemerlang! Anda menguasai konsep AI dengan sangat baik! 🌟";
    if (percentage >= 80) return "Bagus sekali! Pengetahuan AI anda sangat baik! 👏";
    if (percentage >= 70) return "Baik! Anda mempunyai pemahaman yang solid tentang AI! 👍";
    if (percentage >= 60) return "Sederhana. Masih ada ruang untuk penambahbaikan! 📚";
    if (percentage >= 50) return "Perlu lebih banyak pembelajaran tentang AI! 💪";
    return "Jangan putus asa! Teruskan belajar tentang AI! 🚀";
  };

  const gradeInfo = getGrade();

  const handleProceedToCertificate = () => {
    navigate('/sijil');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1
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

  return (
    <div className="min-h-screen flex flex-col">
      <motion.div
        className="flex-1 max-w-4xl mx-auto p-3 overflow-y-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-3">
          <motion.div
            className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full mb-2"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Trophy className="text-white" size={20} />
          </motion.div>
          
          <h1 className="text-lg font-bold text-gray-800 mb-1">
            Keputusan Kuiz Anda
          </h1>
          
          <p className="text-sm text-gray-600">
            Tahniah {state.user.name}! Anda telah menyelesaikan kuiz AI.
          </p>
        </motion.div>

        {/* Score Card */}
        <motion.div
          variants={itemVariants}
          className={`${gradeInfo.bg} border-2 border-opacity-20 rounded-lg p-3 mb-3 text-center`}
        >
          <div className="flex items-center justify-center space-x-4 mb-2">
            <div>
              <motion.div
                className={`text-2xl font-bold ${gradeInfo.color} mb-1`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              >
                {score}/{totalQuestions}
              </motion.div>
              <p className="text-xs text-gray-600">Markah</p>
            </div>
            
            <div>
              <motion.div
                className={`text-2xl font-bold ${gradeInfo.color} mb-1`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
              >
                {percentage}%
              </motion.div>
              <p className="text-xs text-gray-600">Peratusan</p>
            </div>
            
            <div>
              <motion.div
                className={`text-2xl font-bold ${gradeInfo.color} mb-1`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
              >
                {gradeInfo.grade}
              </motion.div>
              <p className="text-xs text-gray-600">Gred</p>
            </div>
          </div>
          
          <motion.p
            className={`text-sm font-semibold ${gradeInfo.color}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            {getPerformanceMessage()}
          </motion.p>
        </motion.div>

        {/* Performance Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <CheckCircle className="mx-auto text-green-500 mb-1" size={16} />
            <div className="text-lg font-bold text-green-600 mb-1">{score}</div>
            <p className="text-xs text-gray-600">Jawapan Betul</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <XCircle className="mx-auto text-red-500 mb-1" size={16} />
            <div className="text-lg font-bold text-red-600 mb-1">{totalQuestions - score}</div>
            <p className="text-xs text-gray-600">Jawapan Salah</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <Target className="mx-auto text-blue-500 mb-1" size={16} />
            <div className="text-lg font-bold text-blue-600 mb-1">{percentage}%</div>
            <p className="text-xs text-gray-600">Ketepatan</p>
          </div>
        </motion.div>

        {/* Detailed Results */}
        <motion.div variants={itemVariants} className="bg-white rounded-lg shadow p-3 mb-3 flex-1 overflow-hidden">
          <h2 className="text-sm font-bold text-gray-800 mb-2 flex items-center">
            <TrendingUp className="mr-1 text-blue-500" size={14} />
            Semakan Jawapan Terperinci
          </h2>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {questions.map((question, index) => {
              const userAnswer = state.quiz.answers[index];
              const isCorrect = userAnswer === question.correct;
              
              return (
                <motion.div
                  key={question.id}
                  className={`border-l-2 pl-2 py-1 ${
                    isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <div className="flex items-start space-x-2">
                    <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                      isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {isCorrect ? (
                        <CheckCircle className="text-white" size={8} />
                      ) : (
                        <XCircle className="text-white" size={8} />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1 text-xs">
                        {question.id}. {question.question}
                      </h3>
                      
                      <div className="space-y-1 text-xs">
                        <p className={`${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                          <strong>Jawapan anda:</strong> {question.options[userAnswer] || 'Tidak dijawab'}
                        </p>
                        
                        {!isCorrect && (
                          <p className="text-green-700">
                            <strong>Jawapan betul:</strong> {question.options[question.correct]}
                          </p>
                        )}
                        
                        <p className="text-gray-600 mt-1">
                          <strong>Penjelasan:</strong> {question.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="text-center space-y-2">
          <motion.button
            onClick={handleProceedToCertificate}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-semibold text-sm shadow hover:shadow-lg transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Award size={16} />
            <span>Dapatkan Sijil Digital Anda</span>
          </motion.button>
          
          <p className="text-xs text-gray-600">
            Klik butang di atas untuk menjana sijil digital anda
          </p>
        </motion.div>

        {/* Motivational Message */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3 text-center"
        >
          <Star className="mx-auto text-yellow-500 mb-2" size={16} />
          <h3 className="text-sm font-semibold text-gray-800 mb-1">
            Teruskan Pembelajaran Anda!
          </h3>
          <p className="text-xs text-gray-600">
            Dunia AI berkembang pesat. Teruskan belajar dan jelajahi teknologi-teknologi
            baru yang akan membentuk masa depan kita. Setiap langkah pembelajaran adalah
            satu pencapaian!
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResultsPage;