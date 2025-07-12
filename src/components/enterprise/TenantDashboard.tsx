import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Database, 
  Activity, 
  Settings, 
  BarChart3,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileText,
  Zap
} from 'lucide-react';
import { Tenant, UsageMetrics, SystemHealth, DataSource } from '../../types/enterprise';

interface TenantDashboardProps {
  tenant: Tenant;
  onNavigate: (section: string) => void;
}

export const TenantDashboard: React.FC<TenantDashboardProps> = ({
  tenant,
  onNavigate
}) => {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [tenant.id]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      // Load dashboard data
      const [metricsData, healthData, dataSourcesData] = await Promise.all([
        fetchUsageMetrics(tenant.id),
        fetchSystemHealth(),
        fetchDataSources(tenant.id)
      ]);
      
      setMetrics(metricsData);
      setHealth(healthData);
      setDataSources(dataSourcesData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsageMetrics = async (tenantId: string): Promise<UsageMetrics> => {
    // Mock data - replace with actual API call
    return {
      tenantId,
      period: 'current_month',
      queries: 15420,
      documents: 8750,
      storage: 2.4, // GB
      computeTime: 145.2, // hours
      apiCalls: 45230,
      costs: {
        storage: 12.50,
        compute: 87.30,
        api: 23.45,
        total: 123.25,
        currency: 'USD'
      }
    };
  };

  const fetchSystemHealth = async (): Promise<SystemHealth> => {
    // Mock data - replace with actual API call
    return {
      status: 'healthy',
      components: [
        { name: 'API Gateway', status: 'healthy', responseTime: 45 },
        { name: 'Vector Store', status: 'healthy', responseTime: 120 },
        { name: 'LLM Service', status: 'degraded', responseTime: 890, errorRate: 0.02 },
        { name: 'Search Engine', status: 'healthy', responseTime: 67 }
      ],
      lastCheck: new Date().toISOString()
    };
  };

  const fetchDataSources = async (tenantId: string): Promise<DataSource[]> => {
    // Mock data - replace with actual API call
    return [
      {
        id: '1',
        tenantId,
        name: 'Company Wiki',
        type: 'html',
        config: {},
        status: 'active',
        lastSync: '2025-01-17T10:30:00Z',
        documentsCount: 1250,
        isActive: true
      },
      {
        id: '2',
        tenantId,
        name: 'Product Documentation',
        type: 'pdf',
        config: {},
        status: 'syncing',
        lastSync: '2025-01-17T09:15:00Z',
        documentsCount: 890,
        isActive: true
      },
      {
        id: '3',
        tenantId,
        name: 'Support Tickets',
        type: 'api',
        config: {},
        status: 'error',
        lastSync: '2025-01-16T14:22:00Z',
        documentsCount: 0,
        isActive: false
      }
    ];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="text-green-500" size={20} />;
      case 'degraded':
        return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'down':
        return <AlertTriangle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-gray-500" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'syncing':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
      case 'error':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      case 'paused':
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {tenant.name} Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enterprise RAG System Overview
          </p>
        </div>
        <button
          onClick={() => onNavigate('settings')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Settings size={16} />
          Settings
        </button>
      </div>

      {/* System Health */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            System Health
          </h2>
          {health && getHealthIcon(health.status)}
        </div>
        
        {health && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {health.components.map((component, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {component.name}
                  </span>
                  {getHealthIcon(component.status)}
                </div>
                {component.responseTime && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {component.responseTime}ms response
                  </p>
                )}
                {component.errorRate && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {(component.errorRate * 100).toFixed(1)}% error rate
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Queries</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metrics?.queries.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <BarChart3 className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className="text-green-500" size={16} />
            <span className="text-sm text-green-600 dark:text-green-400 ml-1">
              +12% from last month
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Documents</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metrics?.documents.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <FileText className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className="text-green-500" size={16} />
            <span className="text-sm text-green-600 dark:text-green-400 ml-1">
              +8% from last month
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Storage</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metrics?.storage} GB
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Database className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
          </div>
          <div className="flex items-center mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {((metrics?.storage || 0) / 10 * 100).toFixed(1)}% of 10GB limit
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Cost</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${metrics?.costs.total}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <Activity className="text-yellow-600 dark:text-yellow-400" size={24} />
            </div>
          </div>
          <div className="flex items-center mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Compute: ${metrics?.costs.compute}
            </span>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Data Sources
          </h2>
          <button
            onClick={() => onNavigate('data-sources')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
          >
            Manage All
          </button>
        </div>

        <div className="space-y-3">
          {dataSources.map((source) => (
            <div key={source.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Database className="text-blue-600 dark:text-blue-400" size={16} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {source.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {source.documentsCount.toLocaleString()} documents
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(source.status)}`}>
                  {source.status}
                </span>
                {source.lastSync && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Last sync: {new Date(source.lastSync).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => onNavigate('users')}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-blue-600 dark:text-blue-400" size={24} />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Manage Users
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add, remove, and configure user permissions
          </p>
        </button>

        <button
          onClick={() => onNavigate('security')}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-green-600 dark:text-green-400" size={24} />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Security Settings
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure access controls and audit settings
          </p>
        </button>

        <button
          onClick={() => onNavigate('analytics')}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <Zap className="text-purple-600 dark:text-purple-400" size={24} />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Performance Analytics
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            View detailed usage and performance metrics
          </p>
        </button>
      </div>
    </div>
  );
};