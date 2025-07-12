// Enterprise RAG System Types

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSettings {
  maxUsers: number;
  maxDocuments: number;
  maxQueries: number;
  retentionDays: number;
  allowedDataSources: DataSourceType[];
  customBranding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export interface User {
  id: string;
  tenantId: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  lastLogin?: string;
  createdAt: string;
}

export type UserRole = 'admin' | 'user' | 'viewer' | 'analyst';

export interface Permission {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

export interface DataSource {
  id: string;
  tenantId: string;
  name: string;
  type: DataSourceType;
  config: DataSourceConfig;
  status: DataSourceStatus;
  lastSync?: string;
  createdAt: string;
  updatedAt: string;
}

export type DataSourceType = 
  | 'pdf' 
  | 'word' 
  | 'html' 
  | 'csv' 
  | 'excel' 
  | 'json' 
  | 'xml' 
  | 'api' 
  | 'database' 
  | 'email' 
  | 'chat' 
  | 'image' 
  | 'audio' 
  | 'video';

export interface DataSourceConfig {
  endpoint?: string;
  credentials?: Record<string, string>;
  syncSchedule?: string;
  filters?: Record<string, any>;
  preprocessing?: PreprocessingConfig;
}

export interface PreprocessingConfig {
  chunkSize: number;
  chunkOverlap: number;
  extractMetadata: boolean;
  ocrEnabled?: boolean;
  languageDetection?: boolean;
}

export type DataSourceStatus = 'active' | 'inactive' | 'syncing' | 'error';

export interface Document {
  id: string;
  tenantId: string;
  dataSourceId: string;
  title: string;
  content: string;
  metadata: DocumentMetadata;
  chunks: DocumentChunk[];
  embedding?: number[];
  accessControl: AccessControl;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentMetadata {
  source: string;
  author?: string;
  createdDate?: string;
  modifiedDate?: string;
  fileType: string;
  fileSize?: number;
  language?: string;
  tags: string[];
  customFields: Record<string, any>;
}

export interface DocumentChunk {
  id: string;
  content: string;
  embedding: number[];
  metadata: ChunkMetadata;
  startIndex: number;
  endIndex: number;
}

export interface ChunkMetadata {
  chunkIndex: number;
  pageNumber?: number;
  section?: string;
  subsection?: string;
  confidence: number;
}

export interface AccessControl {
  visibility: 'public' | 'private' | 'restricted';
  allowedUsers: string[];
  allowedRoles: UserRole[];
  allowedGroups: string[];
}

export interface Query {
  id: string;
  tenantId: string;
  userId: string;
  text: string;
  intent: QueryIntent;
  context: QueryContext;
  results: QueryResult[];
  feedback?: QueryFeedback;
  createdAt: string;
}

export interface QueryIntent {
  type: 'search' | 'question' | 'summarize' | 'analyze' | 'compare';
  confidence: number;
  entities: string[];
  filters: Record<string, any>;
}

export interface QueryContext {
  conversationId?: string;
  previousQueries: string[];
  userPreferences: Record<string, any>;
  sessionData: Record<string, any>;
}

export interface QueryResult {
  documentId: string;
  chunkId: string;
  content: string;
  score: number;
  relevanceScore: number;
  metadata: DocumentMetadata;
  highlights: string[];
}

export interface QueryFeedback {
  rating: number; // 1-5
  helpful: boolean;
  comments?: string;
  corrections?: string;
  timestamp: string;
}

export interface MCPPlugin {
  id: string;
  name: string;
  version: string;
  type: DataSourceType;
  description: string;
  config: PluginConfig;
  status: 'active' | 'inactive' | 'error';
  capabilities: PluginCapability[];
}

export interface PluginConfig {
  endpoint?: string;
  authentication?: AuthConfig;
  parameters: Record<string, any>;
  timeout: number;
  retryPolicy: RetryPolicy;
}

export interface AuthConfig {
  type: 'none' | 'api_key' | 'oauth' | 'basic' | 'bearer';
  credentials: Record<string, string>;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential';
  initialDelay: number;
}

export type PluginCapability = 
  | 'search' 
  | 'ingest' 
  | 'transform' 
  | 'analyze' 
  | 'summarize' 
  | 'extract';

export interface EmbeddingModel {
  id: string;
  name: string;
  provider: 'openai' | 'huggingface' | 'cohere' | 'custom';
  dimensions: number;
  maxTokens: number;
  config: ModelConfig;
}

export interface ModelConfig {
  apiKey?: string;
  endpoint?: string;
  model: string;
  parameters: Record<string, any>;
}

export interface LLMModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'local' | 'custom';
  type: 'chat' | 'completion' | 'instruct';
  config: ModelConfig;
  capabilities: LLMCapability[];
}

export type LLMCapability = 
  | 'chat' 
  | 'completion' 
  | 'summarization' 
  | 'analysis' 
  | 'code_generation' 
  | 'translation';

export interface UsageMetrics {
  tenantId: string;
  userId?: string;
  period: string; // ISO date
  queries: number;
  documents: number;
  tokens: number;
  costs: number;
  latency: {
    avg: number;
    p95: number;
    p99: number;
  };
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  components: ComponentHealth[];
  lastCheck: string;
}

export interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
  errorRate?: number;
  message?: string;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}