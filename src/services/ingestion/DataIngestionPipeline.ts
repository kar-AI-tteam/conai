import { DataSource, Document, DocumentChunk } from '../../types/enterprise';
import { PDFProcessor } from './processors/PDFProcessor';
import { WordProcessor } from './processors/WordProcessor';
import { ExcelProcessor } from './processors/ExcelProcessor';
import { ImageProcessor } from './processors/ImageProcessor';
import { AudioProcessor } from './processors/AudioProcessor';
import { JSONProcessor } from './processors/JSONProcessor';
import { APIConnector } from './connectors/APIConnector';
import { EmailProcessor } from './processors/EmailProcessor';

/**
 * Main data ingestion pipeline for processing various data sources
 */
export class DataIngestionPipeline {
  private processors: Map<string, any>;
  private connectors: Map<string, any>;

  constructor() {
    this.initializeProcessors();
    this.initializeConnectors();
  }

  /**
   * Process a data source and extract documents
   */
  async processDataSource(dataSource: DataSource): Promise<Document[]> {
    try {
      console.log(`Processing data source: ${dataSource.name} (${dataSource.type})`);

      const processor = this.getProcessor(dataSource.type);
      if (!processor) {
        throw new Error(`No processor available for type: ${dataSource.type}`);
      }

      // Fetch data from source
      const rawData = await this.fetchDataFromSource(dataSource);

      // Process data into documents
      const documents = await processor.process(rawData, dataSource);

      // Apply post-processing
      const processedDocuments = await this.postProcessDocuments(documents, dataSource);

      console.log(`Processed ${processedDocuments.length} documents from ${dataSource.name}`);
      return processedDocuments;
    } catch (error) {
      console.error(`Error processing data source ${dataSource.name}:`, error);
      throw error;
    }
  }

  /**
   * Fetch data from the configured source
   */
  private async fetchDataFromSource(dataSource: DataSource): Promise<any> {
    switch (dataSource.type) {
      case 'api':
      case 'splunk':
      case 'confluence':
      case 'slack':
        const connector = this.connectors.get(dataSource.type);
        return await connector.fetch(dataSource.config);

      case 'pdf':
      case 'word':
      case 'excel':
      case 'csv':
        // For file-based sources, data would be uploaded through UI
        return dataSource.config.fileData;

      default:
        throw new Error(`Unsupported data source type: ${dataSource.type}`);
    }
  }

  /**
   * Get appropriate processor for data type
   */
  private getProcessor(type: string): any {
    return this.processors.get(type);
  }

  /**
   * Apply post-processing to documents
   */
  private async postProcessDocuments(
    documents: Document[],
    dataSource: DataSource
  ): Promise<Document[]> {
    const processedDocs: Document[] = [];

    for (const doc of documents) {
      try {
        // Apply chunking strategy
        const chunks = await this.chunkDocument(doc, dataSource.config.preprocessing);

        // Generate metadata
        const enhancedMetadata = await this.enhanceMetadata(doc.metadata, dataSource);

        // Create processed document
        const processedDoc: Document = {
          ...doc,
          chunks,
          metadata: enhancedMetadata,
          updatedAt: new Date().toISOString()
        };

        processedDocs.push(processedDoc);
      } catch (error) {
        console.error(`Error post-processing document ${doc.id}:`, error);
        // Continue with other documents
      }
    }

    return processedDocs;
  }

  /**
   * Chunk document content based on strategy
   */
  private async chunkDocument(
    document: Document,
    preprocessingConfig: any = {}
  ): Promise<DocumentChunk[]> {
    const chunkSize = preprocessingConfig.chunkSize || 1000;
    const overlap = preprocessingConfig.overlap || 200;
    
    const chunks: DocumentChunk[] = [];
    const content = document.content;
    
    // Simple sliding window chunking
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < content.length) {
      const endIndex = Math.min(startIndex + chunkSize, content.length);
      const chunkContent = content.slice(startIndex, endIndex);

      // Try to break at sentence boundaries
      let adjustedEndIndex = endIndex;
      if (endIndex < content.length) {
        const lastSentenceEnd = chunkContent.lastIndexOf('.');
        if (lastSentenceEnd > chunkSize * 0.7) {
          adjustedEndIndex = startIndex + lastSentenceEnd + 1;
        }
      }

      const finalChunkContent = content.slice(startIndex, adjustedEndIndex);

      chunks.push({
        id: `${document.id}_chunk_${chunkIndex}`,
        content: finalChunkContent.trim(),
        startIndex,
        endIndex: adjustedEndIndex,
        metadata: {
          chunkIndex,
          pageNumber: this.estimatePageNumber(startIndex, content),
          section: this.extractSection(finalChunkContent)
        }
      });

      startIndex = adjustedEndIndex - overlap;
      chunkIndex++;

      // Prevent infinite loop
      if (startIndex >= adjustedEndIndex) {
        break;
      }
    }

    return chunks;
  }

  /**
   * Enhance document metadata
   */
  private async enhanceMetadata(
    metadata: any,
    dataSource: DataSource
  ): Promise<any> {
    return {
      ...metadata,
      dataSourceId: dataSource.id,
      dataSourceType: dataSource.type,
      processedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  /**
   * Initialize processors for different data types
   */
  private initializeProcessors(): void {
    this.processors = new Map([
      ['pdf', new PDFProcessor()],
      ['word', new WordProcessor()],
      ['excel', new ExcelProcessor()],
      ['csv', new ExcelProcessor()], // Excel processor handles CSV too
      ['json', new JSONProcessor()],
      ['xml', new JSONProcessor()], // JSON processor handles XML too
      ['image', new ImageProcessor()],
      ['audio', new AudioProcessor()],
      ['video', new AudioProcessor()], // Audio processor handles video too
      ['email', new EmailProcessor()]
    ]);
  }

  /**
   * Initialize connectors for external data sources
   */
  private initializeConnectors(): void {
    this.connectors = new Map([
      ['api', new APIConnector()],
      ['splunk', new APIConnector()],
      ['confluence', new APIConnector()],
      ['slack', new APIConnector()]
    ]);
  }

  /**
   * Estimate page number based on character position
   */
  private estimatePageNumber(position: number, content: string): number {
    const avgCharsPerPage = 2000; // Rough estimate
    return Math.floor(position / avgCharsPerPage) + 1;
  }

  /**
   * Extract section information from content
   */
  private extractSection(content: string): string | undefined {
    // Look for heading patterns
    const headingMatch = content.match(/^#+\s+(.+)$/m);
    if (headingMatch) {
      return headingMatch[1].trim();
    }

    // Look for numbered sections
    const numberedMatch = content.match(/^\d+\.\s+(.+)$/m);
    if (numberedMatch) {
      return numberedMatch[1].trim();
    }

    return undefined;
  }

  /**
   * Schedule periodic data source synchronization
   */
  async scheduleSync(dataSource: DataSource): Promise<void> {
    if (!dataSource.config.syncSchedule) {
      return;
    }

    // Implementation would depend on the job scheduler used
    console.log(`Scheduling sync for ${dataSource.name}: ${dataSource.config.syncSchedule}`);
  }

  /**
   * Get processing statistics
   */
  async getProcessingStats(tenantId: string): Promise<{
    totalDocuments: number;
    processingErrors: number;
    lastProcessed: string;
    averageProcessingTime: number;
  }> {
    // Implementation would query processing logs and metrics
    return {
      totalDocuments: 0,
      processingErrors: 0,
      lastProcessed: new Date().toISOString(),
      averageProcessingTime: 0
    };
  }
}