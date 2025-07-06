'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, AlertTriangle } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { sendMessage } from '@/lib/api';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

export default function ChatInterface() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, addMessage, addResponse, addError } = useChatStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user' as const,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessage(input.trim());
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        role: 'assistant' as const,
        timestamp: new Date(),
        metadata: response.metadata,
      };

      addResponse(assistantMessage);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      addError({
        id: (Date.now() + 1).toString(),
        content: errorMessage,
        role: 'assistant' as const,
        timestamp: new Date(),
        isError: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-4 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div>
            <h2 className="font-semibold text-gray-900">AI Tutor</h2>
            <p className="text-sm text-gray-600">Ready to help you learn</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎓</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome to Edu4.AI!
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Ask me any educational question and I'll provide safe, helpful explanations 
              to help you learn better.
            </p>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </AnimatePresence>

        {isLoading && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask your question here... (Press Enter to send, Shift+Enter for new line)"
              className="input resize-none min-h-[44px] max-h-32 py-3 pr-12"
              rows={1}
              disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
              {input.length}/2000
            </div>
          </div>
          
          <motion.button
            type="submit"
            disabled={!input.trim() || isLoading}
            whileHover={{ scale: input.trim() && !isLoading ? 1.05 : 1 }}
            whileTap={{ scale: input.trim() && !isLoading ? 0.95 : 1 }}
            className="btn-primary min-w-[44px] h-[44px] p-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </motion.button>
        </form>

        {/* Safety Notice */}
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
          <AlertTriangle className="w-3 h-3" />
          <span>
            This AI tutor is designed for educational purposes. Responses are filtered for safety.
          </span>
        </div>
      </div>
    </div>
  );
}