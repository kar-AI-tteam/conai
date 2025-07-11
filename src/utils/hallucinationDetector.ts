/**
 * Hallucination Detection and Mitigation Utilities
 * 
 * This module implements various strategies to detect and handle AI hallucinations
 * in responses, ensuring accuracy and reliability of the knowledge base system.
 */

export interface HallucinationCheck {
  type: 'factual' | 'consistency' | 'context' | 'confidence' | 'source';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion?: string;
}

export interface HallucinationResult {
  isHallucination: boolean;
  confidence: number; // 0-1 scale
  checks: HallucinationCheck[];
  mitigatedResponse?: string;
  warnings: string[];
}

export class HallucinationDetector {
  private static readonly CONFIDENCE_THRESHOLD = 0.7;
  private static readonly FACTUAL_PATTERNS = [
    // Uncertain language patterns
    /\b(i think|i believe|probably|maybe|might be|could be|seems like)\b/gi,
    // Absolute claims without evidence
    /\b(always|never|all|none|every|completely|totally)\b/gi,
    // Speculation indicators
    /\b(it's possible|it's likely|presumably|supposedly|allegedly)\b/gi,
  ];

  private static readonly HALLUCINATION_INDICATORS = [
    // Contradictory statements
    /\b(however|but|although|despite|nevertheless)\s+.{0,50}\b(not|no|never|cannot)\b/gi,
    // Vague references
    /\b(some experts|studies show|research indicates|it is known)\b/gi,
    // Unsupported claims
    /\b(according to|based on|research shows)\s+(?!.*(?:source|reference|study|paper))/gi,
    // Temporal inconsistencies
    /\b(recently|lately|currently|now)\b.*\b(in \d{4}|last year|this year)\b/gi,
  ];

  private static readonly CONTEXT_KEYWORDS = [
    'knowledge base', 'documentation', 'entry', 'stored information',
    'according to the context', 'based on the provided information'
  ];

