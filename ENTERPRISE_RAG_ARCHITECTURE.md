# Enterprise RAG System Architecture

## Overview
This document outlines the redesigned architecture for Contour AI as an enterprise-grade RAG system.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Enterprise RAG System                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│  │   UI Layer      │    │  Admin Portal   │    │  Analytics      │     │
│  │ ├─ Chat UI     │    │ ├─ Tenant Mgmt  │    │ ├─ Usage Stats  │     │
│  │ ├─ Dashboard   │    │ ├─ Data Sources │    │ ├─ Performance  │     │
│  │ └─ Insights    │    │ └─ User Mgmt    │    │ └─ Monitoring   │     │
│  └─────┬───────────┘    └─────┬───────────┘    └─────┬───────────┘     │
│        │                      │                      │                 │
│        ▼                      ▼                      ▼                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    API Gateway Layer                            │   │
│  │ ├─ Authentication (OAuth, SSO, API Keys)                       │   │
│  │ ├─ Rate Limiting & Quota Control                               │   │
│  │ ├─ Tenant Isolation                                            │   │
│  │ ├─ Usage Logging                                               │   │
│  │ └─ Streaming (SSE/WebSocket)                                   │   │
│  └─────────────────────┬───────────────────────────────────────────┘   │
│                        │                                               │
│                        ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                MCP (RAG Orchestrator)                           │   │
│  │ ├─ Query Classification & Routing                               │   │
│  │ ├─ Context Construction                                         │   │
│  │ ├─ Prompt Templating & Compression                             │   │
│  │ ├─ Retrieval Re-ranking                                        │   │
│  │ └─ Plugin Management (PDF, SQL, Splunk, etc.)                 │   │
│  └─────────────────────┬───────────────────────────────────────────┘   │
│                        │                                               │
│                        ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                  Retriever Engine                               │   │
│  │ ├─ Hybrid Search (Vector + Keyword)                            │   │
│  │ ├─ Re-ranking (BGE-M3, Cohere)                                 │   │
│  │ ├─ Chunking Strategies                                         │   │
│  │ └─ Metadata Filtering                                          │   │
│  └─────────────────────┬───────────────────────────────────────────┘   │
│                        │                                               │
│                        ▼                                               │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│  │  Vector Store   │    │  Keyword Search │    │  Metadata DB    │     │
│  │ ├─ Milvus      │    │ ├─ Elasticsearch│    │ ├─ PostgreSQL   │     │
│  │ ├─ Embeddings  │    │ ├─ Full-text    │    │ ├─ Access Ctrl  │     │
│  │ └─ Similarity  │    │ └─ Filters      │    │ └─ Audit Trail  │     │
│  └─────┬───────────┘    └─────┬───────────┘    └─────┬───────────┘     │
│        │                      │                      │                 │
│        ▼                      ▼                      ▼                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Data Ingestion Layer                         │   │
│  │ ├─ PDF/Word/HTML (OCR + Chunking)                              │   │
│  │ ├─ Tables/CSV/Excel (Pandas + SQL)                             │   │
│  │ ├─ Images (Vision Models)                                      │   │
│  │ ├─ Audio/Video (Whisper ASR)                                   │   │
│  │ ├─ JSON/XML (Schema-aware parsing)                             │   │
│  │ ├─ APIs (Splunk, Confluence, etc.)                             │   │
│  │ └─ Emails/Chats (Thread-aware chunking)                       │   │
│  └─────────────────────┬───────────────────────────────────────────┘   │
│                        │                                               │
│                        ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      LLM Layer                                  │   │
│  │ ├─ Model Abstraction (GPT, Claude, Gemini, Open Models)        │   │
│  │ ├─ Prompt Engineering                                          │   │
│  │ ├─ Streaming Output                                            │   │
│  │ └─ Hallucination Detection                                     │   │
│  └─────────────────────┬───────────────────────────────────────────┘   │
│                        │                                               │
│                        ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                 Monitoring & Observability                      │   │
│  │ ├─ Logging Pipeline (Retrieval quality, LLM outputs)           │   │
│  │ ├─ Active Learning (Q&A feedback)                              │   │
│  │ ├─ Alerting (Latency, failures)                                │   │
│  │ └─ Metrics (Datadog, Prometheus)                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. UI Layer
- **Chat Interface**: Enterprise-grade conversational UI
- **Dashboard**: Analytics and insights viewer
- **Admin Portal**: Tenant and data source management

### 2. API Gateway
- **Authentication**: OAuth, SSO, API key management
- **Multi-tenancy**: Logical data isolation
- **Rate Limiting**: Per-tenant quotas
- **Streaming**: SSE/WebSocket support

### 3. MCP (RAG Orchestrator)
- **Query Routing**: Intelligent source selection
- **Context Building**: Multi-modal context assembly
- **Plugin Architecture**: Extensible data source connectors

### 4. Retriever Engine
- **Hybrid Search**: Vector + keyword combination
- **Re-ranking**: Advanced relevance scoring
- **Metadata Filtering**: Fine-grained access control

### 5. Data Ingestion
- **Multi-format Support**: PDF, Word, Images, Audio, APIs
- **Preprocessing**: OCR, chunking, metadata extraction
- **Real-time Sync**: Live data updates

### 6. Monitoring
- **Observability**: Comprehensive logging and metrics
- **Active Learning**: Feedback-driven improvements
- **Alerting**: Proactive issue detection