import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, User, Bot, Lightbulb, Zap, MessageSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';
import apiService from '../services/api';

const LLMDemoPage = () => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { state, dispatch } = useApp();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.aiDemos.llm.chatHistory]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || state.aiDemos.llm.isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    dispatch({ type: 'ADD_LLM_MESSAGE', payload: userMessage });
    setMessage('');
    setIsTyping(true);
    dispatch({ type: 'SET_LLM_LOADING', payload: true });

    try {
      // Get conversation history for context
      const conversationHistory = state.aiDemos.llm.chatHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Call the real LLM API
      const response = await apiService.chatWithLLM(message.trim(), conversationHistory);
      
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.response || response.message || 'Maaf, saya tidak dapat memberikan respons pada masa ini.',
        timestamp: new Date()
      };

      dispatch({ type: 'ADD_LLM_MESSAGE', payload: botResponse });
    } catch (error) {
      console.error('LLM API Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Maaf, terdapat masalah dengan sambungan ke model AI. Sila pastikan backend server berjalan dan cuba lagi.',
        timestamp: new Date()
      };
      dispatch({ type: 'ADD_LLM_MESSAGE', payload: errorMessage });
    } finally {
      setIsTyping(false);
      dispatch({ type: 'SET_LLM_LOADING', payload: false });
    }
  };

  const suggestedQuestions = [
    "Apakah itu kecerdasan buatan?",
    "Bagaimana AI boleh membantu dalam kehidupan seharian?",
    "Ceritakan tentang masa depan teknologi AI",
    "Apakah perbezaan antara AI dan machine learning?"
  ];

  const handleSuggestedQuestion = (question) => {
    setMessage(question);
    inputRef.current?.focus();
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
                className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded flex items-center justify-center"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="text-white" size={12} />
              </motion.div>
              <div>
                <h2 className="text-xs font-bold text-gray-800">Model Bahasa Besar</h2>
                <p className="text-xs text-gray-600">LLM</p>
              </div>
            </div>

            <div className="space-y-1">
              <motion.div
                className="bg-blue-50 rounded p-1.5"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-1 mb-0.5">
                  <Lightbulb className="text-blue-600" size={10} />
                  <h3 className="font-semibold text-blue-800 text-xs">Apa itu LLM?</h3>
                </div>
                <p className="text-blue-700 text-xs">
                  Model AI untuk memahami dan menjana bahasa manusia.
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
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-1.5 rounded-t flex-shrink-0">
              <div className="flex items-center space-x-1">
                <Bot size={12} />
                <div>
                  <h3 className="font-semibold text-xs">AI Assistant</h3>
                  <p className="text-blue-100 text-xs">
                    Selamat datang, {state.user.name}!
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
              {state.aiDemos.llm.chatHistory.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-2"
                >
                  <Brain className="mx-auto text-gray-400 mb-1" size={20} />
                  <p className="text-gray-500 text-xs">
                    Mulakan perbualan dengan AI!
                  </p>
                </motion.div>
              )}

              <AnimatePresence>
                {state.aiDemos.llm.chatHistory.map((msg) => (
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
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {msg.type === 'user' ? <User size={8} /> : <Bot size={8} />}
                      </div>
                      
                      <div className={`rounded p-1.5 ${
                        msg.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <p className="text-xs">{msg.content}</p>
                        <p className={`text-xs mt-0.5 ${
                          msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'
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
              <form onSubmit={handleSendMessage} className="p-1.5">
                <div className="flex space-x-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Taip mesej anda di sini..."
                    className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-xs"
                    disabled={state.aiDemos.llm.isLoading}
                  />
                  <motion.button
                    type="submit"
                    disabled={!message.trim() || state.aiDemos.llm.isLoading}
                    className={`px-2 py-1 rounded transition-all text-xs ${
                      message.trim() && !state.aiDemos.llm.isLoading
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    whileHover={message.trim() && !state.aiDemos.llm.isLoading ? { scale: 1.05 } : {}}
                    whileTap={message.trim() && !state.aiDemos.llm.isLoading ? { scale: 0.95 } : {}}
                  >
                    <Send size={12} />
                  </motion.button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LLMDemoPage;