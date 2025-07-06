import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout for AI responses
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
  }
);

export interface ChatResponse {
  content: string;
  metadata: {
    provider: string;
    model: string;
    tokens?: number;
    safetyScore: number;
    processingTime: number;
  };
  sessionId?: string;
}

export interface ValidationResponse {
  isValid: boolean;
  safetyScore: number;
  issues?: string[];
  suggestions?: string[];
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: boolean;
    redis: boolean;
    aiProviders: {
      openai: boolean;
      anthropic: boolean;
      gemini: boolean;
    };
  };
}

// Send a message to the AI tutor
export async function sendMessage(
  message: string,
  sessionId?: string
): Promise<ChatResponse> {
  const response = await api.post('/api/chat', {
    message,
    sessionId,
  });
  
  return response.data;
}

// Validate a message before sending
export async function validateMessage(message: string): Promise<ValidationResponse> {
  const response = await api.post('/api/validate', {
    message,
  });
  
  return response.data;
}

// Get chat history
export async function getChatHistory(sessionId?: string): Promise<{
  messages: Array<{
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
    metadata?: any;
  }>;
  sessionId: string;
}> {
  const response = await api.get('/api/chat/history', {
    params: sessionId ? { sessionId } : undefined,
  });
  
  return response.data;
}

// Health check
export async function checkHealth(): Promise<HealthResponse> {
  const response = await api.get('/api/health');
  return response.data;
}

// Clear chat history
export async function clearChatHistory(sessionId: string): Promise<void> {
  await api.delete(`/api/chat/history/${sessionId}`);
}

// Get available AI providers
export async function getAvailableProviders(): Promise<{
  providers: Array<{
    name: string;
    status: 'available' | 'unavailable';
    models: string[];
  }>;
}> {
  const response = await api.get('/api/providers');
  return response.data;
}