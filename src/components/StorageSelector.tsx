import React, { useState, useEffect } from 'react';
import { Database, Cloud } from 'lucide-react';
import { StorageType } from '../utils/storage/types';
import { storageManager } from '../utils/storage/storageManager';

interface StorageSelectorProps {
  onStorageChange: (type: StorageType) => void;
}

export const StorageSelector: React.FC<StorageSelectorProps> = ({ onStorageChange }) => {
  const [selectedType, setSelectedType] = useState<StorageType>(
    storageManager.getConfig().type
  );
  const [providers, setProviders] = useState(storageManager.getAvailableProviders());
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    // Add listener for storage type changes
    const removeListener = storageManager.addListener((type) => {
      setSelectedType(type);
    });

    return () => removeListener();
  }, []);

  const handleStorageChange = async (type: StorageType) => {
    if (type === selectedType || isChanging) return;

    setIsChanging(true);
    try {
      await storageManager.setProvider(type);
      onStorageChange(type);
    } catch (error) {
      console.error('Error changing storage provider:', error);
      // Revert to previous selection on error
      setSelectedType(storageManager.getConfig().type);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <button
        onClick={() => handleStorageChange('localStorage')}
        disabled={isChanging}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
          ${selectedType === 'localStorage'
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'}
          ${isChanging ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title={`Local Storage${isChanging ? ' (Changing storage...)' : ''}`}
      >
        <Database size={16} className={isChanging ? 'animate-pulse' : ''} />
        <span>Local Storage</span>
      </button>

      <button
        onClick={() => handleStorageChange('openSearch')}
        disabled={isChanging}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
          ${selectedType === 'openSearch'
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'}
          ${isChanging ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title={`OpenSearch${isChanging ? ' (Changing storage...)' : ''}`}
      >
        <Cloud size={16} className={isChanging ? 'animate-pulse' : ''} />
        <span>OpenSearch</span>
      </button>
    </div>
  );
};