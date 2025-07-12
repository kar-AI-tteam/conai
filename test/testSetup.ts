// Test Environment Setup

import { TEST_CONFIG } from './testConfig';
import { MCPOrchestrator } from '../src/services/mcpOrchestrator';
import { RetrieverEngine } from '../src/services/retrieverEngine';
import { DataIngestionService } from '../src/services/dataIngestion';
import { TenantManager } from '../src/services/tenantManager';
import { LLMService } from '../src/services/LLMService';
import { PluginManager } from '../src/services/pluginManager';
import { VectorStore } from '../src/services/vectorStore';
import { KeywordSearch } from '../src/services/keywordSearch';
import { MetadataFilter } from '../src/services/metadataFilter';
import { Tenant } from '../src/types/enterprise';

export interface TestEnvironment {
  tenantManager: TenantManager;
  mcpOrchestrator: MCPOrchestrator;
  retrieverEngine: RetrieverEngine;
  dataIngestion: DataIngestionService;
  llmService: LLMService;
  pluginManager: PluginManager;
  testTenant: Tenant;
}

export async function setupTestEnvironment(): Promise<TestEnvironment> {
  // Initialize core services
  const tenantManager = new TenantManager();
  const vectorStore = new VectorStore();
  const keywordSearch = new KeywordSearch();
  const metadataFilter = new MetadataFilter();
  const llmService = new LLMService();
  const pluginManager = new PluginManager();
  
  // Initialize retriever engine
  const retrieverEngine = new RetrieverEngine(
    vectorStore,
    keywordSearch,
    metadataFilter
  );
  
  // Initialize MCP orchestrator
  const mcpOrchestrator = new MCPOrchestrator(
    retrieverEngine,
    llmService,
    pluginManager
  );
  
  // Initialize data ingestion service
  const dataIngestion = new DataIngestionService();
  
  // Create test tenant
  const testTenant: Tenant = {
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
  
  // Register test tenant
  await tenantManager.createTenant(testTenant);
  
  return {
    tenantManager,
    mcpOrchestrator,
    retrieverEngine,
    dataIngestion,
    llmService,
    pluginManager,
    testTenant
  };
}