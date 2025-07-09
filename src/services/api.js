// API Service for AI Demo Backend Integration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class APIService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // LLM Chat API
  async chatWithLLM(message, conversationHistory = []) {
    return this.request('/llm/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        history: conversationHistory,
      }),
    });
  }

  // VLM (Vision Language Model) API
  async analyzeImage(imageBase64, prompt = "Describe this image in detail") {
    return this.request('/vlm/analyze', {
      method: 'POST',
      body: JSON.stringify({
        image: imageBase64,
        prompt,
      }),
    });
  }

  // Whisper Speech-to-Text API
  async transcribeAudio(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    
    return this.request('/whisper/transcribe', {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData,
    });
  }

  // TTS (Text-to-Speech) API
  async synthesizeSpeech(text, language = 'ms') {
    const response = await fetch(`${this.baseURL}/tts/synthesize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        language,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob(); // Return audio blob
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Get available models
  async getModels() {
    return this.request('/models');
  }
}

// Create singleton instance
const apiService = new APIService();

export default apiService;

// Export individual methods for convenience
export const {
  chatWithLLM,
  analyzeImage,
  transcribeAudio,
  synthesizeSpeech,
  healthCheck,
  getModels,
} = apiService;