import React, { createContext, useContext, useReducer } from 'react';

const AppContext = createContext();

const initialState = {
  user: {
    name: '',
    progress: 0,
  },
  quiz: {
    currentQuestion: 0,
    answers: [],
    score: 0,
    completed: false,
  },
  aiDemos: {
    llm: {
      chatHistory: [],
      isLoading: false,
    },
    vlm: {
      images: [],
      results: [],
      isLoading: false,
    },
    whisper: {
      transcriptions: [],
      isRecording: false,
      isLoading: false,
    },
    tts: {
      audioFiles: [],
      isGenerating: false,
    },
  },
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_USER_NAME':
      return {
        ...state,
        user: { ...state.user, name: action.payload },
      };
    
    case 'UPDATE_PROGRESS':
      return {
        ...state,
        user: { ...state.user, progress: action.payload },
      };
    
    case 'ADD_LLM_MESSAGE':
      return {
        ...state,
        aiDemos: {
          ...state.aiDemos,
          llm: {
            ...state.aiDemos.llm,
            chatHistory: [...state.aiDemos.llm.chatHistory, action.payload],
          },
        },
      };
    
    case 'SET_LLM_LOADING':
      return {
        ...state,
        aiDemos: {
          ...state.aiDemos,
          llm: { ...state.aiDemos.llm, isLoading: action.payload },
        },
      };
    
    case 'ADD_VLM_MESSAGE':
      return {
        ...state,
        aiDemos: {
          ...state.aiDemos,
          vlm: {
            ...state.aiDemos.vlm,
            results: [...state.aiDemos.vlm.results, action.payload],
          },
        },
      };
    
    case 'ADD_VLM_RESULT':
      return {
        ...state,
        aiDemos: {
          ...state.aiDemos,
          vlm: {
            ...state.aiDemos.vlm,
            images: [...state.aiDemos.vlm.images, action.payload.image],
            results: [...state.aiDemos.vlm.results, action.payload.result],
          },
        },
      };
    
    case 'SET_VLM_LOADING':
      return {
        ...state,
        aiDemos: {
          ...state.aiDemos,
          vlm: { ...state.aiDemos.vlm, isLoading: action.payload },
        },
      };
    
    case 'ADD_WHISPER_TRANSCRIPTION':
      return {
        ...state,
        aiDemos: {
          ...state.aiDemos,
          whisper: {
            ...state.aiDemos.whisper,
            transcriptions: [...state.aiDemos.whisper.transcriptions, action.payload],
          },
        },
      };
    
    case 'SET_WHISPER_RECORDING':
      return {
        ...state,
        aiDemos: {
          ...state.aiDemos,
          whisper: { ...state.aiDemos.whisper, isRecording: action.payload },
        },
      };
    
    case 'SET_WHISPER_LOADING':
      return {
        ...state,
        aiDemos: {
          ...state.aiDemos,
          whisper: { ...state.aiDemos.whisper, isLoading: action.payload },
        },
      };
    
    case 'ADD_TTS_AUDIO':
      return {
        ...state,
        aiDemos: {
          ...state.aiDemos,
          tts: {
            ...state.aiDemos.tts,
            audioFiles: [...state.aiDemos.tts.audioFiles, action.payload],
          },
        },
      };
    
    case 'SET_TTS_GENERATING':
      return {
        ...state,
        aiDemos: {
          ...state.aiDemos,
          tts: { ...state.aiDemos.tts, isGenerating: action.payload },
        },
      };
    
    case 'SET_QUIZ_ANSWER':
      const newAnswers = [...state.quiz.answers];
      newAnswers[action.payload.questionIndex] = action.payload.answer;
      return {
        ...state,
        quiz: { ...state.quiz, answers: newAnswers },
      };
    
    case 'NEXT_QUESTION':
      return {
        ...state,
        quiz: {
          ...state.quiz,
          currentQuestion: Math.min(state.quiz.currentQuestion + 1, 9),
        },
      };
    
    case 'PREVIOUS_QUESTION':
      return {
        ...state,
        quiz: {
          ...state.quiz,
          currentQuestion: Math.max(state.quiz.currentQuestion - 1, 0),
        },
      };
    
    case 'SET_CURRENT_QUESTION':
      return {
        ...state,
        quiz: {
          ...state.quiz,
          currentQuestion: action.payload,
        },
      };
    
    case 'COMPLETE_QUIZ':
      return {
        ...state,
        quiz: {
          ...state.quiz,
          completed: true,
          score: action.payload,
        },
      };
    
    case 'RESET_QUIZ':
      return {
        ...state,
        quiz: {
          currentQuestion: 0,
          answers: [],
          score: 0,
          completed: false,
        },
      };
    
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}