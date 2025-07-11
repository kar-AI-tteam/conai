import { v4 as uuidv4 } from 'uuid';
import { QAItem } from '../../types/qa';
import { StorageProvider } from './types';
import { Database } from 'lucide-react';
import { SearchEngine } from '../search/SearchEngine';

const STORAGE_KEY = 'qa_entries';

export class LocalStorageProvider implements StorageProvider {
  name = 'Local Storage';
  description = 'Store data in browser local storage';
  icon = Database;

  async isAvailable(): Promise<boolean> {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch {
      return false;
    }
  }

  async loadEntries(): Promise<QAItem[]> {
    try {
      console.log('Loading entries from local storage');
      const data = localStorage.getItem(STORAGE_KEY);

      if (!data) {
        console.log('No entries found in storage');
        return [];
      }

      const entries = JSON.parse(data);
      console.log(`Loaded ${entries.length} entries from storage`);
      return entries;
    } catch (error) {
      console.error('Error loading entries from localStorage:', error);
      return [];
    }
  }

  async searchEntries(query: string): Promise<Array<{ entry: QAItem; score: number; highlights: any }>> {
    try {
      const entries = await this.loadEntries();
      return SearchEngine.search(entries, query);
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  private async saveEntries(entries: QAItem[]): Promise<void> {
    try {
      console.log(`Saving ${entries.length} entries to localStorage`);
      const entriesString = JSON.stringify(entries);
      const sizeInMB = entriesString.length / (1024 * 1024);
      console.log(`Storage size: ${sizeInMB.toFixed(2)} MB`);
      localStorage.setItem(STORAGE_KEY, entriesString);
      console.log('Entries saved successfully');
    } catch (error) {
      console.error('Error saving entries:', error);
      throw new Error(
        `Failed to save entries: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async addEntry(entry: QAItem): Promise<void> {
    try {
      console.log('Adding entry:', entry);
      const entries = await this.loadEntries();

      const isDuplicate = entries.some(
        (existingEntry) =>
          existingEntry.question.toLowerCase() === entry.question.toLowerCase()
      );

      if (isDuplicate) {
        console.log('Skipping duplicate entry:', entry.question);
        return;
      }

      const newEntry: QAItem = {
        ...entry,
        id: entry.id || uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      entries.push(newEntry);
      await this.saveEntries(entries);
      console.log('Entry added successfully');
    } catch (error) {
      console.error('Error adding entry:', error);
      throw error;
    }
  }

  async updateEntry(entry: QAItem): Promise<void> {
    try {
      if (!entry.id) {
        throw new Error('Entry ID is required for update');
      }

      console.log('Updating entry:', entry);
      const entries = await this.loadEntries();
      const index = entries.findIndex((e) => e.id === entry.id);

      if (index === -1) {
        const isDuplicate = entries.some(
          (existingEntry) =>
            existingEntry.question.toLowerCase() === entry.question.toLowerCase()
        );

        if (isDuplicate) {
          console.log('Skipping duplicate entry:', entry.question);
          return;
        }

        await this.addEntry(entry);
        return;
      }

      const updatedEntry: QAItem = {
        ...entries[index],
        ...entry,
        updated_at: new Date().toISOString(),
      };

      entries[index] = updatedEntry;
      await this.saveEntries(entries);
      console.log('Entry updated successfully');
    } catch (error) {
      console.error('Error updating entry:', error);
      throw error;
    }
  }

  async deleteEntry(entryId: string): Promise<void> {
    try {
      if (!entryId) {
        throw new Error('Entry ID is required for deletion');
      }

      console.log('Deleting entry:', entryId);
      const entries = await this.loadEntries();
      const filteredEntries = entries.filter((entry) => entry.id !== entryId);
      await this.saveEntries(filteredEntries);
      console.log('Entry deleted successfully');
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  }
}