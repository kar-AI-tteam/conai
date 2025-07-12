// Data Ingestion Tests

async function runIngestionTests(testEnv) {
  const results = [];
  
  try {
    // Test 1: PDF Ingestion
    results.push(await testPdfIngestion(testEnv));
    
    // Test 2: JSON Ingestion
    results.push(await testJsonIngestion(testEnv));
    
    // Test 3: API Ingestion
    results.push(await testApiIngestion(testEnv));
    
    // Test 4: Batch Ingestion
    results.push(await testBatchIngestion(testEnv));
    
    // Test 5: Ingestion with OCR
    results.push(await testOcrIngestion(testEnv));
    
  } catch (error) {
    console.error('Error running ingestion tests:', error);
    results.push({
      name: 'Ingestion Test Suite',
      success: false,
      error: error
    });
  }
  
  return results;
}

async function testPdfIngestion(testEnv) {
  try {
    console.log('  - Testing PDF ingestion...');
    const startTime = Date.now();
    
    // Create PDF data source
    const pdfSource = {
      id: 'test-pdf-source',
      tenantId: testEnv.testTenant.id,
      name: 'Test PDF Source',
      type: 'pdf',
      config: {
        preprocessing: {
          chunkSize: 1000,
          chunkOverlap: 200,
          extractMetadata: true,
          ocrEnabled: false,
          languageDetection: true
        }
      },
      status: 'active',
      isActive: true
    };
    
    // Sample PDF file (mock)
    const mockPdfFile = {
      path: './test/data/sample.pdf',
      size: 1024 * 1024, // 1MB
      type: 'application/pdf'
    };
    
    // Process the PDF
    const document = await testEnv.dataIngestion.processDocument(
      mockPdfFile,
      pdfSource.config,
      testEnv.testTenant.id
    );
    
    const endTime = Date.now();
    
    return {
      name: 'PDF Ingestion',
      success: true,
      details: `Successfully processed PDF document with ${document.chunks.length} chunks`,
      metrics: {
        documentsProcessed: 1,
        processingTimeMs: endTime - startTime,
        averageChunksPerDocument: document.chunks.length
      }
    };
  } catch (error) {
    console.error('PDF ingestion test failed:', error);
    return {
      name: 'PDF Ingestion',
      success: false,
      error: error
    };
  }
}

async function testJsonIngestion(testEnv) {
  try {
    console.log('  - Testing JSON ingestion...');
    const startTime = Date.now();
    
    // Create JSON data source
    const jsonSource = {
      id: 'test-json-source',
      tenantId: testEnv.testTenant.id,
      name: 'Test JSON Source',
      type: 'json',
      config: {
        preprocessing: {
          chunkSize: 500,
          chunkOverlap: 100,
          extractMetadata: true
        }
      },
      status: 'active',
      isActive: true
    };
    
    // Sample JSON data (mock)
    const mockJsonData = JSON.stringify({
      title: 'API Documentation',
      sections: [
        {
          title: 'Authentication',
          content: 'This API uses OAuth 2.0 for authentication...'
        },
        {
          title: 'Endpoints',
          content: 'The following endpoints are available...'
        }
      ]
    });
    
    // Process the JSON
    const document = await testEnv.dataIngestion.processDocument(
      mockJsonData,
      jsonSource.config,
      testEnv.testTenant.id
    );
    
    const endTime = Date.now();
    
    return {
      name: 'JSON Ingestion',
      success: true,
      details: `Successfully processed JSON document with ${document.chunks.length} chunks`,
      metrics: {
        documentsProcessed: 1,
        processingTimeMs: endTime - startTime,
        averageChunksPerDocument: document.chunks.length
      }
    };
  } catch (error) {
    console.error('JSON ingestion test failed:', error);
    return {
      name: 'JSON Ingestion',
      success: false,
      error: error
    };
  }
}

