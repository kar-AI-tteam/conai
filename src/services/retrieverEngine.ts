// Hybrid Retriever Engine

import { QueryResult, Document, DocumentChunk } from '../types/enterprise';
import { VectorStore } from './vectorStore';
import { KeywordSearch } from './keywordSearch';
import { MetadataFilter } from './metadataFilter';

export interface SearchOptions {
  vectorWeight: number;
  keywordWeight: number;
  maxResults: number;
  minScore: number;
  filters: Record<string, any>;
  rerank: boolean;
}

export class RetrieverEngine {
  private vectorStore: VectorStore;
  private keywordSearch: KeywordSearch;
  private metadataFilter: MetadataFilter;

  constructor(
    vectorStore: VectorStore,
    keywordSearch: KeywordSearch,
    metadataFilter: MetadataFilter
  ) {
    this.vectorStore = vectorStore;
    this.keywordSearch = keywordSearch;
    this.metadataFilter = metadataFilter;
  }

  async search(
    query: string,
    context: Record<string, any>,
    tenantId: string,
    options: Partial<SearchOptions> = {}
  ): Promise<QueryResult[]> {
    const searchOptions: SearchOptions = {
      vectorWeight: 0.7,
      keywordWeight: 0.3,
      maxResults: 10,
      minScore: 0.1,
      filters: {},
      rerank: true,
      ...options
    };

    try {
      // 1. Apply metadata filters first
      const filteredDocuments = await this.metadataFilter.filter(
        tenantId,
        searchOptions.filters
      );

      // 2. Parallel vector and keyword search
      const [vectorResults, keywordResults] = await Promise.all([
        this.vectorStore.search(query, {
          tenantId,
          maxResults: searchOptions.maxResults * 2,
          documentIds: filteredDocuments.map(d => d.id)
        }),
        this.keywordSearch.search(query, {
          tenantId,
          maxResults: searchOptions.maxResults * 2,
          documentIds: filteredDocuments.map(d => d.id)
        })
      ]);

      // 3. Hybrid scoring and fusion
      const hybridResults = this.fuseResults(
        vectorResults,
        keywordResults,
        searchOptions
      );

      // 4. Re-ranking (optional)
      const finalResults = searchOptions.rerank
        ? await this.rerank(query, hybridResults)
        : hybridResults;

      // 5. Apply final filtering and sorting
      return finalResults
        .filter(result => result.score >= searchOptions.minScore)
        .slice(0, searchOptions.maxResults);

    } catch (error) {
      console.error('Retriever Engine search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  private fuseResults(
    vectorResults: QueryResult[],
    keywordResults: QueryResult[],
    options: SearchOptions
  ): QueryResult[] {
    const resultMap = new Map<string, QueryResult>();

    // Process vector results
    vectorResults.forEach(result => {
      const key = `${result.documentId}-${result.chunkId}`;
      resultMap.set(key, {
        ...result,
        score: result.score * options.vectorWeight,
        relevanceScore: result.score
      });
    });

    // Process keyword results and merge
    keywordResults.forEach(result => {
      const key = `${result.documentId}-${result.chunkId}`;
      const existing = resultMap.get(key);
      
      if (existing) {
        // Combine scores
        existing.score += result.score * options.keywordWeight;
        existing.highlights = [
          ...(existing.highlights || []),
          ...(result.highlights || [])
        ];
      } else {
        resultMap.set(key, {
          ...result,
          score: result.score * options.keywordWeight,
          relevanceScore: result.score
        });
      }
    });

    // Convert to array and sort by combined score
    return Array.from(resultMap.values())
      .sort((a, b) => b.score - a.score);
  }

  private async rerank(
    query: string,
    results: QueryResult[]
  ): Promise<QueryResult[]> {
    // Implement re-ranking using a cross-encoder model
    // This would typically use models like BGE-M3 or Cohere reranker
    
    try {
      // For now, implement a simple relevance-based re-ranking
      const rerankedResults = await Promise.all(
        results.map(async (result) => {
          const rerankScore = await this.calculateRerankScore(query, result);
          return {
            ...result,
            score: rerankScore,
            originalScore: result.score
          };
        })
      );

      return rerankedResults.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.warn('Re-ranking failed, using original scores:', error);
      return results;
    }
  }

  private async calculateRerankScore(
    query: string,
    result: QueryResult
  ): Promise<number> {
    // Simple re-ranking based on text similarity and metadata
    let score = result.score;

    // Boost score for exact matches
    const queryLower = query.toLowerCase();
    const contentLower = result.content.toLowerCase();
    
    if (contentLower.includes(queryLower)) {
      score += 0.2;
    }

    // Boost score for recent documents
    if (result.metadata.createdDate) {
      const docDate = new Date(result.metadata.createdDate);
      const daysSinceCreation = (Date.now() - docDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceCreation < 30) {
        score += 0.1;
      }
    }

    // Boost score for documents with author information
    if (result.metadata.author) {
      score += 0.05;
    }

    return Math.min(score, 1.0);
  }

  async searchSimilar(
    documentId: string,
    chunkId: string,
    tenantId: string,
    maxResults: number = 5
  ): Promise<QueryResult[]> {
    try {
      return await this.vectorStore.searchSimilar(documentId, chunkId, tenantId, maxResults);
    } catch (error) {
      console.error('Similar search error:', error);
      throw new Error(`Similar search failed: ${error.message}`);
    }
  }

  async getDocumentById(
    documentId: string,
    tenantId: string
  ): Promise<Document | null> {
    try {
      return await this.vectorStore.getDocument(documentId, tenantId);
    } catch (error) {
      console.error('Get document error:', error);
      return null;
    }
  }

  async getChunkById(
    documentId: string,
    chunkId: string,
    tenantId: string
  ): Promise<DocumentChunk | null> {
    try {
      return await this.vectorStore.getChunk(documentId, chunkId, tenantId);
    } catch (error) {
      console.error('Get chunk error:', error);
      return null;
    }
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      const [vectorStatus, keywordStatus, metadataStatus] = await Promise.all([
        this.vectorStore.healthCheck(),
        this.keywordSearch.healthCheck(),
        this.metadataFilter.healthCheck()
      ]);

      const isHealthy = 
        vectorStatus.status === 'healthy' && 
        keywordStatus.status === 'healthy' && 
        metadataStatus.status === 'healthy';

      const isDegraded =
        vectorStatus.status === 'degraded' ||
        keywordStatus.status === 'degraded' ||
        metadataStatus.status === 'degraded';

      return {
        status: isHealthy ? 'healthy' : isDegraded ? 'degraded' : 'unhealthy',
        details: {
          vector: vectorStatus,
          keyword: keywordStatus,
          metadata: metadataStatus
        }
      };
    } catch (error) {
      console.error('Health check error:', error);
      return {
        status: 'unhealthy',
        details: {
          error: error.message
        }
      };
    }
  }

  async getStats(tenantId: string): Promise<{
    documentCount: number;
    chunkCount: number;
    averageChunksPerDocument: number;
    totalStorageBytes: number;
    lastUpdated: string;
  }> {
    try {
      const vectorStats = await this.vectorStore.getStats(tenantId);
      const keywordStats = await this.keywordSearch.getStats(tenantId);

      return {
        documentCount: vectorStats.documentCount,
        chunkCount: vectorStats.chunkCount,
        averageChunksPerDocument: vectorStats.chunkCount / (vectorStats.documentCount || 1),
        totalStorageBytes: vectorStats.storageBytes + keywordStats.storageBytes,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Stats retrieval error:', error);
      throw new Error(`Failed to retrieve stats: ${error.message}`);
    }
  }
}