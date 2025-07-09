// API Service for AI Demo Backend Integration
// Use relative URL for API calls - this will work through Vite proxy
const API_BASE_URL = '';

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
    return this.request('/api/llm', {
      method: 'POST',
      body: JSON.stringify({
        message,
        history: conversationHistory,
      }),
    });
  }

  // VLM (Vision Language Model) API
  async analyzeImage(imageBase64, prompt = "Describe this image in detail") {
    return this.request('/api/vlm', {
      method: 'POST',
      body: JSON.stringify({
        image_base64: imageBase64,
        prompt,
      }),
    });
  }

  // Whisper Speech-to-Text API
  async transcribeAudio(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    
    return this.request('/api/whisper', {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData,
    });
  }

  // TTS (Text-to-Speech) API
  async synthesizeSpeech(text, voice = 'female', speed = 1.0) {
    const response = await fetch(`${this.baseURL}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice,
        speed,
        user_name: 'User'
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get JSON response with base64 audio
    const data = await response.json();
    
    // Convert base64 to blob
    const audioBase64 = data.audio_base64;
    const binaryString = atob(audioBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create blob with proper MIME type for WAV audio
    const audioBlob = new Blob([bytes], { type: 'audio/wav' });
    return audioBlob;
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