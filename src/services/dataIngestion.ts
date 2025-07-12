// Data Ingestion Service

import { DataSource, Document, DocumentChunk, PreprocessingConfig } from '../types/enterprise';
import { PDFProcessor } from './processors/pdfProcessor';
import { WordProcessor } from './processors/wordProcessor';
import { ImageProcessor } from './processors/imageProcessor';
import { AudioProcessor } from './processors/audioProcessor';
import { JSONProcessor } from './processors/jsonProcessor';
import { APIConnector } from './connectors/apiConnector';
import { DatabaseConnector } from './connectors/databaseConnector';
import { EmailConnector } from './connectors/emailConnector';
import { ChunkingService } from './chunkingService';
import { EmbeddingService } from './embeddingService';
import { MetadataExtractor } from './metadataExtractor';

export class DataIngestionService {
  private processors: Map<string, any>;
  private connectors: Map<string, any>;
  private chunkingService: ChunkingService;
  private embeddingService: EmbeddingService;
  private metadataExtractor: MetadataExtractor;

  constructor() {
    this.initializeProcessors();
    this.initializeConnectors();
    this.chunkingService = new ChunkingService();
    this.embeddingService = new EmbeddingService();
    this.metadataExtractor = new MetadataExtractor();
  }

  private initializeProcessors(): void {
    this.processors = new Map([
      ['pdf', new PDFProcessor()],
      ['word', new WordProcessor()],
      ['image', new ImageProcessor()],
      ['audio', new AudioProcessor()],
      ['video', new AudioProcessor()], // Same as audio for transcription
      ['json', new JSONProcessor()],
      ['xml', new JSONProcessor()], // Can handle XML as well
    ]);
  }

  private initializeConnectors(): void {
    this.connectors = new Map([
      ['api', new APIConnector()],
      ['database', new DatabaseConnector()],
      ['email', new EmailConnector()],
    ]);
  }

  async ingestDataSource(dataSource: DataSource): Promise<Document[]> {
    try {
      console.log(`Starting ingestion for data source: ${dataSource.name}`);

      // 1. Connect to data source
      const connector = this.getConnector(dataSource.type);
      const rawDocuments = await connector.fetch(dataSource.config);

      // 2. Process documents
      const processedDocuments: Document[] = [];
      
      for (const rawDoc of rawDocuments) {
        try {
          const document = await this.processDocument(rawDoc, dataSource);
          processedDocuments.push(document);
        } catch (error) {
          console.error(`Failed to process document ${rawDoc.id}:`, error);
          // Continue with other documents
        }
      }

      console.log(`Ingested ${processedDocuments.length} documents from ${dataSource.name}`);
      return processedDocuments;

    } catch (error) {
      console.error(`Data ingestion failed for ${dataSource.name}:`, error);
      throw new Error(`Ingestion failed: ${error.message}`);
    }
  }

  private async processDocument(rawDoc: any, dataSource: DataSource): Promise<Document> {
    // 1. Extract content using appropriate processor
    const processor = this.getProcessor(dataSource.type);
    const extractedContent = await processor.extract(rawDoc, dataSource.config.preprocessing);

    // 2. Extract metadata
    const metadata = await this.metadataExtractor.extract(rawDoc, extractedContent);

    // 3. Create document
    const document: Document = {
      id: this.generateDocumentId(),
      tenantId: dataSource.tenantId,
      dataSourceId: dataSource.id,
      title: extractedContent.title || rawDoc.name || 'Untitled',
      content: extractedContent.text,
      metadata: {
        ...metadata,
        source: dataSource.name,
        fileType: dataSource.type,
        accessLevel: this.determineAccessLevel(metadata),
        tags: this.extractTags(extractedContent.text)
      },
      chunks: [],
      status: 'processing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 4. Chunk the document
    document.chunks = await this.chunkDocument(document, dataSource.config.preprocessing);

    // 5. Generate embeddings
    await this.generateEmbeddings(document);

    document.status = 'indexed';
    return document;
  }

  private async chunkDocument(document: Document, config?: PreprocessingConfig): Promise<DocumentChunk[]> {
    const chunkingConfig = {
      chunkSize: config?.chunkSize || 1000,
      chunkOverlap: config?.chunkOverlap || 200,
      preserveContext: true
    };

    return this.chunkingService.chunk(document, chunkingConfig);
  }

  private async generateEmbeddings(document: Document): Promise<void> {
    // Generate embedding for the full document
    document.embedding = await this.embeddingService.embed(document.content);

    // Generate embeddings for each chunk
    for (const chunk of document.chunks) {
      chunk.embedding = await this.embeddingService.embed(chunk.content);
    }
  }

  private getProcessor(type: string): any {
    const processor = this.processors.get(type);
    if (!processor) {
      throw new Error(`No processor found for type: ${type}`);
    }
    return processor;
  }

  private getConnector(type: string): any {
    const connector = this.connectors.get(type);
    if (!connector) {
      throw new Error(`No connector found for type: ${type}`);
    }
    return connector;
  }

  private determineAccessLevel(metadata: any): 'public' | 'internal' | 'confidential' | 'restricted' {
    // Logic to determine access level based on metadata
    if (metadata.classification) {
      return metadata.classification.toLowerCase();
    }
    
    // Default access level
    return 'internal';
  }

  private extractTags(content: string): string[] {
    // Simple tag extraction - can be enhanced with NLP
    const words = content.toLowerCase().split(/\s+/);
    const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    return words
      .filter(word => word.length > 3 && !commonWords.has(word))
      .slice(0, 10); // Limit to 10 tags
  }

  private generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Batch Processing
  async batchIngest(dataSources: DataSource[]): Promise<Map<string, Document[]>> {
    const results = new Map<string, Document[]>();

    for (const dataSource of dataSources) {
      try {
        const documents = await this.ingestDataSource(dataSource);
        results.set(dataSource.id, documents);
      } catch (error) {
        console.error(`Batch ingestion failed for ${dataSource.name}:`, error);
        results.set(dataSource.id, []);
      }
    }

    return results;
  }

  // Real-time Sync
  async syncDataSource(dataSource: DataSource): Promise<void> {
    // Implement incremental sync logic
    const connector = this.getConnector(dataSource.type);
    const lastSync = dataSource.lastSync ? new Date(dataSource.lastSync) : new Date(0);
    
    const updatedDocuments = await connector.fetchUpdated(dataSource.config, lastSync);
    
    for (const rawDoc of updatedDocuments) {
      await this.processDocument(rawDoc, dataSource);
    }
  }

  // Health Check
  async healthCheck(): Promise<string> {
    try {
      // Check all processors and connectors
      const checks = await Promise.all([
        this.chunkingService.healthCheck(),
        this.embeddingService.healthCheck(),
        this.metadataExtractor.healthCheck()
      ]);

      return checks.every(status => status === 'healthy') ? 'healthy' : 'degraded';
    } catch (error) {
      return 'down';
    }
  }
}