  /**
   * Main hallucination detection method
   */
  static detectHallucination(
    response: string,
    context: string[],
    originalQuery: string,
    confidence?: number
  ): HallucinationResult {
    const checks: HallucinationCheck[] = [];
    const warnings: string[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // 1. Factual Consistency Check
    const factualCheck = this.checkFactualConsistency(response, context);
    checks.push(...factualCheck.checks);
    totalScore += factualCheck.score;
    maxScore += factualCheck.maxScore;

    // 2. Context Adherence Check
    const contextCheck = this.checkContextAdherence(response, context);
    checks.push(...contextCheck.checks);
    totalScore += contextCheck.score;
    maxScore += contextCheck.maxScore;

    // 3. Confidence Level Check
    const confidenceCheck = this.checkConfidenceLevel(response, confidence);
    checks.push(...confidenceCheck.checks);
    totalScore += confidenceCheck.score;
    maxScore += confidenceCheck.maxScore;

    // 4. Source Attribution Check
    const sourceCheck = this.checkSourceAttribution(response, context);
    checks.push(...sourceCheck.checks);
    totalScore += sourceCheck.score;
    maxScore += sourceCheck.maxScore;

    // 5. Consistency Check
    const consistencyCheck = this.checkInternalConsistency(response);
    checks.push(...consistencyCheck.checks);
    totalScore += consistencyCheck.score;
    maxScore += consistencyCheck.maxScore;

    // Calculate overall confidence
    const overallConfidence = maxScore > 0 ? totalScore / maxScore : 1;
    const isHallucination = overallConfidence < this.CONFIDENCE_THRESHOLD;

    // Generate warnings
    if (isHallucination) {
      warnings.push('This response may contain inaccurate information');
    }

    const highSeverityChecks = checks.filter(c => c.severity === 'high');
    if (highSeverityChecks.length > 0) {
      warnings.push('High confidence hallucination detected');
    }

    // Generate mitigated response if needed
    let mitigatedResponse: string | undefined;
    if (isHallucination) {
      mitigatedResponse = this.generateMitigatedResponse(response, checks, context);
    }

    return {
      isHallucination,
      confidence: overallConfidence,
      checks,
      mitigatedResponse,
      warnings
    };
  }

  /**
   * Check factual consistency against known patterns
   */
  private static checkFactualConsistency(response: string, context: string[]) {
    const checks: HallucinationCheck[] = [];
    let score = 1;
    const maxScore = 1;

    // Check for uncertain language
    const uncertainMatches = this.FACTUAL_PATTERNS.reduce((count, pattern) => {
      return count + (response.match(pattern) || []).length;
    }, 0);

    if (uncertainMatches > 2) {
      checks.push({
        type: 'factual',
        severity: 'medium',
        description: 'Response contains multiple uncertainty indicators',
        suggestion: 'Verify claims against knowledge base entries'
      });
      score -= 0.3;
    }

    // Check for hallucination indicators
    const hallucinationMatches = this.HALLUCINATION_INDICATORS.reduce((count, pattern) => {
      return count + (response.match(pattern) || []).length;
    }, 0);

    if (hallucinationMatches > 0) {
      checks.push({
        type: 'factual',
        severity: 'high',
        description: 'Response contains potential hallucination indicators',
        suggestion: 'Cross-reference with reliable sources'
      });
      score -= 0.5;
    }

    return { checks, score: Math.max(0, score), maxScore };
  }

  /**
   * Check adherence to provided context
   */
  private static checkContextAdherence(response: string, context: string[]) {
    const checks: HallucinationCheck[] = [];
    let score = 1;
    const maxScore = 1;

    if (context.length === 0) {
      checks.push({
        type: 'context',
        severity: 'medium',
        description: 'No context provided for response validation',
        suggestion: 'Ensure knowledge base context is available'
      });
      score -= 0.2;
      return { checks, score, maxScore };
    }

    // Check if response references context appropriately
    const hasContextReference = this.CONTEXT_KEYWORDS.some(keyword =>
      response.toLowerCase().includes(keyword.toLowerCase())
    );

    if (!hasContextReference && context.length > 0) {
      checks.push({
        type: 'context',
        severity: 'medium',
        description: 'Response does not reference provided context',
        suggestion: 'Ensure AI responses are grounded in knowledge base'
      });
      score -= 0.3;
    }

    // Check for information not present in context
    const responseWords = this.extractKeywords(response);
    const contextWords = context.flatMap(c => this.extractKeywords(c));
    
    const novelWords = responseWords.filter(word => 
      !contextWords.some(cWord => 
        cWord.toLowerCase().includes(word.toLowerCase()) ||
        word.toLowerCase().includes(cWord.toLowerCase())
      )
    );

    if (novelWords.length > responseWords.length * 0.5) {
      checks.push({
        type: 'context',
        severity: 'high',
        description: 'Response contains significant information not found in context',
        suggestion: 'Limit responses to information available in knowledge base'
      });
      score -= 0.4;
    }

    return { checks, score: Math.max(0, score), maxScore };
  }

  /**
   * Check AI confidence level
   */
  private static checkConfidenceLevel(response: string, confidence?: number) {
    const checks: HallucinationCheck[] = [];
    let score = 1;
    const maxScore = 1;

    if (confidence !== undefined && confidence < 0.6) {
      checks.push({
        type: 'confidence',
        severity: 'high',
        description: `Low AI confidence score: ${(confidence * 100).toFixed(1)}%`,
        suggestion: 'Consider requesting more specific information'
      });
      score -= 0.5;
    }

    // Check for hedge words indicating uncertainty
    const hedgeWords = [
      'might', 'could', 'possibly', 'perhaps', 'maybe', 'potentially',
      'seems', 'appears', 'suggests', 'indicates', 'implies'
    ];

    const hedgeCount = hedgeWords.reduce((count, word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      return count + (response.match(regex) || []).length;
    }, 0);

    if (hedgeCount > 3) {
      checks.push({
        type: 'confidence',
        severity: 'medium',
        description: 'Response contains multiple uncertainty indicators',
        suggestion: 'Seek more definitive information from knowledge base'
      });
      score -= 0.2;
    }

    return { checks, score: Math.max(0, score), maxScore };
  }

  /**
   * Check for proper source attribution
   */
  private static checkSourceAttribution(response: string, context: string[]) {
    const checks: HallucinationCheck[] = [];
    let score = 1;
    const maxScore = 1;

    // Check for unsupported claims
    const claimPatterns = [
      /\b(studies show|research indicates|experts say|data shows)\b/gi,
      /\b(according to|based on|as per|following)\b/gi
    ];

    const hasUnsupportedClaims = claimPatterns.some(pattern => 
      pattern.test(response)
    );

    if (hasUnsupportedClaims && context.length === 0) {
      checks.push({
        type: 'source',
        severity: 'high',
        description: 'Response makes claims without available source context',
        suggestion: 'Provide source attribution or qualify statements'
      });
      score -= 0.4;
    }

    return { checks, score: Math.max(0, score), maxScore };
  }

  /**
   * Check internal consistency of the response
   */
  private static checkInternalConsistency(response: string) {
    const checks: HallucinationCheck[] = [];
    let score = 1;
    const maxScore = 1;

    // Check for contradictory statements
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    for (let i = 0; i < sentences.length - 1; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        if (this.areContradictory(sentences[i], sentences[j])) {
          checks.push({
            type: 'consistency',
            severity: 'high',
            description: 'Response contains contradictory statements',
            suggestion: 'Review and resolve conflicting information'
          });
          score -= 0.5;
          break;
        }
      }
    }

    return { checks, score: Math.max(0, score), maxScore };
  }

