import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, QrCode, Share2, Calendar, User, Brain, Eye, Mic, Volume2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logoImage from '../assets/logo.png';

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

  const floatingIcons = [
    { Icon: Brain, delay: 0, x: "10%", y: "20%" },
    { Icon: Eye, delay: 2, x: "80%", y: "15%" },
    { Icon: Mic, delay: 4, x: "15%", y: "70%" },
    { Icon: Volume2, delay: 6, x: "85%", y: "75%" },
    { Icon: Brain, delay: 1, x: "70%", y: "40%" },
    { Icon: Eye, delay: 3, x: "25%", y: "45%" },
    { Icon: Mic, delay: 5, x: "60%", y: "80%" },
    { Icon: Volume2, delay: 7, x: "40%", y: "25%" }
  ];

  // Generate QR Code
  React.useEffect(() => {
    const generateQRCode = async () => {
      try {
        const certificateId = `MOSTI-AI-${Date.now()}`;
        
        // Create URL that points to the PDF certificate endpoint
        const baseUrl = window.location.origin.replace(':5174', ':8002'); // Replace frontend port with backend port
        const pdfUrl = `${baseUrl}/api/certificate/pdf`;
        
        // Store certificate data for PDF generation
        const certificateData = {
          name: state.user.name,
          date: currentDate,
          certificate_id: certificateId
        };
        
        // Store in sessionStorage for later use
        sessionStorage.setItem('certificateData', JSON.stringify(certificateData));
        
        // Create QR code that contains the PDF URL with certificate data as query params
        const qrUrl = `${pdfUrl}?name=${encodeURIComponent(state.user.name)}&date=${encodeURIComponent(currentDate)}&certificate_id=${encodeURIComponent(certificateId)}`;
        
        const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
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
  }, [state.user.name, currentDate]);

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
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 portrait width
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
          text: `Saya telah menyelesaikan Demo Stack Model AI!`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const text = `Saya telah menyelesaikan Demo Stack Model AI!`;
      navigator.clipboard.writeText(text);
      alert('Teks telah disalin ke clipboard!');
    }
  };

  return (
    <div className="h-full overflow-y-auto relative overflow-hidden">
      {/* Floating Background Animation */}
      {floatingIcons.map((item, index) => (
        <motion.div
          key={index}
          className="absolute opacity-10 pointer-events-none"
          style={{ left: item.x, top: item.y }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 8,
            delay: item.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <item.Icon size={40} />
        </motion.div>
      ))}

      <div className="max-w-full mx-auto p-3 min-h-full relative z-10">
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
            className="relative p-20 mx-auto"
            style={{
              background: 'linear-gradient(135deg, #fefcf3 0%, #f5f1e8 100%)',
              width: '210mm',
              minHeight: '297mm',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {/* Decorative cursive borders */}
            <div className="absolute inset-8 border-2 border-dashed border-amber-300 rounded-lg opacity-30"></div>
            <div className="absolute top-12 left-12 w-8 h-8 border-l-2 border-t-2 border-amber-400 rounded-tl-lg"></div>
            <div className="absolute top-12 right-12 w-8 h-8 border-r-2 border-t-2 border-amber-400 rounded-tr-lg"></div>
            <div className="absolute bottom-12 left-12 w-8 h-8 border-l-2 border-b-2 border-amber-400 rounded-bl-lg"></div>
            <div className="absolute bottom-12 right-12 w-8 h-8 border-r-2 border-b-2 border-amber-400 rounded-br-lg"></div>
            {/* Certificate Header */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <img src={logoImage} alt="MOSTI Logo" className="w-24 h-24 object-contain" />
              </div>
              
              <h1 className="text-4xl font-bold text-amber-800 mb-4">
                SIJIL PENCAPAIAN
              </h1>
              
              <div className="w-32 h-1 bg-gradient-to-r from-amber-600 to-amber-400 mx-auto rounded-full"></div>
            </div>

            {/* Certificate Body */}
            <div className="text-center mb-16 mt-32">
              <p className="text-lg text-amber-800 mb-16">
                Dengan ini disahkan bahawa
              </p>
              
              <div className="mb-16">
                <h2 className="text-3xl font-bold text-amber-800">
                  {state.user.name || 'Nama Peserta'}
                </h2>
              </div>
              
              <p className="text-lg text-amber-800 mb-16">
                telah diiktiraf sebagai
              </p>
              
              <h3 className="text-2xl font-bold text-amber-800 mb-16">
                Certified Gen-AI Learner
              </h3>
              
              <p className="text-base text-amber-700 mb-20 leading-relaxed max-w-2xl mx-auto">
                dan telah menunjukkan pemahaman yang baik tentang teknologi AI termasuk
                Large Language Models (LLM), Vision Language Models (VLM),
                Speech-to-Text (Whisper), dan Text-to-Speech (TTS)
              </p>
            </div>


            {/* Certificate Footer - Empty for clean look */}
            <div className="mt-auto">
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center items-center mb-3"
        >
          
        </motion.div>

        {/* QR Code Info */}
        {qrCodeUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3"
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="text-center">
                <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 mx-auto mb-2" />
                <h3 className="font-semibold text-amber-800 mb-1 text-sm">Kod QR Pengesahan</h3>
              </div>
              <p className="text-amber-700 text-xs text-center">
                Kod QR di atas mengandungi maklumat pengesahan sijil anda. Ia boleh diimbas
                untuk mengesahkan kesahihan sijil dan melihat butiran pencapaian anda.
              </p>
            </div>
          </motion.div>
        )}

        {/* Congratulations Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4 text-center"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <Award className="mx-auto text-amber-500 mb-3" size={24} />
          <h3 className="text-lg font-semibold text-amber-800 mb-2">
            Tahniah atas Pencapaian Anda! 🎉
          </h3>
          <p className="text-sm text-amber-700">
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