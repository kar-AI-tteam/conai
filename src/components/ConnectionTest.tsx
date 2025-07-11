import React, { useState } from 'react';
import { Database, Cloud, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { testOpenSearchConnection } from '../utils/openSearchTest';
import { storageManager } from '../utils/storage/storageManager';

export const ConnectionTest: React.FC = () => {
  const [isTestingMilvus, setIsTestingMilvus] = useState(false);
  const [isTestingOpenSearch, setIsTestingOpenSearch] = useState(false);
  const [milvusStatus, setMilvusStatus] = useState<{ success: boolean; message?: string } | null>(null);
  const [openSearchStatus, setOpenSearchStatus] = useState<{ success: boolean; message?: string } | null>(null);

  const testMilvusConnection = async () => {
    setIsTestingMilvus(true);
    setMilvusStatus(null);
    
    try {
      const milvusProvider = storageManager.getAvailableProviders().find(p => p.name === 'Vector DB');
      if (!milvusProvider) {
        throw new Error('Milvus provider not found');
      }

      const isAvailable = await milvusProvider.isAvailable();
      setMilvusStatus({
        success: isAvailable,
        message: isAvailable ? 'Successfully connected to Milvus' : 'Failed to connect to Milvus'
      });
    } catch (error) {
      setMilvusStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test Milvus connection'
      });
    } finally {
      setIsTestingMilvus(false);
    }
  };

  const testOpenSearchConnection = async () => {
    setIsTestingOpenSearch(true);
    setOpenSearchStatus(null);
    
    try {
      const result = await testOpenSearchConnection();
      setOpenSearchStatus({
        success: result.success,
        message: result.message
      });
    } catch (error) {
      setOpenSearchStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test OpenSearch connection'
      });
    } finally {
      setIsTestingOpenSearch(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
        Connection Status
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Milvus Connection Test */}
        <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-500 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Milvus Connection
              </span>
            </div>
            <button
              onClick={testMilvusConnection}
              disabled={isTestingMilvus}
              className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTestingMilvus ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin" />
                  Testing...
                </div>
              ) : (
                'Test Connection'
              )}
            </button>
          </div>

          {milvusStatus && (
            <div className={`flex items-start gap-2 text-sm ${
              milvusStatus.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {milvusStatus.success ? (
                <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle size={16} className="flex-shrink-0 mt-0.5" />
              )}
              <span>{milvusStatus.message}</span>
            </div>
          )}
        </div>

        {/* OpenSearch Connection Test */}
        <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                OpenSearch Connection
              </span>
            </div>
            <button
              onClick={testOpenSearchConnection}
              disabled={isTestingOpenSearch}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTestingOpenSearch ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin" />
                  Testing...
                </div>
              ) : (
                'Test Connection'
              )}
            </button>
          </div>

          {openSearchStatus && (
            <div className={`flex items-start gap-2 text-sm ${
              openSearchStatus.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {openSearchStatus.success ? (
                <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle size={16} className="flex-shrink-0 mt-0.5" />
              )}
              <span>{openSearchStatus.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};