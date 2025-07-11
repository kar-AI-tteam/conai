import { QAItem } from '../types/qa';

interface OpenSearchConfig {
  domain: string;
  username: string;
  password: string;
}

const MINIMUM_MATCH_THRESHOLD = 25; // Define minimum match threshold

class OpenSearchClient {
  private baseUrl: string;
  private headers: Headers;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor(config: OpenSearchConfig) {
    this.baseUrl = `https://${config.domain}.${import.meta.env.VITE_OPENSEARCH_REGION}.es.amazonaws.com`;
    const auth = btoa(`${config.username}:${config.password}`);
    this.headers = new Headers({
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json'
    });
  }

  private async retryableRequest(operation: () => Promise<any>): Promise<any> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.warn(`Request failed (attempt ${attempt}/${this.maxRetries}):`, error);
        
        if (attempt === this.maxRetries) {
          throw error;
        }
        
        // Exponential backoff with jitter
        const jitter = Math.random() * 1000;
        const delay = (this.retryDelay * Math.pow(2, attempt - 1)) + jitter;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async request(method: string, path: string, body?: any): Promise<any> {
    return this.retryableRequest(async () => {
      try {
        const url = `${this.baseUrl}${path}`;
        console.log(`Making ${method} request to: ${url}`);
        
        const response = await fetch(url, {
          method,
          headers: this.headers,
          body: body ? JSON.stringify(body) : undefined,
          mode: 'cors',
          credentials: 'omit'
        });

        // For HEAD requests, just return the status
        if (method === 'HEAD') {
          return response.ok;
        }

        const contentType = response.headers.get('content-type');
        const responseText = await response.text();
        
        if (!response.ok) {
          let errorMessage = `OpenSearch request failed: ${response.status} ${response.statusText}`;
          try {
            if (responseText) {
              const errorData = JSON.parse(responseText);
              errorMessage += ` - ${errorData.error?.reason || errorData.message || JSON.stringify(errorData)}`;
            }
          } catch {
            if (responseText) {
              errorMessage += ` - ${responseText}`;
            }
          }
          throw new Error(errorMessage);
        }

        // Handle empty responses
        if (!responseText) {
          return null;
        }

        // Parse JSON response
        try {
          return JSON.parse(responseText);
        } catch (error) {
          console.error('Failed to parse response:', error);
          throw new Error('Invalid JSON response from OpenSearch');
        }
      } catch (error) {
        // Enhance error with request context
        const enhancedError = error instanceof Error ? error : new Error(String(error));
        Object.assign(enhancedError, {
          path,
          method,
          timestamp: new Date().toISOString(),
          url: `${this.baseUrl}${path}`
        });
        throw enhancedError;
      }
    });
  }

  async ensureIndexExists(): Promise<void> {
    try {
      console.log('Checking if index exists...');
      const exists = await this.request('HEAD', '/qa_entries');
      if (exists) {
        console.log('Index exists');
        return;
      }
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes('404')) {
        throw error;
      }
      console.log('Index not found, creating...');
    }

    await this.createIndex();
  }

  private async createIndex(): Promise<void> {
    const mapping = {
      settings: {
        index: {
          number_of_shards: 1,
          number_of_replicas: 1,
          max_result_window: 10000,
          analysis: {
            analyzer: {
              qa_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'stop', 'snowball'],
                char_filter: ['html_strip']
              }
            }
          }
        }
      },
      mappings: {
        properties: {
          question: { 
            type: 'text',
            analyzer: 'qa_analyzer',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256
              }
            }
          },
          answer: { 
            type: 'text',
            analyzer: 'qa_analyzer'
          },
          keywords: { 
            type: 'keyword',
            boost: 2.0
          },
          created_at: { type: 'date' },
          updated_at: { type: 'date' },
          entryType: { type: 'keyword' },
          username: { type: 'keyword' },
          email: { type: 'keyword' }
        }
      }
    };

    try {
      console.log('Creating index with mapping:', mapping);
      await this.request('PUT', '/qa_entries', mapping);
      console.log('Index created successfully');
    } catch (error) {
      console.error('Error creating index:', error);
      throw error;
    }
  }
}

const config: OpenSearchConfig = {
  domain: import.meta.env.VITE_OPENSEARCH_DOMAIN,
  username: import.meta.env.VITE_OPENSEARCH_USERNAME,
  password: import.meta.env.VITE_OPENSEARCH_PASSWORD
};

