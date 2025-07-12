// Test Configuration

export const TEST_CONFIG = {
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
  ],
  
  // LLM configuration
  llm: {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.1
  }
};