import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Database, 
  Activity, 
  Settings, 
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Tenant, DataSource, Metric, Alert } from '../../types/enterprise';

interface TenantDashboardProps {
  currentUser: any;
}

export const TenantDashboard: React.FC<TenantDashboardProps> = ({ currentUser }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'sources' | 'monitoring'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load mock data - replace with actual API calls
      const mockTenants: Tenant[] = [
        {
          id: 'tenant-1',
          name: 'Acme Corporation',
          domain: 'acme.com',
          settings: {
            maxUsers: 100,
            maxDocuments: 10000,
            maxQueries: 50000,
            dataRetentionDays: 365,
            allowedDataSources: ['pdf', 'word', 'excel', 'api'],
            customBranding: {
              logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop',
              primaryColor: '#3B82F6',
              secondaryColor: '#1E40AF',
              companyName: 'Acme Corp'
            }
          },
          subscription: {
            tier: 'enterprise',
            features: ['advanced-analytics', 'custom-models', 'priority-support'],
            limits: {
              maxStorageGB: 1000,
              maxQueriesPerMonth: 100000,
              maxConcurrentUsers: 50,
              maxDataSources: 20
            },
            billing: {
              currency: 'USD',
              billingCycle: 'monthly',
              paymentMethod: { type: 'card', details: {} },
              invoiceEmail: 'billing@acme.com'
            }
          },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-12-01T15:30:00Z'
        },
        {
          id: 'tenant-2',
          name: 'TechStart Inc',
          domain: 'techstart.io',
          settings: {
            maxUsers: 25,
            maxDocuments: 5000,
            maxQueries: 10000,
            dataRetentionDays: 180,
            allowedDataSources: ['pdf', 'word', 'json']
          },
          subscription: {
            tier: 'professional',
            features: ['basic-analytics', 'standard-support'],
            limits: {
              maxStorageGB: 100,
              maxQueriesPerMonth: 25000,
              maxConcurrentUsers: 15,
              maxDataSources: 10
            },
            billing: {
              currency: 'USD',
              billingCycle: 'monthly',
              paymentMethod: { type: 'card', details: {} },
              invoiceEmail: 'admin@techstart.io'
            }
          },
          createdAt: '2024-03-20T14:00:00Z',
          updatedAt: '2024-11-28T09:15:00Z'
        }
      ];

      const mockDataSources: DataSource[] = [
        {
          id: 'ds-1',
          tenantId: 'tenant-1',
          name: 'Company Knowledge Base',
          type: 'pdf',
          config: {
            ingestion: {
              chunkSize: 1000,
              chunkOverlap: 200,
              extractMetadata: true,
              ocrEnabled: true,
              languageDetection: true,
              filters: []
            }
          },
          status: 'active',
          lastSync: '2024-12-01T12:00:00Z',
          documentsCount: 1250,
          sizeBytes: 524288000,
          createdAt: '2024-01-20T10:00:00Z',
          updatedAt: '2024-12-01T12:00:00Z'
        },
        {
          id: 'ds-2',
          tenantId: 'tenant-1',
          name: 'Confluence Wiki',
          type: 'confluence',
          config: {
            connection: {
              url: 'https://acme.atlassian.net',
              credentials: { type: 'api_key', value: '***' }
            },
            schedule:I'll redesign the Contour AI application to meet your enterprise RAG system requirements. This is a comprehensive transformation that will involve restructuring the entire architecture.

<boltArtifact id="enterprise-rag-redesign" title="Enterprise RAG System Redesign">