export const isOpenSearchConfigured = (): boolean => {
  const isConfigured = Boolean(
    import.meta.env.VITE_OPENSEARCH_DOMAIN &&
    import.meta.env.VITE_OPENSEARCH_USERNAME &&
    import.meta.env.VITE_OPENSEARCH_PASSWORD &&
    import.meta.env.VITE_OPENSEARCH_REGION
  );
  
  console.log('OpenSearch configuration status:', isConfigured);
  return isConfigured;
};

let client: OpenSearchClient | null = null;

export const getClient = (): OpenSearchClient => {
  if (!client) {
    if (!isOpenSearchConfigured()) {
      throw new Error('OpenSearch configuration missing');
    }
    console.log('Creating new OpenSearch client');
    client = new OpenSearchClient(config);
  }
  return client;
};

export const searchEntries = async (query: string): Promise<Array<{ entry: QAItem; score: number; highlights: any }>> => {
  try {
    console.log('Searching entries with query:', query);
    const client = getClient();
    await client.ensureIndexExists();
    
    const searchBody = {
      query: {
        multi_match: {
          query,
          fields: ['question^2', 'answer', 'keywords^1.5'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      },
      highlight: {
        fields: {
          question: {},
          answer: {},
          keywords: {}
        }
      },
      size: 10
    };

    const response = await client.request('POST', '/qa_entries/_search', searchBody);

    if (!response?.hits?.hits) {
      console.log('No search results found');
      return [];
    }

    const results = response.hits.hits
      .map((hit: any) => ({
        entry: {
          id: hit._id,
          ...hit._source
        },
        score: Math.round((hit._score / response.hits.max_score) * 100),
        highlights: hit.highlight || {}
      }))
      .filter(result => result.score >= MINIMUM_MATCH_THRESHOLD); // Filter results below threshold

    console.log(`Found ${results.length} results above ${MINIMUM_MATCH_THRESHOLD}% threshold`);
    return results;
  } catch (error) {
    console.error('Failed to search entries:', error);
    return [];
  }
};

export const loadEntriesFromOpenSearch = async (): Promise<QAItem[]> => {
  try {
    console.log('Loading entries from OpenSearch');
    const client = getClient();
    await client.ensureIndexExists();
    
    const response = await client.request('POST', '/qa_entries/_search', {
      query: { match_all: {} },
      sort: [{ created_at: 'desc' }],
      size: 1000
    });
    
    if (!response?.hits?.hits) {
      console.log('No entries found');
      return [];
    }

    console.log(`Loaded ${response.hits.hits.length} entries`);
    return response.hits.hits.map((hit: any) => ({
      id: hit._id,
      ...hit._source
    }));
  } catch (error) {
    console.error('Failed to load entries from OpenSearch:', error);
    return [];
  }
};

export const addEntryToOpenSearch = async (entry: QAItem): Promise<void> => {
  try {
    console.log('Adding entry:', entry);
    const client = getClient();
    await client.ensureIndexExists();
    
    const document = {
      ...entry,
      id: entry.id || `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await client.request('POST', `/qa_entries/_doc/${document.id}`, document);
    console.log('Entry added successfully');
  } catch (error) {
    console.error('Failed to add entry to OpenSearch:', error);
    throw error;
  }
};

export const updateEntryInOpenSearch = async (entry: QAItem): Promise<void> => {
  try {
    if (!entry.id) {
      throw new Error('Entry ID is required for update');
    }

    console.log('Updating entry:', entry);
    const client = getClient();
    await client.ensureIndexExists();
    
    try {
      const existingDoc = await client.request('GET', `/qa_entries/_doc/${entry.id}`);
      
      const document = {
        ...entry,
        created_at: existingDoc._source.created_at,
        updated_at: new Date().toISOString()
      };

      await client.request('PUT', `/qa_entries/_doc/${entry.id}`, document);
      console.log('Entry updated successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        console.log('Entry not found, adding as new entry');
        await addEntryToOpenSearch(entry);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Failed to update entry in OpenSearch:', error);
    throw error;
  }
};

export const deleteEntryFromOpenSearch = async (entryId: string): Promise<void> => {
  if (!entryId) {
    throw new Error('Entry ID is required for deletion');
  }

  try {
    console.log('Deleting entry:', entryId);
    const client = getClient();
    await client.ensureIndexExists();
    await client.request('DELETE', `/qa_entries/_doc/${entryId}`);
    console.log('Entry deleted successfully');
  } catch (error) {
    console.error('Failed to delete entry from OpenSearch:', error);
    throw error;
  }
};