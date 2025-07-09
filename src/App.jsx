import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// Import pages
import WelcomePage from './pages/WelcomePage';
import LearningInfoPage from './pages/LearningInfoPage';
import NameInputPage from './pages/NameInputPage';
import LLMDemoPage from './pages/LLMDemoPage';
import VLMDemoPage from './pages/VLMDemoPage';
import WhisperDemoPage from './pages/WhisperDemoPage';
import TTSDemoPage from './pages/TTSDemoPage';
import QuizPage from './pages/QuizPage';
import ResultsPage from './pages/ResultsPage';
import CertificatePage from './pages/CertificatePage';

// Import layout components
import Layout from './components/layout/Layout';

function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/info" element={<LearningInfoPage />} />
            <Route path="/nama" element={<NameInputPage />} />
            <Route path="/llm" element={<LLMDemoPage />} />
            <Route path="/vlm" element={<VLMDemoPage />} />
            <Route path="/whisper" element={<WhisperDemoPage />} />
            <Route path="/tts" element={<TTSDemoPage />} />
            <Route path="/kuiz" element={<QuizPage />} />
            <Route path="/keputusan" element={<ResultsPage />} />
            <Route path="/sijil" element={<CertificatePage />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;