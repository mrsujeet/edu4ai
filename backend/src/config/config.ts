import dotenv from 'dotenv';

dotenv.config();

interface Config {
  // Server
  nodeEnv: string;
  port: number;
  apiVersion: string;
  
  // Database
  databaseUrl: string;
  
  // Redis
  redisUrl: string;
  
  // JWT
  jwtSecret: string;
  jwtExpiresIn: string;
  
  // AI Providers
  openaiApiKey?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
  
  // AI Models
  defaultAiProvider: string;
  openaiModel: string;
  anthropicModel: string;
  googleModel: string;
  
  // Safety
  minSafetyScore: number;
  maxTokensPerRequest: number;
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  
  // Content Filtering
  enableContentFiltering: boolean;
  blockedKeywords: string[];
  educationalTopics: string[];
  
  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  
  // Logging
  logLevel: string;
  logFile: string;
  
  // CORS
  corsOrigin: string;
  
  // Session
  sessionSecret: string;
  sessionMaxAge: number;
  
  // Health Check
  healthCheckInterval: number;
  
  // Monitoring
  enableMonitoring: boolean;
  monitoringEndpoint: string;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value || defaultValue!;
};

const getEnvNumber = (key: string, defaultValue?: number): number => {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value ? parseInt(value, 10) : defaultValue!;
};

const getEnvBoolean = (key: string, defaultValue: boolean = false): boolean => {
  const value = process.env[key];
  return value ? value.toLowerCase() === 'true' : defaultValue;
};

const getEnvArray = (key: string, defaultValue: string[] = []): string[] => {
  const value = process.env[key];
  return value ? value.split(',').map(item => item.trim()) : defaultValue;
};

export const config: Config = {
  // Server
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  port: getEnvNumber('PORT', 8000),
  apiVersion: getEnvVar('API_VERSION', 'v1'),
  
  // Database
  databaseUrl: getEnvVar('DATABASE_URL'),
  
  // Redis
  redisUrl: getEnvVar('REDIS_URL', 'redis://localhost:6379'),
  
  // JWT
  jwtSecret: getEnvVar('JWT_SECRET'),
  jwtExpiresIn: getEnvVar('JWT_EXPIRES_IN', '7d'),
  
  // AI Providers
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  googleApiKey: process.env.GOOGLE_API_KEY,
  
  // AI Models
  defaultAiProvider: getEnvVar('DEFAULT_AI_PROVIDER', 'openai'),
  openaiModel: getEnvVar('OPENAI_MODEL', 'gpt-4'),
  anthropicModel: getEnvVar('ANTHROPIC_MODEL', 'claude-3-sonnet-20240229'),
  googleModel: getEnvVar('GOOGLE_MODEL', 'gemini-pro'),
  
  // Safety
  minSafetyScore: getEnvNumber('MIN_SAFETY_SCORE', 70) / 100,
  maxTokensPerRequest: getEnvNumber('MAX_TOKENS_PER_REQUEST', 4000),
  maxRequestsPerMinute: getEnvNumber('MAX_REQUESTS_PER_MINUTE', 30),
  maxRequestsPerHour: getEnvNumber('MAX_REQUESTS_PER_HOUR', 300),
  
  // Content Filtering
  enableContentFiltering: getEnvBoolean('ENABLE_CONTENT_FILTERING', true),
  blockedKeywords: getEnvArray('BLOCKED_KEYWORDS', ['inappropriate', 'harmful', 'dangerous']),
  educationalTopics: getEnvArray('EDUCATIONAL_TOPICS', [
    'math', 'science', 'literature', 'history', 'programming', 'language'
  ]),
  
  // Rate Limiting
  rateLimitWindowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 60000),
  rateLimitMaxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
  
  // Logging
  logLevel: getEnvVar('LOG_LEVEL', 'info'),
  logFile: getEnvVar('LOG_FILE', 'logs/app.log'),
  
  // CORS
  corsOrigin: getEnvVar('CORS_ORIGIN', 'http://localhost:3000'),
  
  // Session
  sessionSecret: getEnvVar('SESSION_SECRET'),
  sessionMaxAge: getEnvNumber('SESSION_MAX_AGE', 86400000),
  
  // Health Check
  healthCheckInterval: getEnvNumber('HEALTH_CHECK_INTERVAL', 30000),
  
  // Monitoring
  enableMonitoring: getEnvBoolean('ENABLE_MONITORING', true),
  monitoringEndpoint: getEnvVar('MONITORING_ENDPOINT', '/metrics'),
};

// Validate required configurations
const validateConfig = () => {
  const required = [
    'databaseUrl',
    'jwtSecret',
    'sessionSecret',
  ];
  
  const missing = required.filter(key => !config[key as keyof Config]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Check if at least one AI provider is configured
  const hasAiProvider = config.openaiApiKey || config.anthropicApiKey || config.googleApiKey;
  if (!hasAiProvider) {
    console.warn('⚠️  No AI provider API keys configured. AI features will not work.');
  }
};

// Validate on import
validateConfig();

export default config;