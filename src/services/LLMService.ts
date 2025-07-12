// LLM Service - Model Abstraction Layer

import { OpenAI } from 'openai';

export class LLMService {
  private providers: Map<string, LLMProvider>;
  private defaultProvider: string = 'openai';

  constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  /**
   * Initialize all LLM providers
   */
  private initializeProviders(): void {
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('claude', new ClaudeProvider());
    this.providers.set('gemini', new GeminiProvider());
    this.providers.set('local', new LocalLLMProvider());
  }

  /**
   * Generate response using specified model
   */
  async generate(
    prompt: string,
    options: LLMOptions = {}
  ): Promise<LLMResponse> {
    const provider = this.getProvider(options.model);
    
    try {
      const response = await provider.generate(prompt, options);
      
      return {
        answer: response.content,
        confidence: response.confidence || 0.8,
        model: options.model || this.defaultProvider,
        generationTime: response.generationTime,
        tokensUsed: response.tokensUsed,
        finishReason: response.finishReason
      };
    } catch (error) {
      console.error('LLM generation error:', error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  /**
   * Generate streaming response
   */
  async generateStream(
    prompt: string,
    options: LLMOptions = {},
    onChunk?: (chunk: string) => void
  ): Promise<LLMResponse> {
    const provider = this.getProvider(options.model);
    
    if (!provider.supportsStreaming()) {
      throw new Error(`Provider ${options.model} does not support streaming`);
    }

    try {
      return await provider.generateStream(prompt, options, onChunk);
    } catch (error) {
      console.error('LLM streaming error:', error);
      throw new Error(`Failed to generate streaming response: ${error.message}`);
    }
  }

  /**
   * Get available models for a provider
   */
  getAvailableModels(providerName?: string): string[] {
    if (providerName) {
      const provider = this.providers.get(providerName);
      return provider ? provider.getAvailableModels() : [];
    }

    // Return all available models from all providers
    const allModels: string[] = [];
    this.providers.forEach(provider => {
      allModels.push(...provider.getAvailableModels());
    });
    return allModels;
  }

  /**
   * Get provider for model
   */
  private getProvider(model?: string): LLMProvider {
    if (!model) {
      return this.providers.get(this.defaultProvider)!;
    }

    // Find provider that supports the model
    for (const [name, provider] of this.providers) {
      if (provider.getAvailableModels().includes(model)) {
        return provider;
      }
    }

    // Fallback to default provider
    return this.providers.get(this.defaultProvider)!;
  }

  /**
   * Estimate token count for text
   */
  estimateTokens(text: string, model?: string): number {
    const provider = this.getProvider(model);
    return provider.estimateTokens(text);
  }

  /**
   * Check if model supports streaming
   */
  supportsStreaming(model?: string): boolean {
    const provider = this.getProvider(model);
    return provider.supportsStreaming();
  }
}

// Abstract LLM Provider
abstract class LLMProvider {
  abstract generate(prompt: string, options: LLMOptions): Promise<ProviderResponse>;
  abstract generateStream(
    prompt: string, 
    options: LLMOptions, 
    onChunk?: (chunk: string) => void
  ): Promise<LLMResponse>;
  abstract getAvailableModels(): string[];
  abstract supportsStreaming(): boolean;
  abstract estimateTokens(text: string): number;
}

// OpenAI Provider
class OpenAIProvider extends LLMProvider {
  private client: OpenAI;
  private models = [
    'gpt-4',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-16k'
  ];

  constructor() {
    super();
    this.client = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }

  async generate(prompt: string, options: LLMOptions): Promise<ProviderResponse> {
    const startTime = Date.now();
    
    const response = await this.client.chat.completions.create({
      model: options.model || 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
      stream: false
    });

    const choice = response.choices[0];
    
    return {
      content: choice.message.content || '',
      confidence: this.calculateConfidence(choice),
      generationTime: Date.now() - startTime,
      tokensUsed: response.usage?.total_tokens || 0,
      finishReason: choice.finish_reason || 'stop'
    };
  }

  async generateStream(
    prompt: string,
    options: LLMOptions,
    onChunk?: (chunk: string) => void
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    let fullContent = '';
    let tokensUsed = 0;

    const stream = await this.client.chat.completions.create({
      model: options.model || 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullContent += content;
        onChunk?.(fullContent);
      }
    }

    return {
      answer: fullContent,
      confidence: 0.8, // Default confidence for streaming
      model: options.model || 'gpt-3.5-turbo',
      generationTime: Date.now() - startTime,
      tokensUsed: this.estimateTokens(fullContent),
      finishReason: 'stop'
    };
  }

  getAvailableModels(): string[] {
    return this.models;
  }

  supportsStreaming(): boolean {
    return true;
  }

  estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 charactersI'll redesign the Contour AI application to meet your enterprise RAG system requirements. This is a comprehensive transformation that will involve restructuring the entire architecture.

<boltArtifact id="enterprise-rag-redesign" title="Enterprise RAG System Redesign">