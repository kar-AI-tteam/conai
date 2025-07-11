import { QAItem } from '../../types/qa';
import { StorageProvider } from './types';
import { Box } from 'lucide-react';
import { MilvusClient } from './milvusClient';

export class MilvusProvider implements StorageProvider {
  name = 'Vector DB';
  description = 'Store data in Milvus/Zilliz vector database';
  icon = Box;
  private client: MilvusClient;

  constructor() {
    const address = import.meta.env.VITE_MILVUS_ADDRESS?.trim();
    const token = import.meta.env.VITE_MILVUS_TOKEN?.trim();
    
    // Log configuration for debugging
    console.log('Initializing Milvus Provider with:', {
      address: address ? `${address.substring(0, 10)}...` : 'missing',
      token: token ? `${token.substring(0, 10)}...` : 'missing',
      collection: import.meta.env.VITE_MILVUS_COLLECTION || 'qa_entries',
      dimension: import.meta.env.VITE_MILVUS_DIMENSION || '1536'
    });

    // Parse and validate configuration
    const dimension = parseInt(import.meta.env.VITE_MILVUS_DIMENSION || '1536');
    const nlist = parseInt(import.meta.env.VITE_MILVUS_NLIST || '1024');
    let searchParams;
    try {
      searchParams = JSON.parse(import.meta.env.VITE_MILVUS_SEARCH_PARAMS || '{"nprobe": 16}');
    } catch {
      searchParams = { nprobe: 16 };
    }

    this.client = new MilvusClient({
      address: address || '',
      token: token || '',
      collection: import.meta.env.VITE_MILVUS_COLLECTION || 'qa_entries',
      dimension,
      indexType: import.meta.env.VITE_MILVUS_INDEX_TYPE || 'IVF_FLAT',
      metricType: import.meta.env.VITE_MILVUS_METRIC_TYPE || 'L2',
      nlist,
      searchParams,
      consistencyLevel: import.meta.env.VITE_MILVUS_CONSISTENCY_LEVEL || 'Strong'
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      const address = import.meta.env.VITE_MILVUS_ADDRESS?.trim();
      const token = import.meta.env.VITE_MILVUS_TOKEN?.trim();

      if (!address || !token) {
        console.warn('Missing required Milvus configuration:', {
          hasAddress: !!address,
          hasToken: !!token
        });
        return false;
      }

      const isConnected = await this.client.testConnection();
      console.log('Milvus connection test result:', isConnected);
      return isConnected;
    } catch (error) {
      console.error('Milvus availability check failed:', error);
      return false;
    }
  }

  async loadEntries(): Promise<QAItem[]> {
    try {
      const entries = await this.client.search(import.meta.env.VITE_MILVUS_COLLECTION || 'qa_entries');
      return entries;
    } catch (error) {
      console.error('Error loading entries from Milvus:', error);
      return [];
    }
  }

  async searchEntries(query: string): Promise<Array<{ entry: QAItem; score: number; highlights: any }>> {
    try {
      const results = await this.client.searchSimilar(
        import.meta.env.VITE_MILVUS_COLLECTION || 'qa_entries',
        query
      );

      return results.map(result => ({
        entry: result.entry,
        score: result.score,
        highlights: this.generateHighlights(result.entry, query)
      }));
    } catch (error) {
      console.error('Error searching entries in Milvus:', error);
      return [];
    }
  }

  private generateHighlights(entry: QAItem, query: string): any {
    const highlights: any = {};
    const normalizedQuery = query.toLowerCase();

    if (entry.question.toLowerCase().includes(normalizedQuery)) {
      highlights.question = [this.highlightText(entry.question, normalizedQuery)];
    }

    if (entry.answer.toLowerCase().includes(normalizedQuery)) {
      highlights.answer = [this.highlightText(entry.answer, normalizedQuery)];
    }

    const matchingKeywords = entry.keywords.filter(keyword => 
      keyword.toLowerCase().includes(normalizedQuery)
    );
    if (matchingKeywords.length > 0) {
      highlights.keywords = matchingKeywords;
    }

    return highlights;
  }

  private highlightText(text: string, query: string): string {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '**$1**');
  }

  async addEntry(entry: QAItem): Promise<void> {
    try {
      const newEntry = {
        ...entry,
        id: entry.id || `milvus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await this.client.insert(import.meta.env.VITE_MILVUS_COLLECTION || 'qa_entries', newEntry);
    } catch (error) {
      console.error('Error adding entry to Milvus:', error);
      throw error;
    }
  }

  async updateEntry(entry: QAItem): Promise<void> {
    try {
      if (!entry.id) {
        await this.addEntry(entry);
        return;
      }

      await this.client.update(
        import.meta.env.VITE_MILVUS_COLLECTION || 'qa_entries',
        entry.id,
        {
          ...entry,
          updated_at: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Error updating entry in Milvus:', error);
      throw error;
    }
  }

  async deleteEntry(entryId: string): Promise<void> {
    try {
      await this.client.delete(
        import.meta.env.VITE_MILVUS_COLLECTION || 'qa_entries',
        entryId
      );
    } catch (error) {
      console.error('Error deleting entry from Milvus:', error);
      throw error;
    }
  }
}