import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';
import { SafetyService } from './SafetyService';

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  tokens?: number;
  safetyScore: number;
  processingTime: number;
}

export interface AIRequest {
  message: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
  provider?: string;
}

export class AIService {
  private openai?: OpenAI;
  private anthropic?: Anthropic;
  private googleAI?: GoogleGenerativeAI;
  private safetyService: SafetyService;

  constructor() {
    this.initializeProviders();
    this.safetyService = new SafetyService();
  }

  private initializeProviders(): void {
    // Initialize OpenAI
    if (config.openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: config.openaiApiKey,
      });
      logger.info('OpenAI client initialized');
    }

    // Initialize Anthropic
    if (config.anthropicApiKey) {
      this.anthropic = new Anthropic({
        apiKey: config.anthropicApiKey,
      });
      logger.info('Anthropic client initialized');
    }

    // Initialize Google AI
    if (config.googleApiKey) {
      this.googleAI = new GoogleGenerativeAI(config.googleApiKey);
      logger.info('Google AI client initialized');
    }

    if (!this.openai && !this.anthropic && !this.googleAI) {
      logger.warn('No AI providers configured. AI functionality will be limited.');
    }
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    // Validate request safety first
    const safetyCheck = await this.safetyService.validateContent(request.message);
    if (!safetyCheck.isValid) {
      throw new Error(`Content blocked: ${safetyCheck.issues?.join(', ')}`);
    }

    const provider = request.provider || config.defaultAiProvider;
    let response: AIResponse;

    try {
      switch (provider) {
        case 'openai':
          response = await this.generateOpenAIResponse(request);
          break;
        case 'anthropic':
          response = await this.generateAnthropicResponse(request);
          break;
        case 'google':
          response = await this.generateGoogleResponse(request);
          break;
        default:
          throw new Error(`Unknown AI provider: ${provider}`);
      }

      // Apply educational context and safety filtering
      response.content = await this.applyEducationalContext(response.content);
      
      // Final safety check on response
      const responseSafetyCheck = await this.safetyService.validateContent(response.content);
      response.safetyScore = responseSafetyCheck.safetyScore;

      if (!responseSafetyCheck.isValid) {
        throw new Error('Generated response failed safety check');
      }

      response.processingTime = Date.now() - startTime;
      
      logger.info(`AI response generated successfully`, {
        provider: response.provider,
        model: response.model,
        tokens: response.tokens,
        safetyScore: response.safetyScore,
        processingTime: response.processingTime,
      });

      return response;

    } catch (error) {
      logger.error('AI generation failed:', error);
      
      // Try fallback provider
      if (provider !== config.defaultAiProvider) {
        logger.info(`Attempting fallback to ${config.defaultAiProvider}`);
        return this.generateResponse({
          ...request,
          provider: config.defaultAiProvider,
        });
      }

      throw error;
    }
  }

  private async generateOpenAIResponse(request: AIRequest): Promise<AIResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const systemPrompt = this.buildEducationalSystemPrompt();
    
    const completion = await this.openai.chat.completions.create({
      model: config.openaiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: request.message },
      ],
      max_tokens: request.maxTokens || config.maxTokensPerRequest,
      temperature: request.temperature || 0.7,
    });

    const choice = completion.choices[0];
    if (!choice || !choice.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    return {
      content: choice.message.content,
      provider: 'openai',
      model: config.openaiModel,
      tokens: completion.usage?.total_tokens,
      safetyScore: 0.9, // Will be updated by safety check
      processingTime: 0, // Will be updated by caller
    };
  }

  private async generateAnthropicResponse(request: AIRequest): Promise<AIResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized');
    }

    const systemPrompt = this.buildEducationalSystemPrompt();
    
    const response = await this.anthropic.messages.create({
      model: config.anthropicModel,
      max_tokens: request.maxTokens || config.maxTokensPerRequest,
      system: systemPrompt,
      messages: [
        { role: 'user', content: request.message },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Invalid response type from Anthropic');
    }

    return {
      content: content.text,
      provider: 'anthropic',
      model: config.anthropicModel,
      tokens: response.usage.output_tokens + response.usage.input_tokens,
      safetyScore: 0.9, // Will be updated by safety check
      processingTime: 0, // Will be updated by caller
    };
  }

  private async generateGoogleResponse(request: AIRequest): Promise<AIResponse> {
    if (!this.googleAI) {
      throw new Error('Google AI client not initialized');
    }

    const model = this.googleAI.getGenerativeModel({ 
      model: config.googleModel,
      systemInstruction: this.buildEducationalSystemPrompt(),
    });

    const result = await model.generateContent(request.message);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error('Empty response from Google AI');
    }

    return {
      content: text,
      provider: 'google',
      model: config.googleModel,
      tokens: undefined, // Google doesn't provide token count in this version
      safetyScore: 0.9, // Will be updated by safety check
      processingTime: 0, // Will be updated by caller
    };
  }

  private buildEducationalSystemPrompt(): string {
    return `You are Edu4.AI, an expert AI tutor designed to help students learn safely and effectively. Your role is to:

1. **Educational Focus**: Only respond to educational queries related to academic subjects like mathematics, science, literature, history, programming, languages, and other learning topics.

2. **Safe Learning Environment**: 
   - Never provide answers to homework assignments directly
   - Instead, guide students through problem-solving steps
   - Encourage critical thinking and understanding
   - Ask clarifying questions to assess student knowledge

3. **Age-Appropriate Content**: 
   - Keep all responses appropriate for students
   - Use clear, understandable language
   - Avoid complex jargon unless necessary for the subject

4. **Encouraging Tone**: 
   - Be supportive and encouraging
   - Celebrate learning progress
   - Help students overcome learning challenges
   - Build confidence in their abilities

5. **Safety Guidelines**:
   - Refuse to help with dangerous, harmful, or inappropriate content
   - Redirect off-topic conversations back to educational matters
   - Report if students seem to be in distress or danger

6. **Teaching Methodology**:
   - Use examples and analogies to explain concepts
   - Break down complex topics into manageable parts
   - Provide practice problems when appropriate
   - Suggest additional resources for deeper learning

Remember: Your goal is to facilitate learning, not to do the learning for the student. Always encourage understanding over memorization.`;
  }

  private async applyEducationalContext(content: string): Promise<string> {
    // Add educational framing and safety reminders
    if (content.length > 1000) {
      content += "\n\n💡 **Learning Tip**: Take your time to understand each concept before moving to the next one. Feel free to ask follow-up questions if anything is unclear!";
    }

    // Check if response contains code or formulas
    if (content.includes('```') || content.includes('$$')) {
      content += "\n\n🔍 **Study Suggestion**: Try working through this example step by step. Understanding the process is more important than memorizing the result.";
    }

    return content;
  }

  async getAvailableProviders(): Promise<Array<{
    name: string;
    status: 'available' | 'unavailable';
    models: string[];
  }>> {
    const providers = [];

    if (this.openai) {
      providers.push({
        name: 'openai',
        status: 'available' as const,
        models: [config.openaiModel],
      });
    }

    if (this.anthropic) {
      providers.push({
        name: 'anthropic',
        status: 'available' as const,
        models: [config.anthropicModel],
      });
    }

    if (this.googleAI) {
      providers.push({
        name: 'google',
        status: 'available' as const,
        models: [config.googleModel],
      });
    }

    return providers;
  }

  async healthCheck(): Promise<{
    openai: boolean;
    anthropic: boolean;
    google: boolean;
  }> {
    const health = {
      openai: false,
      anthropic: false,
      google: false,
    };

    // Test OpenAI
    if (this.openai) {
      try {
        await this.openai.models.list();
        health.openai = true;
      } catch (error) {
        logger.warn('OpenAI health check failed:', error);
      }
    }

    // Test Anthropic
    if (this.anthropic) {
      try {
        // Simple test call
        await this.anthropic.messages.create({
          model: config.anthropicModel,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        });
        health.anthropic = true;
      } catch (error) {
        logger.warn('Anthropic health check failed:', error);
      }
    }

    // Test Google AI
    if (this.googleAI) {
      try {
        const model = this.googleAI.getGenerativeModel({ model: config.googleModel });
        await model.generateContent('Hi');
        health.google = true;
      } catch (error) {
        logger.warn('Google AI health check failed:', error);
      }
    }

    return health;
  }
}

export const aiService = new AIService();