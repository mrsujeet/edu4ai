import winston from 'winston';
import path from 'path';
import { config } from '@/config/config';

// Create logs directory if it doesn't exist
const logsDir = path.dirname(config.logFile);

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    return logMessage;
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} ${level}: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

export const logger = winston.createLogger({
  level: config.logLevel,
  format: logFormat,
  defaultMeta: { service: 'edu4ai-backend' },
  transports: [
    // File transport for all logs
    new winston.transports.File({
      filename: config.logFile,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    
    // File transport for errors only
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760,
      maxFiles: 5,
      tailable: true
    })
  ],
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 10485760,
      maxFiles: 3
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 10485760,
      maxFiles: 3
    })
  ]
});

// Add console transport for development
if (config.nodeEnv === 'development') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Create child loggers for different modules
export const createModuleLogger = (module: string) => {
  return logger.child({ module });
};

// Specific loggers for different parts of the application
export const aiLogger = createModuleLogger('AI');
export const safetyLogger = createModuleLogger('SAFETY');
export const dbLogger = createModuleLogger('DATABASE');
export const redisLogger = createModuleLogger('REDIS');
export const httpLogger = createModuleLogger('HTTP');

// Log levels: error, warn, info, http, verbose, debug, silly
export default logger;