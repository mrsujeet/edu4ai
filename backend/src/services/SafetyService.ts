import { config } from '@/config/config';
import { logger } from '@/utils/logger';

export interface SafetyValidation {
  isValid: boolean;
  safetyScore: number;
  issues?: string[];
  suggestions?: string[];
}

export class SafetyService {
  private blockedKeywords: Set<string>;
  private educationalTopics: Set<string>;

  constructor() {
    this.blockedKeywords = new Set(
      config.blockedKeywords.map(keyword => keyword.toLowerCase())
    );
    this.educationalTopics = new Set(
      config.educationalTopics.map(topic => topic.toLowerCase())
    );
  }

  async validateContent(content: string): Promise<SafetyValidation> {
    const contentLower = content.toLowerCase();
    let safetyScore = 1.0;
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for blocked keywords
    const foundBlockedKeywords = this.findBlockedKeywords(contentLower);
    if (foundBlockedKeywords.length > 0) {
      safetyScore -= 0.5;
      issues.push(`Contains inappropriate content: ${foundBlockedKeywords.join(', ')}`);
      suggestions.push('Please rephrase your question focusing on educational content.');
    }

    // Check if content is educational
    const isEducational = this.isEducationalContent(contentLower);
    if (!isEducational) {
      safetyScore -= 0.3;
      issues.push('Content does not appear to be educational');
      suggestions.push('Please ask questions related to academic subjects like math, science, literature, or other learning topics.');
    }

    // Check content length
    if (content.length > 2000) {
      safetyScore -= 0.1;
      issues.push('Content is too long');
      suggestions.push('Please shorten your question to be more specific.');
    }

    // Check for homework-like patterns
    const isHomeworkPattern = this.detectHomeworkPattern(content);
    if (isHomeworkPattern) {
      safetyScore -= 0.2;
      issues.push('This appears to be a homework question');
      suggestions.push('Instead of asking for the answer, ask how to approach the problem or explain concepts you need help understanding.');
    }

    // Check for dangerous/harmful content patterns
    const hasDangerousContent = this.detectDangerousContent(contentLower);
    if (hasDangerousContent) {
      safetyScore -= 0.8;
      issues.push('Content may be harmful or dangerous');
      suggestions.push('Please focus on safe, educational topics.');
    }

    // Ensure minimum safety score
    safetyScore = Math.max(0, safetyScore);

    const isValid = safetyScore >= config.minSafetyScore && issues.length === 0;

    logger.info('Content safety validation', {
      safetyScore,
      isValid,
      issuesCount: issues.length,
      contentLength: content.length,
    });

    return {
      isValid,
      safetyScore,
      issues: issues.length > 0 ? issues : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  }

  private findBlockedKeywords(content: string): string[] {
    const found: string[] = [];
    
    for (const keyword of this.blockedKeywords) {
      if (content.includes(keyword)) {
        found.push(keyword);
      }
    }

    return found;
  }

  private isEducationalContent(content: string): boolean {
    // Check for educational keywords
    const educationalKeywords = [
      'learn', 'study', 'understand', 'explain', 'how', 'why', 'what',
      'solve', 'calculate', 'define', 'describe', 'analyze', 'compare',
      'example', 'concept', 'theory', 'practice', 'homework', 'assignment',
      'question', 'problem', 'formula', 'equation', 'method', 'step'
    ];

    const hasEducationalKeywords = educationalKeywords.some(keyword => 
      content.includes(keyword)
    );

    // Check for educational topics
    const hasEducationalTopics = Array.from(this.educationalTopics).some(topic => 
      content.includes(topic)
    );

    // Check for subject-specific indicators
    const subjectIndicators = [
      // Math
      'equation', 'solve', 'calculate', 'mathematics', 'algebra', 'geometry',
      'calculus', 'statistics', 'probability', 'theorem', 'proof',
      
      // Science
      'experiment', 'hypothesis', 'theory', 'molecule', 'atom', 'chemistry',
      'physics', 'biology', 'evolution', 'ecosystem', 'cell', 'DNA',
      
      // Language Arts
      'grammar', 'sentence', 'paragraph', 'essay', 'literature', 'poem',
      'metaphor', 'symbolism', 'character', 'plot', 'theme',
      
      // History
      'historical', 'century', 'war', 'revolution', 'civilization', 'culture',
      'empire', 'democracy', 'constitution',
      
      // Programming
      'code', 'function', 'variable', 'algorithm', 'programming', 'software',
      'debug', 'syntax', 'loop', 'array', 'object'
    ];

    const hasSubjectIndicators = subjectIndicators.some(indicator => 
      content.includes(indicator)
    );

    return hasEducationalKeywords || hasEducationalTopics || hasSubjectIndicators;
  }

  private detectHomeworkPattern(content: string): boolean {
    const homeworkPatterns = [
      /^solve\s+this/i,
      /^answer\s+this/i,
      /^what\s+is\s+the\s+answer\s+to/i,
      /^do\s+my\s+homework/i,
      /^complete\s+this\s+for\s+me/i,
      /^give\s+me\s+the\s+solution/i,
      /^\d+\.\s*.*\?\s*$/m, // Numbered questions
      /chapter\s+\d+.*exercise/i,
      /assignment\s+\d+/i,
      /due\s+tomorrow/i,
      /test\s+tomorrow/i,
    ];

    return homeworkPatterns.some(pattern => pattern.test(content));
  }

  private detectDangerousContent(content: string): boolean {
    const dangerousPatterns = [
      // Violence and harm
      /\b(kill|murder|suicide|self.?harm|hurt.*yourself)\b/i,
      /\b(bomb|explosive|weapon|gun|knife)\b/i,
      
      // Illegal activities
      /\b(drugs|illegal.*substance|steal|rob|fraud)\b/i,
      /\b(hack|crack|pirate|bypass.*security)\b/i,
      
      // Inappropriate content
      /\b(adult.*content|sexual|explicit)\b/i,
      
      // Personal information requests
      /\b(home.*address|phone.*number|social.*security|credit.*card)\b/i,
    ];

    return dangerousPatterns.some(pattern => pattern.test(content));
  }

  validateEducationalContext(content: string): {
    isEducational: boolean;
    suggestedTopics: string[];
  } {
    const isEducational = this.isEducationalContent(content.toLowerCase());
    
    const suggestedTopics = [
      'Mathematics (algebra, geometry, calculus)',
      'Science (biology, chemistry, physics)',
      'Literature and Language Arts',
      'History and Social Studies',
      'Programming and Computer Science',
      'Foreign Languages',
      'Art and Music Theory',
      'Study Skills and Learning Strategies'
    ];

    return {
      isEducational,
      suggestedTopics: isEducational ? [] : suggestedTopics,
    };
  }

  async logSafetyEvent(content: string, validation: SafetyValidation, action: string): Promise<void> {
    logger.info('Safety event logged', {
      action,
      safetyScore: validation.safetyScore,
      isValid: validation.isValid,
      issuesCount: validation.issues?.length || 0,
      contentLength: content.length,
      timestamp: new Date().toISOString(),
    });

    // Here you could also save to database for analytics
    // await this.saveToDatabase(content, validation, action);
  }
}

export const safetyService = new SafetyService();