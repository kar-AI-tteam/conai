import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Database, 
  Activity, 
  Settings, 
  BarChart3, 
  Shield, 
  AlertTriangle,
  TrendingUp,
  Server,
  Clock,
  DollarSign,
  FileText,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Tenant {
  id: string;
  name: string;
  domain: string;
  settings: {
    maxUsers: number;
    maxDocuments: number;
    maxQueries: number;
    retentionDays: number;
    allowedDataSources: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface TenantManager {
  getUsageMetrics: (tenantId: string, period: string) => Promise<any>;
}

interface AdminDashboardProps {
  currentTenant: Tenant;
  tenantManager: TenantManager;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentTenant,
  tenantManager
}) => {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [currentTenant.id]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [metricsData, alertsData] = await Promise.all([
        tenantManager.getUsageMetrics(currentTenant.id, 'current'),
        loadAlerts()
      ]);
      
      setMetrics(metricsData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlerts = async (): Promise<any[]> => {
    // Mock alerts - in real implementation, fetch from monitoring service
    return [
      {
        id: '1',
        tenantId: currentTenant.id,
        type: 'performance',
        severity: 'medium',
        message: 'Query response time increased by 15%',
        details: { avgResponseTime: '1.2s' },
        isResolved: false,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        tenantId: currentTenant.id,
        type: 'quota',
        severity: 'high',
        message: 'Document storage at 85% capacity',
        details: { usage: '85%', limit: '5000 documents' },
        isResolved: false,
        createdAt: new Date().toISOString()
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with back button */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {currentTenant.name} • Enterprise RAG System
            </p>
          </div>
          <Link 
            to="/"
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Chat</span>
          </Link>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Active Alerts ({alerts.length})
              </h3>
            </div>
            <div className="space-y-2">
              {alerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between text-sm">
                  <span className="text-yellow-700 dark:text-yellow-300">{alert.message}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    alert.severity === 'high' 
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <MetricCard
              title="Total Queries"
              value={metrics.queries.toLocaleString()}
              icon={Activity}
              trend="+12%"
              trendUp={true}
            />
            <MetricCard
              title="Documents"
              value={metrics.documents.toLocaleString()}
              icon={FileText}
              trend="+5%"
              trendUp={true}
            />
            <MetricCard
              title="Tokens Used"
              value={metrics.tokens.toLocaleString()}
              icon={Database}
              trend="+8%"
              trendUp={true}
            />
            <MetricCard
              title="Monthly Cost"
              value={`$${metrics.costs.toFixed(2)}`}
              icon={DollarSign}
              trend="-3%"
              trendUp={false}
            />
          </div>
        )}

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Usage Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Query Volume
              </h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chart visualization would go here</p>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Performance
              </h3>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <PerformanceMetric
                label="Avg Response Time"
                value={`${metrics?.latency?.avg || 0}ms`}
                target="< 500ms"
                status="good"
              />
              <PerformanceMetric
                label="P95 Latency"
                value={`${metrics?.latency?.p95 || 0}ms`}
                target="< 1000ms"
                status="good"
              />
              <PerformanceMetric
                label="Query Success Rate"
                value="99.2%"
                target="> 99%"
                status="good"
              />
              <PerformanceMetric
                label="Hallucination Rate"
                value="2.1%"
                target="< 5%"
                status="good"
              />
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              System Status
            </h3>
            <Server className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SystemStatus
              component="Vector Database"
              status="operational"
              uptime="99.9%"
            />
            <SystemStatus
              component="Search Engine"
              status="operational"
              uptime="99.8%"
            />
            <SystemStatus
              component="LLM Service"
              status="operational"
              uptime="99.7%"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  trend: string;
  trendUp: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, trend, trendUp }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      </div>
      <Icon className="h-8 w-8 text-gray-400" />
    </div>
    <div className="mt-4 flex items-center">
      <span className={`text-sm font-medium ${
        trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      }`}>
        {trend}
      </span>
      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs last month</span>
    </div>
  </div>
);

interface PerformanceMetricProps {
  label: string;
  value: string;
  target: string;
  status: 'good' | 'warning' | 'error';
}

const PerformanceMetric: React.FC<PerformanceMetricProps> = ({ label, value, target, status }) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">Target: {target}</p>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</span>
      <div className={`w-3 h-3 rounded-full ${
        status === 'good' ? 'bg-green-500' :
        status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
      }`} />
    </div>
  </div>
);

interface SystemStatusProps {
  component: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: string;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ component, status, uptime }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <div>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{component}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">Uptime: {uptime}</p>
    </div>
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      status === 'operational' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
      status === 'degraded' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    }`}>
      {status}
    </span>
  </div>
);