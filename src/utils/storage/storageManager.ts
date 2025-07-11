import { StorageProvider, StorageType, StorageConfig } from './types';
import { LocalStorageProvider } from './localStorageProvider';
import { OpenSearchProvider } from './openSearchProvider';
import { MilvusProvider } from './milvusProvider';

export class StorageManager {
  private static instance: StorageManager;
  private providers: Map<StorageType, StorageProvider>;
  private currentProvider: StorageProvider;
  private config: StorageConfig;
  private listeners: Set<(type: StorageType) => void>;
  private initializationPromise: Promise<void> | null = null;
  private initialized: boolean = false;

  private constructor() {
    this.providers = new Map();
    this.providers.set('localStorage', new LocalStorageProvider());
    this.providers.set('openSearch', new OpenSearchProvider());
    this.providers.set('milvus', new MilvusProvider());
    this.listeners = new Set();
    
    // Always start with localStorage as default for safety
    this.config = { type: 'localStorage' };
    this.currentProvider = this.providers.get('localStorage')!;
    
    // Try to load saved configuration
    try {
      const savedConfig = localStorage.getItem('contour_ai_storage_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (this.providers.has(parsed.type)) {
          this.config = parsed;
          this.currentProvider = this.providers.get(parsed.type)!;
        }
      }
    } catch (error) {
      console.warn('Failed to load storage configuration:', error);
    }
  }

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        // First try the current provider
        if (this.config.type !== 'localStorage') {
          const isAvailable = await this.currentProvider.isAvailable();
          if (!isAvailable) {
            console.log(`Current provider ${this.config.type} not available, falling back to localStorage`);
            await this.setProvider('localStorage');
          }
        }

        // Ensure localStorage is always available as fallback
        const localStorageProvider = this.providers.get('localStorage')!;
        const isLocalStorageAvailable = await localStorageProvider.isAvailable();
        if (!isLocalStorageAvailable) {
          throw new Error('LocalStorage is not available');
        }

        this.initialized = true;
      } catch (error) {
        console.error('Storage initialization failed:', error);
        // Force localStorage as last resort
        this.config.type = 'localStorage';
        this.currentProvider = this.providers.get('localStorage')!;
        this.saveConfig();
      }
    })();

    return this.initializationPromise;
  }

  getAvailableProviders(): StorageProvider[] {
    return Array.from(this.providers.values());
  }

  getCurrentProvider(): StorageProvider {
    return this.currentProvider;
  }

  addListener(listener: (type: StorageType) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private saveConfig(): void {
    try {
      localStorage.setItem('contour_ai_storage_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save storage configuration:', error);
    }
  }

  async setProvider(type: StorageType): Promise<void> {
    try {
      const provider = this.providers.get(type);
      if (!provider) {
        throw new Error(`Storage provider "${type}" not found`);
      }

      // Test provider availability
      const isAvailable = await provider.isAvailable();
      if (!isAvailable) {
        throw new Error(`Storage provider "${type}" is not available`);
      }

      // Update configuration
      this.config.type = type;
      this.currentProvider = provider;
      this.saveConfig();

      // Notify listeners of the change
      this.listeners.forEach(listener => {
        try {
          listener(type);
        } catch (error) {
          console.error('Error in storage change listener:', error);
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error setting storage provider:', errorMessage);
      
      // If the requested provider fails, fall back to localStorage
      if (type !== 'localStorage') {
        console.log('Falling back to localStorage provider');
        await this.setProvider('localStorage');
      } else {
        throw new Error(`Failed to set storage provider: ${errorMessage}`);
      }
    }
  }

  getConfig(): StorageConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();
  }
}

// Export a singleton instance
export const storageManager = StorageManager.getInstance();