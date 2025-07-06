// Common types shared between frontend and backend

export interface User {
  id: string;
  email?: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSession {
  id: string;
  userId?: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: Date;
  provider?: string;
  model?: string;
  tokens?: number;
  safetyScore?: number;
  processingTime?: number;
  metadata?: Record<string, any>;
}

export interface AIProvider {
  name: string;
  status: 'available' | 'unavailable';
  models: string[];
  responseTime?: number;
  errorRate?: number;
}

export interface SafetyValidation {
  isValid: boolean;
  safetyScore: number;
  issues?: string[];
  suggestions?: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  provider?: 'openai' | 'anthropic' | 'google';
  maxTokens?: number;
  temperature?: number;
}

export interface ChatResponse {
  content: string;
  metadata: {
    provider: string;
    model: string;
    tokens?: number;
    safetyScore: number;
    processingTime: number;
  };
  sessionId: string;
}

export interface ValidationRequest {
  message: string;
}

export interface ValidationResponse {
  isValid: boolean;
  safetyScore: number;
  issues?: string[];
  suggestions?: string[];
}

export interface HealthCheckResponse {
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
  uptime: number;
  version: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Error types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class SafetyError extends AppError {
  constructor(message: string) {
    super(message, 403);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429);
  }
}

// Constants
export const SUPPORTED_AI_PROVIDERS = ['openai', 'anthropic', 'google'] as const;
export const MESSAGE_ROLES = ['USER', 'ASSISTANT', 'SYSTEM'] as const;
export const SAFETY_THRESHOLDS = {
  MIN_SCORE: 0.7,
  WARN_SCORE: 0.8,
  SAFE_SCORE: 0.9,
} as const;

export type AIProviderType = typeof SUPPORTED_AI_PROVIDERS[number];
export type MessageRole = typeof MESSAGE_ROLES[number];