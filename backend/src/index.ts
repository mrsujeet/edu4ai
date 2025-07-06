import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { config } from '@/config/config';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { rateLimiter } from '@/middleware/rateLimiter';
import { validateRequest } from '@/middleware/validation';

// Routes
import chatRoutes from '@/routes/chat';
import healthRoutes from '@/routes/health';
import validateRoutes from '@/routes/validate';
import providersRoutes from '@/routes/providers';

// Services
import { DatabaseService } from '@/services/DatabaseService';
import { RedisService } from '@/services/RedisService';

// Load environment variables
dotenv.config();

class Application {
  public app: express.Application;
  private server: any;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS
    this.app.use(cors({
      origin: config.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Compression
    this.app.use(compression());

    // Logging
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim())
      }
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    this.app.use(rateLimiter);

    // Health check endpoint (before auth)
    this.app.get('/ping', (req, res) => {
      res.json({ message: 'pong', timestamp: new Date().toISOString() });
    });
  }

  private initializeRoutes(): void {
    const apiPrefix = `/api/${config.apiVersion}`;
    
    this.app.use(`${apiPrefix}/chat`, chatRoutes);
    this.app.use(`${apiPrefix}/health`, healthRoutes);
    this.app.use(`${apiPrefix}/validate`, validateRoutes);
    this.app.use(`${apiPrefix}/providers`, providersRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.originalUrl,
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize database
      await DatabaseService.connect();
      logger.info('Database connected successfully');

      // Initialize Redis
      await RedisService.connect();
      logger.info('Redis connected successfully');

    } catch (error) {
      logger.error('Failed to initialize services:', error);
      process.exit(1);
    }
  }

  public async start(): Promise<void> {
    try {
      await this.initializeServices();

      this.server = this.app.listen(config.port, () => {
        logger.info(`
🚀 Edu4.AI Backend Server Started
🌍 Environment: ${config.nodeEnv}
🚪 Port: ${config.port}
📡 API Version: ${config.apiVersion}
🔗 URL: http://localhost:${config.port}
📚 API Docs: http://localhost:${config.port}/api/${config.apiVersion}/health
        `);
      });

      // Graceful shutdown handling
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      if (this.server) {
        this.server.close(async () => {
          logger.info('HTTP server closed');

          try {
            await DatabaseService.disconnect();
            await RedisService.disconnect();
            logger.info('All services disconnected');
            process.exit(0);
          } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
          }
        });
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }
}

// Start the application
const app = new Application();
app.start().catch((error) => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});

export default app;