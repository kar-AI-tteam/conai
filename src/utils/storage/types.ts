import { QAItem } from '../../types/qa';
import { DivideIcon as LucideIcon } from 'lucide-react';

export interface StorageProvider {
  name: string;
  description: string;
  icon: LucideIcon;
  isAvailable: () => Promise<boolean>;
  loadEntries: () => Promise<QAItem[]>;
  searchEntries: (query: string) => Promise<Array<{ entry: QAItem; score: number; highlights: any }>>;
  addEntry: (entry: QAItem) => Promise<void>;
  updateEntry: (entry: QAItem) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
}

export type StorageType = 'localStorage' | 'openSearch' | 'milvus';

export interface StorageConfig {
  type: StorageType;
}