import { QAItem } from '../../types/qa';
import { StorageProvider } from './types';
import { Cloud } from 'lucide-react';
import {
  loadEntriesFromOpenSearch,
  searchEntries as searchOpenSearchEntries,
  addEntryToOpenSearch,
  updateEntryInOpenSearch,
  deleteEntryFromOpenSearch,
  isOpenSearchConfigured
} from '../openSearchUtils';

export class OpenSearchProvider implements StorageProvider {
  name = 'OpenSearch';
  description = 'Store data in OpenSearch cloud service';
  icon = Cloud;

  async isAvailable(): Promise<boolean> {
    try {
      const isConfigured = isOpenSearchConfigured();
      if (!isConfigured) {
        throw new Error('OpenSearch configuration is missing or incomplete');
      }

      await loadEntriesFromOpenSearch();
      return true;
    } catch (error) {
      console.error('OpenSearch availability check failed:', error);
      return false;
    }
  }

  async loadEntries(): Promise<QAItem[]> {
    return loadEntriesFromOpenSearch();
  }

  async addEntry(entry: QAItem): Promise<void> {
    try {
      await addEntryToOpenSearch(entry);
    } catch (error) {
      // Log warning but don't throw error for duplicates
      console.warn('Error adding entry to OpenSearch:', error);
    }
  }

  async searchEntries(query: string): Promise<Array<{ entry: QAItem; score: number; highlights: any }>> {
    return searchOpenSearchEntries(query);
  }

  async updateEntry(entry: QAItem): Promise<void> {
    await updateEntryInOpenSearch(entry);
  }

  async deleteEntry(entryId: string): Promise<void> {
    await deleteEntryFromOpenSearch(entryId);
  }
}