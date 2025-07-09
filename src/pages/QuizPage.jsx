import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle, XCircle, Clock, ArrowLeft, ArrowRight, Award } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const QuizPage = () => {
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [showTimer, setShowTimer] = useState(true);
  const { state, dispatch } = useApp();
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

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && showTimer) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleSubmitQuiz();
    }
  }, [timeLeft, showTimer]);

  const currentQuestion = questions[state.quiz.currentQuestion];
  const selectedAnswer = state.quiz.answers[state.quiz.currentQuestion];

  const handleAnswerSelect = (answerIndex) => {
    dispatch({
      type: 'SET_QUIZ_ANSWER',
      payload: {
        questionIndex: state.quiz.currentQuestion,
        answer: answerIndex
      }
    });
  };

  const handlePreviousQuestion = () => {
    if (state.quiz.currentQuestion > 0) {
      dispatch({ type: 'PREVIOUS_QUESTION' });
    }
  };

  const handleNextQuestion = () => {
    if (state.quiz.currentQuestion < questions.length - 1) {
      dispatch({ type: 'NEXT_QUESTION' });
    }
  };

  const handleSubmitQuiz = () => {
    // Calculate score
    let score = 0;
    questions.forEach((question, index) => {
      if (state.quiz.answers[index] === question.correct) {
        score++;
      }
    });

    dispatch({ type: 'COMPLETE_QUIZ', payload: score });
    navigate('/keputusan');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return state.quiz.answers.filter(answer => answer !== undefined).length;
  };

  const isLastQuestion = state.quiz.currentQuestion === questions.length - 1;
  const allQuestionsAnswered = getAnsweredCount() === questions.length;

  return (
    <div className="max-w-4xl mx-auto p-2 h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded shadow-sm p-2 mb-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <motion.div
              className="w-6 h-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded flex items-center justify-center"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="text-white" size={12} />
            </motion.div>
            <div>
              <h1 className="text-sm font-bold text-gray-800">Kuiz AI</h1>
              <p className="text-xs text-gray-600">
                Uji pengetahuan anda, {state.user.name}!
              </p>
            </div>
          </div>

          {showTimer && (
            <motion.div
              className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-xs ${
                timeLeft < 60 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
              }`}
              animate={timeLeft < 60 ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 1, repeat: timeLeft < 60 ? Infinity : 0 }}
            >
              <Clock size={12} />
              <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
            </motion.div>
          )}
        </div>

        {/* Progress */}
        <div className="mt-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-700">
              Soalan {state.quiz.currentQuestion + 1}/{questions.length}
            </span>
            <span className="text-xs text-gray-600">
              Dijawab: {getAnsweredCount()}/{questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-indigo-600 h-1 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((state.quiz.currentQuestion + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.quiz.currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded shadow-sm p-4 mb-4 flex-1 overflow-y-auto"
        >
          <div className="mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold text-sm">
                {currentQuestion.id}
              </div>
              <h2 className="text-lg font-semibold text-gray-800 leading-relaxed">
                {currentQuestion.question}
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <motion.button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full text-left p-4 rounded-lg border transition-all text-sm ${
                  selectedAnswer === index
                    ? 'border-purple-500 bg-purple-50 text-purple-800'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedAnswer === index
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedAnswer === index && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2.5 h-2.5 bg-white rounded-full"
                      />
                    )}
                  </div>
                  <span className="font-medium text-sm">{String.fromCharCode(65 + index)}.</span>
                  <span className="leading-relaxed">{option}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <motion.button
          onClick={handlePreviousQuestion}
          disabled={state.quiz.currentQuestion === 0}
          className={`flex items-center space-x-1 px-2 py-1 rounded transition-all text-xs ${
            state.quiz.currentQuestion === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-500 text-white hover:bg-gray-600'
          }`}
          whileHover={state.quiz.currentQuestion !== 0 ? { scale: 1.05 } : {}}
          whileTap={state.quiz.currentQuestion !== 0 ? { scale: 0.95 } : {}}
        >
          <ArrowLeft size={12} />
          <span>Sebelumnya</span>
        </motion.button>

        <div className="flex items-center space-x-0.5">
          {/* Question indicators */}
          <div className="flex space-x-0.5">
            {questions.slice(0, 5).map((_, index) => (
              <motion.button
                key={index}
                onClick={() => dispatch({ type: 'SET_CURRENT_QUESTION', payload: index })}
                className={`w-4 h-4 rounded-full text-xs font-medium transition-all ${
                  index === state.quiz.currentQuestion
                    ? 'bg-purple-500 text-white'
                    : state.quiz.answers[index] !== undefined
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {index + 1}
              </motion.button>
            ))}
            {questions.length > 5 && <span className="text-xs text-gray-500">...</span>}
          </div>
        </div>

        {isLastQuestion ? (
          <motion.button
            onClick={handleSubmitQuiz}
            disabled={!allQuestionsAnswered}
            className={`flex items-center space-x-1 px-2 py-1 rounded font-semibold transition-all text-xs ${
              allQuestionsAnswered
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            whileHover={allQuestionsAnswered ? { scale: 1.05 } : {}}
            whileTap={allQuestionsAnswered ? { scale: 0.95 } : {}}
          >
            <Award size={12} />
            <span>Hantar</span>
          </motion.button>
        ) : (
          <motion.button
            onClick={handleNextQuestion}
            className="flex items-center space-x-1 px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition-all text-xs"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>Seterusnya</span>
            <ArrowRight size={12} />
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};

export default QuizPage;