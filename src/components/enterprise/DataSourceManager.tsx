import React, { useState, useEffect } from 'react';
import {
  Plus,
  Database,
  FileText,
  Globe,
  Mail,
  Image,
  Music,
  Video,
  Code,
  Settings,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
  RefreshCw
} from 'lucide-react';
import { DataSource, DataSourceType, PreprocessingConfig } from '../../types/enterprise';

interface DataSourceManagerProps {
  tenantId: string;
  onBack: () => void;
}

export const DataSourceManager: React.FC<DataSourceManagerProps> = ({
  tenantId,
  onBack
}) => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);

  useEffect(() => {
    loadDataSources();
  }, [tenantId]);

  const loadDataSources = async () => {
    try {
      setIsLoading(true);
      // Mock data - replace with actual API call
      const sources: DataSource[] = [
        {
          id: '1',
          tenantId,
          name: 'Company Wiki',
          type: 'html',
          config: {
            connectionString: 'https://wiki.company.com',
            syncSchedule: '0 2 * * *', // Daily at 2 AM
            preprocessing: {
              chunkSize: 1000,
              chunkOverlap: 200,
              extractMetadata: true,
              ocrEnabled: false,
              languageDetection: true
            }
          },
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
          config: {
            connectionString: '/documents/products/',
            preprocessing: {
              chunkSize: 800,
              chunkOverlap: 150,
              extractMetadata: true,
              ocrEnabled: true,
              languageDetection: true
            }
          },
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
          config: {
            connectionString: 'https://api.zendesk.com/v2',
            apiKey: '***hidden***',
            syncSchedule: '0 */6 * * *', // Every 6 hours
            preprocessing: {
              chunkSize: 500,
              chunkOverlap: 100,
              extractMetadata: true,
              ocrEnabled: false,
              languageDetection: true
            }
          },
          status: 'error',
          lastSync: '2025-01-16T14:22:00Z',
          documentsCount: 0,
          isActive: false
        }
      ];
      setDataSources(sources);
    } catch (error) {
      console.error('Failed to load data sources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDataSourceIcon = (type: DataSourceType) => {
    const iconMap = {
      pdf: FileText,
      word: FileText,
      html: Globe,
      csv: Database,
      excel: Database,
      json: Code,
      xml: Code,
      api: Globe,
      database: Database,
      email: Mail,
      chat: Mail,
      image: Image,
      audio: Music,
      video: Video
    };
    
    const Icon = iconMap[type] || Database;
    return <Icon size={20} />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="text-green-500" size={16} />;
      case 'syncing':
        return <RefreshCw className="text-blue-500 animate-spin" size={16} />;
      case 'error':
        return <AlertTriangle className="text-red-500" size={16} />;
      case 'paused':
        return <Pause className="text-gray-500" size={16} />;
      default:
        return <Clock className="text-gray-500" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-I'll redesign the Contour AI application to meet your enterprise RAG system requirements. This is a comprehensive transformation that will involve restructuring the entire architecture.

<boltArtifact id="enterprise-rag-redesign" title="Enterprise RAG System Redesign">