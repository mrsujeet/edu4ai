'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { Message } from '@/store/chatStore';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isError = message.isError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`chat-message ${isUser ? 'user' : 'assistant'} ${
        isError ? 'border border-red-200 bg-red-50' : ''
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser
              ? 'bg-blue-600 text-white'
              : isError
              ? 'bg-red-100 text-red-600'
              : 'bg-purple-100 text-purple-600'
          }`}
        >
          {isUser ? (
            <User className="w-4 h-4" />
          ) : isError ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900">
            {isUser ? 'You' : isError ? 'Error' : 'AI Tutor'}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          {message.metadata?.safetyScore && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                message.metadata.safetyScore >= 0.8
                  ? 'bg-green-100 text-green-700'
                  : message.metadata.safetyScore >= 0.6
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              Safety: {Math.round(message.metadata.safetyScore * 100)}%
            </span>
          )}
        </div>

        <div className="text-gray-900">
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code: ({ node, inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    ) : (
                      <code
                        className="bg-gray-100 px-1 py-0.5 rounded text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => <>{children}</>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Metadata */}
        {message.metadata && !isUser && (
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-4">
            {message.metadata.provider && (
              <span>Provider: {message.metadata.provider}</span>
            )}
            {message.metadata.model && (
              <span>Model: {message.metadata.model}</span>
            )}
            {message.metadata.tokens && (
              <span>Tokens: {message.metadata.tokens}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}