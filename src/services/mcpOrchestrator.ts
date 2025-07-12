// MCP (Model Context Protocol) - RAG Orchestrator

import { Query, QueryIntent, QueryResult, MCPPlugin, Document } from '../types/enterprise';
import { RetrieverEngine } from './retrieverEngine';
import { LLMService } from './llmService';
import { PluginManager } from './pluginManager';

export class MCPOrchestrator {
  private retrieverEngine: RetrieverEngine;
  private llmService: LLMService;
  private pluginManager: PluginManager;

  constructor(
    retrieverEngine: RetrieverEngine,
    llmService: LLMService,
    pluginManager: PluginManager
  ) {
    this.retrieverEngine = retrieverEngine;
    this.llmService = llmService;
    this.pluginManager = pluginManager;
  }

  async processQuery(query: Query): Promise<QueryResult[]> {
    try {
      // 1. Query Classification & Intent Detection
      const intent = await this.classifyQuery(query.text);
      query.intent = intent;

      // 2. Route to Appropriate Plugins
      const relevantPlugins = await this.routeToPlugins(intent);

      // 3. Context Construction
      const context = await this.buildContext(query, relevantPlugins);

      // 4. Retrieval with Re-ranking
      const retrievalResults = await this.retrieverEngine.search(
        query.text,
        context,
        query.tenantId
      );

      // 5. LLM Processing with Context
      const enhancedResults = await this.enhanceWithLLM(
        query,
        retrievalResults,
        context
      );

      return enhancedResults;
    } catch (error) {
      console.error('MCP Orchestrator error:', error);
      throw new Error(`Query processing failed: ${error.message}`);
    }
  }

  private async classifyQuery(queryText: string): Promise<QueryIntent> {
    // Intent classification using NLP or rule-based approach
    const entities = await this.extractEntities(queryText);
    const type = this.determineQueryType(queryText);
    
    return {
      type,
      confidence: 0.85, // Would be calculated by ML model
      entities,
      filters: this.extractFilters(queryText)
    };
  }

  private determineQueryType(queryText: string): QueryIntent['type'] {
    const text = queryText.toLowerCase();
    
    if (text.includes('summarize') || text.includes('summary')) {
      return 'summarize';
    }
    if (text.includes('compare') || text.includes('difference')) {
      return 'compare';
    }
    if (text.includes('analyze') || text.includes('analysis')) {
      return 'analyze';
    }
    if (text.includes('?') || text.startsWith('what') || text.startsWith('how')) {
      return 'question';
    }
    
    return 'search';
  }

  private async extractEntities(queryText: string): Promise<string[]> {
    // Named Entity Recognition (NER)
    // This would typically use a trained NER model
    const entities: string[] = [];
    
    // Simple regex-based entity extraction for demo
    const patterns = {
      date: /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g,
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      number: /\b\d+(?:\.\d+)?\b/g,
    };

    Object.entries(patterns).forEach(([type, pattern]) => {
      const matches = queryText.match(pattern);
      if (matches) {
        entities.push(...matches.map(match => `${type}:${match}`));
      }
    });

    return entities;
  }

  private extractFilters(queryText: string): Record<string, any> {
    const filters: Record<string, any> = {};
    
    // Extract date filters
    const dateMatch = queryText.match(/(?:after|since|from)\s+(\d{4}-\d{2}-\d{2})/i);
    if (dateMatch) {
      filters.dateFrom = dateMatch[1];
    }

    // Extract author filters
    const authorMatch = queryText.match(/(?:by|author|from)\s+([A-Za-z\s]+)/i);
    if (authorMatch) {
      filters.author = authorMatch[1].trim();
    }

    // Extract file type filters
    const typeMatch = queryText.match(/(?:in|from)\s+(pdf|word|excel|csv|json)/i);
    if (typeMatch) {
      filters.fileType = typeMatch[1].toLowerCase();
    }

    return filters;
  }

  private async routeToPlugins(intent: QueryIntent): Promise<MCPPlugin[]> {
    const relevantPlugins = await this.pluginManager.getPluginsForIntent(intent);
    return relevantPlugins.filter(plugin => plugin.status === 'active');
  }

  private async buildContext(
    query: Query,
    plugins: MCPPlugin[]
  ): Promise<Record<string, any>> {
    const context: Record<string, any> = {
      query: query.text,
      intent: query.intent,
      tenantId: query.tenantId,
      userId: query.userId,
      plugins: plugins.map(p => p.id),
      timestamp: new Date().toISOString()
    };

    // Add conversation context if available
    if (query.context.conversationId) {
      context.conversationHistory = await this.getConversationHistory(
        query.context.conversationId
      );
    }

    // Add user preferences
    context.userPreferences = query.context.userPreferences;

    return context;
  }

  private async getConversationHistory(conversationId: string): Promise<any[]> {
    // Retrieve conversation history from storage
    // This would typically query a conversation database
    return [];
  }

  private async enhanceWithLLM(
    query: Query,
    retrievalResults: QueryResult[],
    context: Record<string, any>
  ): Promise<QueryResult[]> {
    // Use LLM to enhance and re-rank results
    const prompt = this.buildPrompt(query, retrievalResults, context);
    
    const llmResponse = await this.llmService.generate({
      prompt,
      maxTokens: 1000,
      temperature: 0.1,
      stream: false
    });

    // Parse LLM response and enhance results
    return this.parseAndEnhanceResults(retrievalResults, llmResponse);
  }

  private buildPrompt(
    query: Query,
    results: QueryResult[],
    context: Record<string, any>
  ): string {
    const contextDocs = results.map((result, index) => 
      `Document ${index + 1}:\n${result.content}\n`
    ).join('\n');

    return `
Context: You are an enterprise RAG system assistant. Use the provided documents to answer the user's query accurately and comprehensively.

Query: ${query.text}
Intent: ${query.intent.type}

Relevant Documents:
${contextDocs}

Instructions:
1. Provide a comprehensive answer based on the documents
2. Cite specific documents when referencing information
3. If information is incomplete, clearly state what's missing
4. Maintain professional tone appropriate for enterprise use
5. Include confidence level in your response

Answer:`;
  }

  private parseAndEnhanceResults(
    originalResults: QueryResult[],
    llmResponse: string
  ): QueryResult[] {
    // Parse LLM response and enhance original results
    // This would include extracting citations, confidence scores, etc.
    
    return originalResults.map(result => ({
      ...result,
      // Add LLM-enhanced metadata
      llmEnhanced: true,
      enhancedContent: llmResponse,
      confidence: this.calculateConfidence(result, llmResponse)
    }));
  }

  private calculateConfidence(result: QueryResult, llmResponse: string): number {
    // Calculate confidence based on various factors
    let confidence = result.score;
    
    // Boost confidence if LLM response references this result
    if (llmResponse.toLowerCase().includes(result.content.toLowerCase().substring(0, 50))) {
      confidence += 0.1;
    }
    
    // Adjust based on result metadata
    if (result.metadata.author) {
      confidence += 0.05;
    }
    
    return Math.min(confidence, 1.0);
  }

  async streamResponse(
    query: Query,
    onChunk: (chunk: string) => void,
    onComplete: () => void
  ): Promise<void> {
    try {
      // Process query and get initial results
      const results = await this.processQuery(query);
      
      // Stream enhanced response
      const prompt = this.buildPrompt(query, results, {});
      
      await this.llmService.generateStream({
        prompt,
        maxTokens: 1000,
        temperature: 0.1,
        onChunk,
        onComplete
      });
    } catch (error) {
      onChunk(`Error: ${error.message}`);
      onComplete();
    }
  }
}