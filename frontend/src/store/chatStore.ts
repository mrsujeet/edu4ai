import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  metadata?: {
    provider?: string;
    model?: string;
    tokens?: number;
    safetyScore?: number;
  };
  isError?: boolean;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  sessionId: string | null;
  addMessage: (message: Message) => void;
  addResponse: (message: Message) => void;
  addError: (message: Message) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setSessionId: (sessionId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      sessionId: null,

      addMessage: (message: Message) => {
        set((state) => ({
          messages: [...state.messages, {
            ...message,
            timestamp: new Date(message.timestamp)
          }]
        }));
      },

      addResponse: (message: Message) => {
        set((state) => ({
          messages: [...state.messages, {
            ...message,
            timestamp: new Date(message.timestamp)
          }]
        }));
      },

      addError: (message: Message) => {
        set((state) => ({
          messages: [...state.messages, {
            ...message,
            timestamp: new Date(message.timestamp),
            isError: true
          }]
        }));
      },

      clearMessages: () => {
        set({ messages: [], sessionId: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setSessionId: (sessionId: string) => {
        set({ sessionId });
      }
    }),
    {
      name: 'edu4ai-chat-storage',
      partialize: (state) => ({
        messages: state.messages,
        sessionId: state.sessionId
      }),
    }
  )
);