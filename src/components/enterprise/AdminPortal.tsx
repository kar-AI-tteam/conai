import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Database, 
  Settings, 
  BarChart3, 
  Shield, 
  Globe, 
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { Tenant, User, DataSource, UsageMetrics, IngestionJob } from '../../types/enterprise';

interface AdminPortalProps {
  currentUser: User;
  tenant: Tenant;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ currentUser, tenant }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'datasources' | 'analytics' | 'settings'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load data based on active tab
      switch (activeTab) {
        case 'overview':
          await Promise.all([
            loadMetrics(),
            loadRecentJobs(),
            loadDataSources()
          ]);
          break;
        case 'users':
          await loadUsers();
          break;
        case 'datasources':
          await loadDataSources();
          break;
        case 'analytics':
          await loadMetrics();
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    // Mock data - replace with actual API call
    setUsers([
      {
        id: '1',
        tenantId: tenant.id,
        organizationId: 'org1',
        email: 'admin@company.com',
        name: 'Admin User',
        role: 'admin',
        permissions: ['read', 'write', 'admin'],
        isActive: true
      },
      {
        id: '2',
        tenantId: tenant.id,
        organizationId: 'org1',
        email: 'user@company.com',
        name: 'Regular User',
        role: 'user',
        permissions: ['read'],
        isActive: true
      }
    ]);
  };

  const loadDataSources = async () => {
    // Mock data - replace with actual API call
    setDataSources([
      {
        id: '1',
        tenantId: tenant.id,
        organizationId: 'org1',
        name: 'Company Documents',
        type: 'pdf',
        config: {},
        status: 'active',
        documentCount: 1250,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z'
      },
      {
        id: '2',
        tenantId: tenant.id,
        organizationId: 'org1',
        name: 'Confluence Wiki',
        type: 'confluence',
        config: {},
        status: 'syncing',
        documentCount: 850,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-20T14:00:00Z'
      }
    ]);
  };

  const loadRecentJobs = async () => {
    // Mock data - replace with actual API call
    setJobs([
      {
        id: '1',
        tenantId: tenant.id,
        dataSourceId: '1',
        status: 'completed',
        progress: 100,
        documentsProcessed: 125,
        documentsTotal: 125,
        errors: [],
        startedAt: '2024-01-20T14:00:00Z',
        completedAt: '2024-01-20T14:15:00Z'
      },
      {
        id: '2',
        tenantId: tenant.id,
        dataSourceId: '2',
        status: 'running',
        progress: 65,
        documentsProcessed: 55,
        documentsTotal: 85,
        errors: [],
        startedAt: '2024-01-20T15:00:00Z'
      }
    ]);
  };

  const loadMetrics = async () => {
    // Mock data - replace with actual API call
    setMetrics({
      tenantId: tenant.id,
      organizationId: 'org1',
      period: '2024-01-20',
      queries: 1250,
      documents: 2100,
      users: 25,
      apiCalls: 5600,
      storageUsed: 1024 * 1024 * 1024 * 2.5, // 2.5 GB
      computeTime: 45000 // 45 seconds
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'syncing':
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Queries</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metrics?.queries.toLocaleString() || '0'}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Documents</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metrics?.documents.toLocaleString() || '0'}
              </p>
            </div>
            <Database className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metrics?.users || '0'}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Storage Used</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metrics ? formatBytes(metrics.storageUsed) : '0 GB'}
              </p>
            </div>
            <Database className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Ingestion Jobs</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-I'll redesign the Contour AI application to meet your enterprise RAG system requirements. This is a comprehensive transformation that will involve restructuring the entire architecture.

<boltArtifact id="enterprise-rag-redesign" title="Enterprise RAG System Redesign">