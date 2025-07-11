import React from 'react';
import { ArrowLeft, FileJson, Bot, Image as ImageIcon, BookOpen, Code2, Sparkles, Database, Brain, Webhook, TableProperties, Search, Zap, Gauge, Shield, Eye, History, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Documentation() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Back to Chat</span>
            </Link>
            <div className="flex items-center gap-2">
              <FileJson className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                DocQ Architecture
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose dark:prose-invert max-w-none">
          <h1>DocQ Architecture Overview</h1>
          
          <h2 className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Core Architecture
          </h2>

          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 my-6 overflow-x-auto">
            <pre className="text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-pre" style={{ lineHeight: '1.2' }}>
{`┌─────────────────────────────────────────────────────────────────────────┐
│                           DocQ Application                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│  │   Frontend UI   │    │  State Manager  │    │  Theme Provider  │     │
│  │   (React/Vite)  │◄──►│  (React Context)│◄──►│  (Dark/Light)   │     │
│  └────────┬────────┘    └────────┬────────┘    └─────────────────┘     │
│           │                       │                                      │
│           ▼                       ▼                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│  │   Components    │    │  Storage Manager │    │   API Handler   │     │
│  │ ├─ Chat        │◄──►│  ├─ LocalStorage │◄──►│   (REST APIs)   │     │
│  │ ├─ QA Manager  │    │  ├─ OpenSearch   │    └─────────────────┘     │
│  │ └─ UI Controls │    │  └─ Milvus       │                            │
│  └────────┬────────┘    └────────┬────────┘                            │
│           │                       │                                      │
│           ▼                       ▼                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│  │   Chat Modes    │    │  Search Engine  │    │  File Handlers  │     │
│  │ ├─ Knowledge   │◄──►│  (Local/Vector) │◄──►│ ├─ PDF          │     │
│  │ ├─ AI          │    └─────────────────┘    │ ├─ Word         │     │
│  │ └─ Hybrid      │                           │ ├─ Text         │     │
│  └────────┬────────┘                          │ └─ Image (OCR)  │     │
│           │                                    └─────────────────┘     │
│           ▼                                                            │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│  │   AI Services   │    │ Security Layer  │    │  Data Handlers  │     │
│  │ ├─ OpenAI      │◄──►│ ├─ PII Masking  │◄──►│ ├─ Markdown     │     │
│  │ └─ Local LLM   │    │ └─ Sanitization │    │ └─ JSON         │     │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         External Services                                │
├──────────────────┬──────────────────┬──────────────────┬───────────────┤
│    OpenAI API    │    OpenSearch    │  Milvus/Zilliz   │    Ollama     │
│  (GPT/Embeddings)│  (Vector Search) │  (Vector Store)  │  (Local LLM)  │
└──────────────────┴──────────────────┴──────────────────┴───────────────┘`}</pre>
          </div>

          <h2 className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Key Components
          </h2>

          <h3>1. Frontend Layer</h3>
          <ul>
            <li><strong>UI Components:</strong> React-based modular components</li>
            <li><strong>State Management:</strong> React Context for global state</li>
            <li><strong>Theme System:</strong> Dark/light mode with Tailwind CSS</li>
          </ul>

          <h3>2. Storage Layer</h3>
          <ul>
            <li><strong>Storage Manager:</strong> Unified interface for multiple storage backends</li>
            <li><strong>Providers:</strong>
              <ul>
                <li>LocalStorage: Browser-based storage</li>
                <li>OpenSearch: Cloud vector search</li>
                <li>Milvus: Vector database for embeddings</li>
              </ul>
            </li>
          </ul>

          <h3>3. Chat System</h3>
          <ul>
            <li><strong>Knowledge Base Mode:</strong> Direct Q&A from stored entries</li>
            <li><strong>AI Assistant Mode:</strong> Pure AI responses using OpenAI</li>
            <li><strong>Knowledge Base + AI Mode:</strong> Hybrid responses combining both</li>
          </ul>

          <h3>4. Search Engine</h3>
          <ul>
            <li><strong>Local Search:</strong> In-memory search with relevance scoring</li>
            <li><strong>Vector Search:</strong> Semantic search using embeddings</li>
            <li><strong>Hybrid Search:</strong> Combined keyword and semantic search</li>
          </ul>

          <h2 className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Security Features
          </h2>

          <ul>
            <li><strong>PII Detection & Masking:</strong> Automatic detection and masking of sensitive data</li>
            <li><strong>Input Sanitization:</strong> XSS prevention and content security</li>
            <li><strong>Secure Storage:</strong> Encrypted storage options</li>
          </ul>

          <h2 className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Performance Features
          </h2>

          <ul>
            <li><strong>Response Streaming:</strong> Real-time streaming of AI responses</li>
            <li><strong>Lazy Loading:</strong> On-demand component and data loading</li>
            <li><strong>Caching:</strong> Local caching of frequently accessed data</li>
          </ul>

          <h2 className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            AI Integration
          </h2>

          <ul>
            <li><strong>OpenAI Integration:</strong>
              <ul>
                <li>GPT-3.5 for text generation</li>
                <li>Text embeddings for semantic search</li>
              </ul>
            </li>
            <li><strong>Local LLM Support:</strong>
              <ul>
                <li>Ollama integration for local inference</li>
                <li>Llama2 model support</li>
              </ul>
            </li>
          </ul>

          <h2 className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            File Processing
          </h2>

          <ul>
            <li><strong>Document Processing:</strong>
              <ul>
                <li>PDF text extraction</li>
                <li>Word document parsing</li>
                <li>Plain text processing</li>
              </ul>
            </li>
            <li><strong>Image Processing:</strong>
              <ul>
                <li>OCR for text extraction</li>
                <li>Image format handling</li>
              </ul>
            </li>
          </ul>

          <h2 className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            API Integration
          </h2>

          <ul>
            <li><strong>API Handler:</strong> Unified interface for external API calls</li>
            <li><strong>Authentication:</strong> Token-based auth support</li>
            <li><strong>Error Handling:</strong> Robust error handling and retry logic</li>
          </ul>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-lg p-4 my-6">
            <h3 className="text-blue-800 dark:text-blue-200 mt-0">Data Flow</h3>
            <ol className="text-blue-700 dark:text-blue-300 mb-0">
              <li>User inputs query through the chat interface</li>
              <li>Query is processed by the appropriate chat mode handler</li>
              <li>Storage manager retrieves relevant knowledge base entries</li>
              <li>AI services generate or enhance responses if needed</li>
              <li>Response is streamed back to the user interface</li>
              <li>All interactions are processed through security layer</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}