async function testApiIngestion(testEnv) {
  try {
    console.log('  - Testing API ingestion...');
    const startTime = Date.now();
    
    // Create API data source
    const apiSource = {
      id: 'test-api-source',
      tenantId: testEnv.testTenant.id,
      name: 'Test API Source',
      type: 'api',
      config: {
        endpoint: 'https://jsonplaceholder.typicode.com/posts',
        method: 'GET',
        preprocessing: {
          chunkSize: 500,
          chunkOverlap: 100,
          extractMetadata: true
        }
      },
      status: 'active',
      isActive: true
    };
    
    // Ingest from API
    const documents = await testEnv.dataIngestion.ingestDataSource(apiSource);
    
    const endTime = Date.now();
    
    return {
      name: 'API Ingestion',
      success: true,
      details: `Successfully ingested ${documents.length} documents from API`,
      metrics: {
        documentsProcessed: documents.length,
        processingTimeMs: endTime - startTime,
        averageChunksPerDocument: documents.reduce((sum, doc) => sum + doc.chunks.length, 0) / documents.length
      }
    };
  } catch (error) {
    console.error('API ingestion test failed:', error);
    return {
      name: 'API Ingestion',
      success: false,
      error: error
    };
  }
}

async function testBatchIngestion(testEnv) {
  try {
    console.log('  - Testing batch ingestion...');
    const startTime = Date.now();
    
    // Create batch data source
    const batchSource = {
      id: 'test-batch-source',
      tenantId: testEnv.testTenant.id,
      name: 'Test Batch Source',
      type: 'pdf',
      config: {
        preprocessing: {
          chunkSize: 1000,
          chunkOverlap: 200,
          extractMetadata: true
        }
      },
      status: 'active',
      isActive: true
    };
    
    // Mock files for batch processing
    const mockFiles = [
      { path: './test/data/sample1.pdf', size: 1024 * 1024, type: 'application/pdf' },
      { path: './test/data/sample2.pdf', size: 1024 * 1024, type: 'application/pdf' },
      { path: './test/data/sample3.pdf', size: 1024 * 1024, type: 'application/pdf' }
    ];
    
    // Process batch
    const documents = await testEnv.dataIngestion.batchProcess(
      mockFiles,
      batchSource.config,
      testEnv.testTenant.id
    );
    
    const endTime = Date.now();
    
    return {
      name: 'Batch Ingestion',
      success: true,
      details: `Successfully processed ${documents.length} documents in batch`,
      metrics: {
        documentsProcessed: documents.length,
        processingTimeMs: endTime - startTime,
        averageChunksPerDocument: documents.reduce((sum, doc) => sum + doc.chunks.length, 0) / documents.length
      }
    };
  } catch (error) {
    console.error('Batch ingestion test failed:', error);
    return {
      name: 'Batch Ingestion',
      success: false,
      error: error
    };
  }
}

async function testOcrIngestion(testEnv) {
  try {
    console.log('  - Testing OCR ingestion...');
    const startTime = Date.now();
    
    // Create OCR-enabled data source
    const ocrSource = {
      id: 'test-ocr-source',
      tenantId: testEnv.testTenant.id,
      name: 'Test OCR Source',
      type: 'pdf',
      config: {
        preprocessing: {
          chunkSize: 1000,
          chunkOverlap: 200,
          extractMetadata: true,
          ocrEnabled: true,
          languageDetection: true
        }
      },
      status: 'active',
      isActive: true
    };
    
    // Sample scanned PDF file (mock)
    const mockScannedFile = {
      path: './test/data/scanned.pdf',
      size: 2 * 1024 * 1024, // 2MB
      type: 'application/pdf'
    };
    
    // Process with OCR
    const document = await testEnv.dataIngestion.processDocument(
      mockScannedFile,
      ocrSource.config,
      testEnv.testTenant.id
    );
    
    const endTime = Date.now();
    
    return {
      name: 'OCR Ingestion',
      success: true,
      details: `Successfully processed scanned document with OCR, extracted ${document.chunks.length} chunks`,
      metrics: {
        documentsProcessed: 1,
        processingTimeMs: endTime - startTime,
        averageChunksPerDocument: document.chunks.length
      }
    };
  } catch (error) {
    console.error('OCR ingestion test failed:', error);
    return {
      name: 'OCR Ingestion',
      success: false,
      error: error
    };
  }
}

export { runIngestionTests };