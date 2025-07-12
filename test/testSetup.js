// Test Environment Setup

const TEST_CONFIG = {
  // Tenant configuration
  tenant: {
    id: 'test-tenant-1',
    name: 'Test Enterprise',
    domain: 'test-enterprise.com'
  },
  
  // Test data sources
  dataSources: [
    {
      name: 'Sample PDF Documents',
      type: 'pdf',
      path: './test/data/pdfs'
    },
    {
      name: 'Sample JSON Data',
      type: 'json',
      path: './test/data/json'
    },
    {
      name: 'Sample API',
      type: 'api',
      endpoint: 'https://jsonplaceholder.typicode.com/posts'
    }
  ],
  
  // Test queries
  testQueries: [
    {
      text: "What is the architecture of the enterprise RAG system?",
      expectedSource: "architecture-document.pdf"
    },
    {
      text: "How does the MCP orchestrator work?",
      expectedSource: "mcp-documentation.json"
    },
    {
      text: "What data formats are supported?",
      expectedSource: "supported-formats.pdf"
    }
  ]
};

// Mock classes for testing
class MockVectorStore {
  async search() { return []; }
  async getDocument() { return null; }
  async getChunk() { return null; }
  async healthCheck() { return { status: 'healthy' }; }
  async getStats() { return { documentCount: 0, chunkCount: 0, storageBytes: 0 }; }
}

class MockKeywordSearch {
  async search() { return []; }
  async healthCheck() { return { status: 'healthy' }; }
  async getStats() { return { storageBytes: 0 }; }
}

class MockMetadataFilter {
  async filter() { return []; }
  async healthCheck() { return { status: 'healthy' }; }
}

class MockRetrieverEngine {
  constructor() {
    this.vectorStore = new MockVectorStore();
    this.keywordSearch = new MockKeywordSearch();
    this.metadataFilter = new MockMetadataFilter();
  }
  
  async search() { return []; }
  async searchSimilar() { return []; }
  async getDocumentById() { return null; }
  async getChunkById() { return null; }
  async healthCheck() { return { status: 'healthy', details: {} }; }
  async getStats() { return { documentCount: 0, chunkCount: 0, averageChunksPerDocument: 0, totalStorageBytes: 0, lastUpdated: new Date().toISOString() }; }
}

class MockLLMService {
  async generate() { 
    return { 
      answer: "This is a mock response", 
      confidence: 0.9, 
      model: "mock-model", 
      generationTime: 100, 
      tokensUsed: 50 
    }; 
  }
  async generateStream() { return { answer: "This is a mock streaming response" }; }
  getAvailableModels() { return ["mock-model"]; }
  estimateTokens() { return 100; }
  supportsStreaming() { return true; }
}

class MockPluginManager {
  getPluginsForIntent() { return []; }
  getPostProcessingPlugins() { return []; }
}

class MockMCPOrchestrator {
  constructor() {
    this.retrieverEngine = new MockRetrieverEngine();
    this.llmService = new MockLLMService();
    this.pluginManager = new MockPluginManager();
  }
  
  async processQuery() { return []; }
  async streamResponse() {}
}

class MockDataIngestionService {
  async processDocument() { 
    return { 
      id: "mock-doc-1", 
      title: "Mock Document", 
      content: "This is a mock document for testing", 
      chunks: [{ id: "chunk-1", content: "Mock chunk content" }] 
    }; 
  }
  async ingestDataSource() { return []; }
  async batchProcess() { return []; }
  async syncDataSource() {}
  async healthCheck() { return "healthy"; }
}

class MockTenantManager {
  async createTenant(tenant) { return tenant; }
  async getTenant() { return null; }
  async updateTenant() { return {}; }
  async deleteTenant() {}
  async checkAccess() { return true; }
  async enforceDataIsolation() { return false; }
  async checkQuota() { return { allowed: true, current: 0, limit: 100, remaining: 100 }; }
  async updateQuotaUsage() {}
  async logAudit() {}
  async getAuditLogs() { return []; }
}

async function setupTestEnvironment() {
  console.log("Setting up test environment...");
  
  // Create mock services
  const tenantManager = new MockTenantManager();
  const retrieverEngine = new MockRetrieverEngine();
  const mcpOrchestrator = new MockMCPOrchestrator();
  const dataIngestion = new MockDataIngestionService();
  
  // Create test tenant
  const testTenant = {
    id: TEST_CONFIG.tenant.id,
    name: TEST_CONFIG.tenant.name,
    domain: TEST_CONFIG.tenant.domain,
    settings: {
      maxUsers: 100,
      maxDocuments: 10000,
      maxQueries: 50000,
      retentionDays: 365,
      allowedDataSources: ['pdf', 'word', 'html', 'json', 'api', 'csv', 'excel']
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  console.log("Test environment setup complete");
  
  return {
    tenantManager,
    mcpOrchestrator,
    retrieverEngine,
    dataIngestion,
    testTenant
  };
}

export { setupTestEnvironment };