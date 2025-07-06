import { Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { aiService } from '@/services/AIService';
import { safetyService } from '@/services/SafetyService';
import { logger } from '@/utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Validation schemas
const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().optional(),
  provider: z.enum(['openai', 'anthropic', 'google']).optional(),
  maxTokens: z.number().min(1).max(4000).optional(),
  temperature: z.number().min(0).max(2).optional(),
});

const historyRequestSchema = z.object({
  sessionId: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export class ChatController {
  
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validatedData = chatRequestSchema.parse(req.body);
      const { message, sessionId, provider, maxTokens, temperature } = validatedData;

      logger.info('Chat request received', {
        messageLength: message.length,
        sessionId,
        provider,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Generate or use existing session ID
      const currentSessionId = sessionId || uuidv4();

      // Safety validation
      const safetyValidation = await safetyService.validateContent(message);
      
      if (!safetyValidation.isValid) {
        logger.warn('Message blocked by safety filter', {
          sessionId: currentSessionId,
          safetyScore: safetyValidation.safetyScore,
          issues: safetyValidation.issues,
        });

        // Log safety event
        await safetyService.logSafetyEvent(message, safetyValidation, 'blocked');

        res.status(400).json({
          success: false,
          message: 'Message blocked by safety filters',
          issues: safetyValidation.issues,
          suggestions: safetyValidation.suggestions,
          safetyScore: safetyValidation.safetyScore,
        });
        return;
      }

      // Store user message
      const userMessage = await prisma.message.create({
        data: {
          sessionId: currentSessionId,
          role: 'USER',
          content: message,
          safetyScore: safetyValidation.safetyScore,
        },
      });

      // Generate AI response
      const aiResponse = await aiService.generateResponse({
        message,
        provider,
        maxTokens,
        temperature,
      });

      // Store AI response
      const assistantMessage = await prisma.message.create({
        data: {
          sessionId: currentSessionId,
          role: 'ASSISTANT',
          content: aiResponse.content,
          provider: aiResponse.provider,
          model: aiResponse.model,
          tokens: aiResponse.tokens,
          safetyScore: aiResponse.safetyScore,
          processingTime: aiResponse.processingTime,
          metadata: {
            requestId: uuidv4(),
            userAgent: req.get('User-Agent'),
            ip: req.ip,
          },
        },
      });

      // Update or create session
      await prisma.chatSession.upsert({
        where: { id: currentSessionId },
        update: { 
          updatedAt: new Date(),
          metadata: {
            lastProvider: aiResponse.provider,
            messageCount: { increment: 2 },
          },
        },
        create: {
          id: currentSessionId,
          title: this.generateSessionTitle(message),
          metadata: {
            firstMessage: message.substring(0, 100),
            provider: aiResponse.provider,
            messageCount: 2,
          },
        },
      });

      logger.info('Chat response generated successfully', {
        sessionId: currentSessionId,
        messageId: assistantMessage.id,
        provider: aiResponse.provider,
        tokens: aiResponse.tokens,
        processingTime: aiResponse.processingTime,
        safetyScore: aiResponse.safetyScore,
      });

      res.json({
        success: true,
        content: aiResponse.content,
        metadata: {
          provider: aiResponse.provider,
          model: aiResponse.model,
          tokens: aiResponse.tokens,
          safetyScore: aiResponse.safetyScore,
          processingTime: aiResponse.processingTime,
        },
        sessionId: currentSessionId,
      });

    } catch (error) {
      logger.error('Chat request failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        body: req.body,
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid request data',
          errors: error.errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  async getChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, limit, offset } = historyRequestSchema.parse(req.query);

      let whereClause = {};
      if (sessionId) {
        whereClause = { sessionId };
      }

      const messages = await prisma.message.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          content: true,
          role: true,
          createdAt: true,
          provider: true,
          model: true,
          tokens: true,
          safetyScore: true,
          processingTime: true,
          session: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      const totalCount = await prisma.message.count({
        where: whereClause,
      });

      logger.info('Chat history retrieved', {
        sessionId,
        messageCount: messages.length,
        totalCount,
        limit,
        offset,
      });

      res.json({
        success: true,
        messages: messages.reverse(), // Return in chronological order
        sessionId,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      });

    } catch (error) {
      logger.error('Failed to retrieve chat history', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query,
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve chat history',
      });
    }
  }

  async clearChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: 'Session ID is required',
        });
        return;
      }

      // Delete all messages in the session
      const deleteResult = await prisma.message.deleteMany({
        where: { sessionId },
      });

      // Delete the session
      await prisma.chatSession.delete({
        where: { id: sessionId },
      });

      logger.info('Chat history cleared', {
        sessionId,
        deletedMessages: deleteResult.count,
      });

      res.json({
        success: true,
        message: 'Chat history cleared successfully',
        deletedMessages: deleteResult.count,
      });

    } catch (error) {
      logger.error('Failed to clear chat history', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: req.params.sessionId,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to clear chat history',
      });
    }
  }

  async getSessions(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 20, offset = 0 } = req.query;

      const sessions = await prisma.chatSession.findMany({
        orderBy: { updatedAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          metadata: true,
          _count: {
            select: {
              messages: true,
            },
          },
        },
      });

      const totalCount = await prisma.chatSession.count();

      logger.info('Sessions retrieved', {
        sessionCount: sessions.length,
        totalCount,
        limit,
        offset,
      });

      res.json({
        success: true,
        sessions,
        pagination: {
          total: totalCount,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < totalCount,
        },
      });

    } catch (error) {
      logger.error('Failed to retrieve sessions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve sessions',
      });
    }
  }

  private generateSessionTitle(firstMessage: string): string {
    // Generate a concise title from the first message
    const title = firstMessage
      .substring(0, 50)
      .trim()
      .replace(/[^\w\s]/g, '')
      .substring(0, 30);
    
    return title || 'New Chat Session';
  }
}

export const chatController = new ChatController();