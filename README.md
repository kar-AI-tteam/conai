# Contour AI - Enterprise RAG System

A modern, feature-rich AI-powered knowledge base chat application with enterprise-grade Retrieval Augmented Generation capabilities.

![Contour AI Screenshot](https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=1000)

## 🚀 Features

### Chat Modes
- 💬 **Knowledge Base Mode**
  - Fast, precise answers from curated knowledge base
  - Relevance scoring and match highlighting
  - Fuzzy matching for better results
  
- 🧠 **Knowledge Base + AI Mode**
  - Combines knowledge base matches with AI synthesis
  - Context-aware responses
  - Natural language understanding
  
- ✨ **AI Assistant Mode**
  - Pure AI-powered responses using OpenAI's GPT model
  - General knowledge and creative tasks
  - Natural conversation flow

- 🖥️ **Local LLM Mode**
  - Runs entirely locally using Ollama with Llama3
  - No data sent to external services
  - Privacy-focused for sensitive information

### Enterprise RAG Framework
- 🏢 **Multi-Tenant Architecture**
  - Logical data isolation between tenants
  - Tenant-specific configurations and quotas
  - Role-based access control

- 🔍 **Advanced Retrieval**
  - Hybrid search (vector + keyword)
  - Re-ranking for improved relevance
  - Metadata filtering and faceted search

- 📊 **Admin Dashboard**
  - Usage metrics and analytics
  - System health monitoring
  - Tenant management

- 🔄 **MCP Orchestrator**
  - Query classification and routing
  - Context construction
  - Prompt templating and compression

### Core Features
- 📝 Rich text editing with Markdown support
- 📊 Interactive table builder
- 🔌 API configuration management
- 🔍 Advanced search with relevance scoring
- 📱 Responsive design for all devices
- 🌙 Dark/Light theme support
- 🔄 Real-time streaming responses
- 📦 Import/Export functionality

### Privacy & Security
- 🛡️ Automatic PII detection and masking
- 🔒 Full masking for sensitive data
- 👁️ Partial masking for semi-sensitive data
- 🔐 Regular numbers and non-sensitive data remain visible
- 🧠 Advanced hallucination detection and mitigation

## 🛠️ Tech Stack

### Core Technologies
- **React 18.3.1** with TypeScript
- **Vite 5.4.2** for fast development and optimized builds
- **Tailwind CSS 3.4.1** for utility-first styling

### Key Libraries
- **@monaco-editor/react**: Code editor component
- **lucide-react**: Modern icon library
- **marked**: Markdown parsing and rendering
- **openai**: OpenAI API integration
- **react-pdf**: PDF file handling
- **tesseract.js**: OCR for image text extraction
- **@zilliz/milvus2-sdk-node**: Vector database client

### Storage Options
- **LocalStorage**: Browser-based storage
- **OpenSearch**: Cloud vector search
- **Milvus/Zilliz**: Vector database for embeddings

## 📋 Prerequisites 

- Node.js 18+
- npm or yarn
- OpenAI API key (for AI features)
- Ollama (for local LLM mode)

## 🏃‍♂️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🧪 Testing

The Enterprise RAG framework includes a comprehensive test suite:

```bash
# Run all tests
npm run test

# Run specific test categories
npm run test:ingestion
npm run test:retrieval
npm run test:multitenancy
npm run test:performance
```

## 🚀 Deployment

### AWS S3 Deployment

```bash
# Deploy to S3
npm run deploy:s3
```

## 📦 Project Structure

```
contour-ai/
├── src/
│   ├── components/       # React components
│   │   ├── chat/         # Chat-specific components
│   │   ├── controls/     # Reusable UI controls
│   │   ├── enterprise/   # Enterprise RAG components
│   │   └── qa/           # Q&A management components
│   ├── context/          # React context providers
│   ├── layouts/          # Page layouts
│   ├── pages/            # Page components
│   ├── services/         # Enterprise RAG services
│   │   ├── mcpOrchestrator.ts
│   │   ├── retrieverEngine.ts
│   │   ├── dataIngestion.ts
│   │   ├── tenantService.ts
│   │   ├── LLMService.ts
│   │   └── pluginManager.ts
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── test/                 # Test suite
│   ├── testConfig.js     # Test configuration
│   ├── testSetup.js      # Test environment setup
│   ├── testRunner.js     # Main test runner
│   ├── ingestionTests.js # Data ingestion tests
│   ├── retrievalTests.js # Retrieval engine tests
│   └── testReporting.js  # Test reporting utilities
└── scripts/              # Deployment scripts
```

## 🧠 Hallucination Detection

Contour AI implements a sophisticated hallucination detection system:

### Detection Strategies
- **Factual Consistency**: Detects uncertain language and speculation
- **Context Adherence**: Ensures responses stay within knowledge base context
- **Confidence Level**: Flags responses with low AI confidence
- **Source Attribution**: Detects unsupported claims
- **Internal Consistency**: Identifies contradictory statements

### Mitigation Techniques
- **Confidence Filtering**: Adds appropriate warnings based on confidence level
- **Source Attribution**: Automatically adds source references
- **Uncertainty Quantification**: Clearly indicates confidence levels

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.