  /**
   * Generate a mitigated response with warnings
   */
  private static generateMitigatedResponse(
    originalResponse: string,
    checks: HallucinationCheck[],
    context: string[]
  ): string {
    let mitigatedResponse = originalResponse;

    // Add disclaimer for high-severity issues
    const highSeverityChecks = checks.filter(c => c.severity === 'high');
    if (highSeverityChecks.length > 0) {
      mitigatedResponse = `⚠️ **Accuracy Notice**: This response may contain unverified information.\n\n${mitigatedResponse}`;
    }

    // Add context reference if missing
    const hasContextReference = this.CONTEXT_KEYWORDS.some(keyword =>
      mitigatedResponse.toLowerCase().includes(keyword.toLowerCase())
    );

    if (!hasContextReference && context.length > 0) {
      mitigatedResponse += `\n\n*Based on available knowledge base entries.*`;
    }

    // Add suggestions for improvement
    const suggestions = checks
      .filter(c => c.suggestion)
      .map(c => c.suggestion)
      .filter((suggestion, index, arr) => arr.indexOf(suggestion) === index);

    if (suggestions.length > 0) {
      mitigatedResponse += `\n\n**Suggestions for verification:**\n${suggestions.map(s => `• ${s}`).join('\n')}`;
    }

    return mitigatedResponse;
  }

  /**
   * Extract keywords from text
   */
  private static extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));
  }

  /**
   * Check if word is a stop word
   */
  private static isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
      'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these',
      'those', 'they', 'them', 'their', 'what', 'which', 'who', 'when',
      'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
      'most', 'other', 'some', 'such', 'only', 'own', 'same', 'than', 'too',
      'very', 'can', 'will', 'just', 'should', 'now'
    ]);
    return stopWords.has(word.toLowerCase());
  }

  /**
   * Check if two sentences are contradictory
   */
  private static areContradictory(sentence1: string, sentence2: string): boolean {
    const negationWords = ['not', 'no', 'never', 'cannot', 'won\'t', 'don\'t', 'isn\'t', 'aren\'t'];
    
    const s1Words = sentence1.toLowerCase().split(/\s+/);
    const s2Words = sentence2.toLowerCase().split(/\s+/);
    
    const s1HasNegation = negationWords.some(neg => s1Words.includes(neg));
    const s2HasNegation = negationWords.some(neg => s2Words.includes(neg));
    
    // Simple contradiction detection: same key terms but different negation status
    const commonWords = s1Words.filter(word => 
      s2Words.includes(word) && !this.isStopWord(word) && word.length > 3
    );
    
    return commonWords.length > 2 && s1HasNegation !== s2HasNegation;
  }

  /**
   * Validate response against known facts
   */
  static validateAgainstKnowledgeBase(
    response: string,
    knowledgeBaseEntries: Array<{ question: string; answer: string; keywords: string[] }>
  ): HallucinationResult {
    const context = knowledgeBaseEntries.map(entry => `${entry.question} ${entry.answer}`);
    return this.detectHallucination(response, context, '');
  }

  /**
   * Real-time hallucination monitoring during streaming
   */
  static monitorStreamingResponse(
    partialResponse: string,
    context: string[],
    onHallucinationDetected: (result: HallucinationResult) => void
  ): void {
    // Only check when we have complete sentences
    const sentences = partialResponse.split(/[.!?]+/);
    if (sentences.length > 1) {
      const result = this.detectHallucination(partialResponse, context, '');
      if (result.isHallucination) {
        onHallucinationDetected(result);
      }
    }
  }
}

/**
 * Hallucination mitigation strategies
 */
export class HallucinationMitigator {
  /**
   * Apply confidence-based filtering
   */
  static applyConfidenceFilter(response: string, confidence: number): string {
    if (confidence < 0.5) {
      return `⚠️ **Low Confidence Response** (${(confidence * 100).toFixed(1)}%)\n\n${response}\n\n*Please verify this information independently.*`;
    }
    if (confidence < 0.7) {
      return `⚠️ **Medium Confidence Response** (${(confidence * 100).toFixed(1)}%)\n\n${response}\n\n*Consider cross-referencing with additional sources.*`;
    }
    return response;
  }

  /**
   * Add source attribution
   */
  static addSourceAttribution(response: string, sources: string[]): string {
    if (sources.length === 0) {
      return `${response}\n\n*No specific sources available - please verify independently.*`;
    }
    
    const sourceList = sources.map((source, index) => `${index + 1}. ${source}`).join('\n');
    return `${response}\n\n**Sources:**\n${sourceList}`;
  }

  /**
   * Apply uncertainty quantification
   */
  static quantifyUncertainty(response: string, uncertaintyLevel: 'low' | 'medium' | 'high'): string {
    const prefixes = {
      low: '✅ **High Confidence**',
      medium: '⚠️ **Medium Confidence**',
      high: '❌ **Low Confidence**'
    };

    const disclaimers = {
      low: 'This information is well-supported by available sources.',
      medium: 'This information should be verified with additional sources.',
      high: 'This information requires verification - treat as preliminary.'
    };

    return `${prefixes[uncertaintyLevel]}\n\n${response}\n\n*${disclaimers[uncertaintyLevel]}*`;
  }
}