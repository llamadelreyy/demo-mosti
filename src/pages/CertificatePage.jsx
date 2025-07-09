import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Download, QrCode, Share2, Calendar, User, Trophy, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CertificatePage = () => {
  const { state } = useApp();
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const certificateRef = useRef(null);

  const currentDate = new Date().toLocaleDateString('ms-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const score = state.quiz.score;
  const totalQuestions = 10;
  const percentage = Math.round((score / totalQuestions) * 100);

  const getGrade = () => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const getAchievementLevel = () => {
    if (percentage >= 90) return 'Cemerlang';
    if (percentage >= 80) return 'Sangat Baik';
    if (percentage >= 70) return 'Baik';
    if (percentage >= 60) return 'Sederhana';
    return 'Perlu Penambahbaikan';
  };

  // Generate QR Code
  React.useEffect(() => {
    const generateQRCode = async () => {
      try {
        const certificateData = {
          name: state.user.name,
          score: score,
          total: totalQuestions,
          percentage: percentage,
          grade: getGrade(),
          date: currentDate,
          id: `MOSTI-AI-${Date.now()}`
        };
        
        const qrData = JSON.stringify(certificateData);
        const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
          width: 200,
          margin: 2,
          color: {
            dark: '#4F46E5',
            light: '#FFFFFF'
          }
        });
        
        setQrCodeUrl(qrCodeDataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRCode();
  }, [state.user.name, score, percentage, currentDate]);

  const downloadPDF = async () => {
    if (!certificateRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 297; // A4 landscape width
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Sijil-AI-${state.user.name}-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Ralat semasa menjana PDF. Sila cuba lagi.');
    } finally {
      setIsGenerating(false);
    }
  };

  const shareResult = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Sijil Demo AI - MOSTI',
          text: `Saya telah menyelesaikan Demo Stack Model AI dengan markah ${score}/${totalQuestions} (${percentage}%)!`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const text = `Saya telah menyelesaikan Demo Stack Model AI dengan markah ${score}/${totalQuestions} (${percentage}%)!`;
      navigator.clipboard.writeText(text);
      alert('Teks telah disalin ke clipboard!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 max-w-6xl mx-auto p-3 overflow-y-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-3"
        >
          <motion.div
            className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-2"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            <Award className="text-white" size={20} />
          </motion.div>
          
          <h1 className="text-lg font-bold text-gray-800 mb-1">
            Sijil Pencapaian Anda
          </h1>
          
          <p className="text-sm text-gray-600">
            Tahniah! Anda telah berjaya menyelesaikan Demo Stack Model AI
          </p>
        </motion.div>

        {/* Certificate */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-3"
        >
          <div
            ref={certificateRef}
            className="bg-white border-4 border-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              border: '4px solid',
              borderImage: 'linear-gradient(135deg, #3b82f6, #8b5cf6) 1'
            }}
          >
            {/* Certificate Header */}
            <div className="text-center mb-3">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Trophy className="text-white" size={16} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">MOSTI</h2>
                  <p className="text-xs text-gray-600">Kementerian Sains, Teknologi dan Inovasi</p>
                </div>
              </div>
              
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                SIJIL PENCAPAIAN
              </h1>
              
              <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full"></div>
            </div>

            {/* Certificate Body */}
            <div className="text-center mb-3">
              <p className="text-xs text-gray-700 mb-2">
                Dengan ini disahkan bahawa
              </p>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded p-2 mb-2">
                <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  {state.user.name}
                </h2>
              </div>
              
              <p className="text-xs text-gray-700 mb-2">
                telah berjaya menyelesaikan
              </p>
              
              <h3 className="text-sm font-bold text-gray-800 mb-2">
                Demo Stack Model Kecerdasan Buatan (AI)
              </h3>
              
              <p className="text-xs text-gray-700 mb-3">
                dan telah menunjukkan pemahaman yang baik tentang teknologi AI termasuk
                Large Language Models (LLM), Vision Language Models (VLM),
                Speech-to-Text (Whisper), dan Text-to-Speech (TTS)
              </p>
            </div>

            {/* Achievement Details */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center bg-white rounded p-2 shadow">
                <Star className="mx-auto text-yellow-500 mb-1" size={12} />
                <div className="text-sm font-bold text-gray-800">{score}/{totalQuestions}</div>
                <p className="text-xs text-gray-600">Markah Kuiz</p>
              </div>
              
              <div className="text-center bg-white rounded p-2 shadow">
                <Trophy className="mx-auto text-blue-500 mb-1" size={12} />
                <div className="text-sm font-bold text-gray-800">{percentage}%</div>
                <p className="text-xs text-gray-600">Peratusan</p>
              </div>
              
              <div className="text-center bg-white rounded p-2 shadow">
                <Award className="mx-auto text-purple-500 mb-1" size={12} />
                <div className="text-sm font-bold text-gray-800">{getGrade()}</div>
                <p className="text-xs text-gray-600">Gred</p>
              </div>
            </div>

            {/* Achievement Level */}
            <div className="text-center mb-3">
              <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full font-bold text-xs">
                Tahap Pencapaian: {getAchievementLevel()}
              </div>
            </div>

            {/* Certificate Footer */}
            <div className="flex justify-between items-end text-xs">
              <div className="text-left">
                <div className="flex items-center space-x-1 mb-1">
                  <Calendar className="text-gray-500" size={10} />
                  <span className="text-gray-600">Tarikh: {currentDate}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="text-gray-500" size={10} />
                  <span className="text-gray-600">ID: MOSTI-AI-{Date.now().toString().slice(-6)}</span>
                </div>
              </div>
              
              {qrCodeUrl && (
                <div className="text-center">
                  <img src={qrCodeUrl} alt="QR Code" className="w-12 h-12 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Imbas untuk pengesahan</p>
                </div>
              )}
              
              <div className="text-right">
                <div className="border-t border-gray-400 pt-1 w-16">
                  <p className="text-xs font-semibold text-gray-700">Pengarah</p>
                  <p className="text-xs text-gray-600">MOSTI</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-2 justify-center items-center mb-3"
        >
          <motion.button
            onClick={downloadPDF}
            disabled={isGenerating}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold text-sm shadow transition-all ${
              isGenerating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg'
            }`}
            whileHover={!isGenerating ? { scale: 1.05 } : {}}
            whileTap={!isGenerating ? { scale: 0.95 } : {}}
          >
            <Download size={16} />
            <span>{isGenerating ? 'Menjana PDF...' : 'Muat Turun PDF'}</span>
          </motion.button>
          
          <motion.button
            onClick={shareResult}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold text-sm shadow hover:bg-green-600 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Share2 size={16} />
            <span>Kongsi Pencapaian</span>
          </motion.button>
        </motion.div>

        {/* QR Code Info */}
        {qrCodeUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3"
          >
            <div className="flex items-start space-x-2">
              <QrCode className="text-blue-600 flex-shrink-0 mt-1" size={16} />
              <div>
                <h3 className="font-semibold text-blue-800 mb-1 text-sm">Kod QR Pengesahan</h3>
                <p className="text-blue-700 text-xs">
                  Kod QR di atas mengandungi maklumat pengesahan sijil anda. Ia boleh diimbas
                  untuk mengesahkan kesahihan sijil dan melihat butiran pencapaian anda.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Congratulations Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3 text-center"
        >
          <Trophy className="mx-auto text-yellow-500 mb-2" size={20} />
          <h3 className="text-sm font-semibold text-gray-800 mb-1">
            Tahniah atas Pencapaian Anda! 🎉
          </h3>
          <p className="text-xs text-gray-600">
            Anda telah berjaya menyelesaikan Demo Stack Model AI dan memperoleh pengetahuan
            berharga tentang teknologi kecerdasan buatan. Teruskan pembelajaran dan jelajahi
            dunia AI yang menarik ini!
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default CertificatePage;