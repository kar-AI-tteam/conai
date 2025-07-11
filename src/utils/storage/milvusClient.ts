import { QAItem } from '../../types/qa';

interface MilvusConfig {
  address: string;
  token: string;
  collection: string;
  dimension: number;
  indexType: string;
  metricType: string;
  nlist: number;
  searchParams: any;
  consistencyLevel: string;
}

export class MilvusClient {
  private config: MilvusConfig;
  private headers: Headers;
  private baseUrl: string;
  private isLoading: boolean = false;
  private isCollectionLoaded: boolean = false;

  constructor(config: MilvusConfig) {
    this.config = config;
    this.baseUrl = this.config.address.replace(/\/$/, '');
    this.headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.config.token}`
    });
  }

  private async makeRequest(path: string, options: RequestInit = {}): Promise<any> {
    try {
      const url = `${this.baseUrl}${path}`;
      console.log(`Making request to: ${url}`);
      console.log('Headers:', Object.fromEntries(this.headers.entries()));
      
      const response = await fetch(url, {
        ...options,
        headers: this.headers,
        mode: 'cors',
        credentials: 'omit'
      });

      const contentType = response.headers.get('content-type');
      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMessage = `Request failed: ${response.status} ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage += ` - ${errorData.message || JSON.stringify(errorData)}`;
        } catch {
          errorMessage += ` - ${responseText}`;
        }
        console.error('Request failed:', {
          url,
          status: response.status,
          statusText: response.statusText,
          response: responseText
        });
        throw new Error(errorMessage);
      }

      if (!contentType?.includes('application/json')) {
        return null;
      }

      return responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      console.error('Request failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path,
        method: options.method,
        baseUrl: this.baseUrl
      });
      throw error;
    }
  }

  private async loadCollection(): Promise<void> {
    if (this.isCollectionLoaded) {
      return;
    }

    try {
      console.log('Loading collection...');
      console.log('Collection name:', this.config.collection);
      
      await this.makeRequest('/v1/vector/collections/load', {
        method: 'POST',
        body: JSON.stringify({
          collection_name: this.config.collection
        })
      });

      // Wait for collection to be loaded
      let attempts = 0;
      const maxAttempts = 30;
      const delay = 2000;

      while (attempts < maxAttempts) {
        console.log(`Checking load status (attempt ${attempts + 1}/${maxAttempts})...`);
        
        const checkResponse = await this.makeRequest('/v1/vector/collections/describe', {
          method: 'POST',
          body: JSON.stringify({
            collection_name: this.config.collection
          })
        });

        if (checkResponse?.status?.state === 'Loaded') {
          console.log('Collection loaded successfully');
          this.isCollectionLoaded = true;
          return;
        }

        attempts++;
        if (attempts === maxAttempts) {
          throw new Error(`Collection failed to load after ${maxAttempts} attempts`);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error loading collection';
      console.error('Error loading collection:', errorMessage);
      throw new Error(`Failed to load collection: ${errorMessage}`);
    }
  }

  private async ensureCollectionExists(): Promise<void> {
    try {
      console.log('Checking collection existence...');
      await this.makeRequest('/v1/vector/collections/describe', {
        method: 'POST',
        body: JSON.stringify({
          collection_name: this.config.collection
        })
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('collection not found')) {
        console.log('Collection not found, creating...');
        await this.createCollection();
      } else {
        throw error;
      }
    }
  }

  private async createCollection(): Promise<void> {
    try {
      console.log('Creating collection...');
      
      const schema = {
        collection_name: this.config.collection,
        dimension: this.config.dimension,
        description: "QA entries collection",
        fields: [
          { name: "id", data_type: "VARCHAR", max_length: 100, is_primary_key: true },
          { name: "answer", data_type: "VARCHAR", max_length: 65535 },
          { name: "createdAt", data_type: "VARCHAR", max_length: 64 },
          { name: "createdBy", data_type: "VARCHAR", max_length: 100 },
          { name: "created_at", data_type: "VARCHAR", max_length: 64 },
          { name: "entryType", data_type: "VARCHAR", max_length: 50 },
          { name: "fileName", data_type: "VARCHAR", max_length: 255 },
          { name: "fileType", data_type: "VARCHAR", max_length: 50 },
          { name: "keywords", data_type: "ARRAY", element_type: "VARCHAR", max_length: 100, max_capacity: 10 },
          { name: "question", data_type: "VARCHAR", max_length: 65535 },
          { name: "updatedAt", data_type: "VARCHAR", max_length: 64 },
          { name: "updated_at", data_type: "VARCHAR", max_length: 64 },
          { name: "visibility", data_type: "ARRAY", element_type: "VARCHAR", max_length: 50, max_capacity: 10 },
          { name: "embedding", data_type: "FLOAT_VECTOR", dim: this.config.dimension }
        ]
      };

      await this.makeRequest('/v1/vector/collections/create', {
        method: 'POST',
        body: JSON.stringify(schema)
      });

      // Create index after collection
      const indexParams = {
        collection_name: this.config.collection,
        field_name: "embedding",
        index_type: this.config.indexType,
        metric_type: this.config.metricType,
        params: {
          nlist: this.config.nlist
        }
      };

      await this.makeRequest('/v1/vector/collections/create-index', {
        method: 'POST',
        body: JSON.stringify(indexParams)
      });

      console.log('Collection and index created successfully');
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Milvus connection...');
      console.log('Base URL:', this.baseUrl);
      
      // For Zilliz Cloud, we'll test connection by trying to describe collection
      const response = await this.makeRequest('/v1/vector/collections/describe', {
        method: 'POST',
        body: JSON.stringify({
          collection_name: this.config.collection
        })
      });
      
      if (!response) {
        console.error('Connection test failed: No response from server');
        return false;
      }

      console.log('Connection test successful:', response);
      return true;
    } catch (error) {
      console.error('Milvus connection test failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        baseUrl: this.baseUrl,
        headers: Object.fromEntries(this.headers.entries())
      });
      return false;
    }
  }

  async search(collection: string): Promise<QAItem[]> {
    try {
      // First ensure collection exists and is loaded
      await this.ensureCollectionExists();
      await this.loadCollection();

      console.log('Searching collection:', collection);
      const response = await this.makeRequest('/v1/vector/collections/get', {
        method: 'POST',
        body: JSON.stringify({
          collection_name: collection,
          output_fields: [
            'id', 'question', 'answer', 'keywords', 'createdAt', 'createdBy',
            'created_at', 'entryType', 'fileName', 'fileType', 'updatedAt',
            'updated_at', 'visibility'
          ],
          limit: 100
        })
      });

      if (!response?.data) {
        console.log('No results found');
        return [];
      }

      console.log(`Found ${response.data.length} results`);
      return response.data.map(this.formatEntry);
    } catch (error) {
      console.error('Error searching Milvus:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  private buildFilterExpression(filter: any): string {
    if (!filter || Object.keys(filter).length === 0) {
      return '';
    }

    const conditions = [];
    for (const [key, value] of Object.entries(filter)) {
      if (typeof value === 'string') {
        conditions.push(`${key} == "${value}"`);
      } else if (Array.isArray(value)) {
        conditions.push(`${key} in [${value.map(v => `"${v}"`).join(', ')}]`);
      } else {
        conditions.push(`${key} == ${value}`);
      }
    }
    return conditions.join(' && ') || '';
  }

  private formatEntry(result: any): QAItem {
    return {
      id: result.id || result._id,
      question: result.question || '',
      answer: result.answer || '',
      keywords: Array.isArray(result.keywords) ? result.keywords : [],
      createdAt: result.createdAt || result.created_at || new Date().toISOString(),
      createdBy: result.createdBy || '',
      created_at: result.created_at || result.createdAt || new Date().toISOString(),
      entryType: result.entryType || 'text',
      fileName: result.fileName || '',
      fileType: result.fileType || '',
      updatedAt: result.updatedAt || result.updated_at || new Date().toISOString(),
      updated_at: result.updated_at || result.updatedAt || new Date().toISOString(),
      visibility: Array.isArray(result.visibility) ? result.visibility : []
    };
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!openaiKey) {
        throw new Error('OpenAI API key is required for embeddings');
      }

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          input: text,
          model: 'text-embedding-ada-002'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate embedding');
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error instanceof Error ? error.message : 'Unknown error');
      return Array.from({ length: this.config.dimension }, () => Math.random() * 2 - 1);
    }
  }

  async insert(collection: string, entry: QAItem): Promise<void> {
    try {
      console.log('Generating embedding for entry...');
      const embedding = await this.generateEmbedding(entry.question + ' ' + entry.answer);
      
      const document = {
        id: entry.id,
        question: entry.question,
        answer: entry.answer,
        keywords: entry.keywords || [],
        createdAt: entry.createdAt || new Date().toISOString(),
        createdBy: entry.createdBy || '',
        created_at: entry.created_at || new Date().toISOString(),
        entryType: entry.entryType || 'text',
        fileName: entry.fileName || '',
        fileType: entry.fileType || '',
        updatedAt: entry.updatedAt || new Date().toISOString(),
        updated_at: entry.updated_at || new Date().toISOString(),
        visibility: entry.visibility || [],
        embedding
      };

      console.log('Inserting document into collection:', collection);
      await this.makeRequest('/v1/vector/collections/insert', {
        method: 'POST',
        body: JSON.stringify({
          collection_name: collection,
          data: [document]
        })
      });
      console.log('Document inserted successfully');
    } catch (error) {
      console.error('Error inserting into Milvus:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async update(collection: string, id: string, entry: QAItem): Promise<void> {
    try {
      console.log('Deleting existing document...');
      await this.makeRequest('/v1/vector/collections/delete', {
        method: 'POST',
        body: JSON.stringify({
          collection_name: collection,
          filter: `id == "${id}"`
        })
      });

      console.log('Inserting updated document...');
      await this.insert(collection, {
        ...entry,
        id,
        updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating in Milvus:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async delete(collection: string, id: string): Promise<void> {
    try {
      console.log('Deleting document:', id);
      await this.makeRequest('/v1/vector/collections/delete', {
        method: 'POST',
        body: JSON.stringify({
          collection_name: collection,
          filter: `id == "${id}"`
        })
      });
      console.log('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting from Milvus:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async get(collection: string, id: string): Promise<QAItem | null> {
    try {
      console.log('Fetching document:', id);
      const response = await this.makeRequest('/v1/vector/collections/get', {
        method: 'POST',
        body: JSON.stringify({
          collection_name: collection,
          filter: `id == "${id}"`,
          output_fields: [
            'id', 'question', 'answer', 'keywords', 'createdAt', 'createdBy',
            'created_at', 'entryType', 'fileName', 'fileType', 'updatedAt',
            'updated_at', 'visibility', 'embedding'
          ],
          limit: 1
        })
      });

      if (!response?.data || response.data.length === 0) {
        console.log('Document not found');
        return null;
      }

      console.log('Document found');
      return this.formatEntry(response.data[0]);
    } catch (error) {
      console.error('Error getting entry from Milvus:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }
}