import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, Upload, Download, Loader2, AlertCircle, RotateCw, X, FileText, Webhook, Globe } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { QAItem } from '../types/qa';
import { User } from '../types/qa';
import { ConfirmDialog } from './qa/ConfirmDialog';
import { EntryList } from './qa/EntryList';
import { EntryForm } from './qa/EntryForm';
import { SwaggerImportModal } from './SwaggerImportModal';
import { storageManager } from '../utils/storage/storageManager';

interface QAManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: QAItem) => void;
  currentUser: User | null;
  entries: QAItem[];
  setEntries: React.Dispatch<React.SetStateAction<QAItem[]>>;
  getUserIdentifier: (user: User) => string;
}

export const QAManagementModal: React.FC<QAManagementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentUser,
  entries,
  setEntries,
  getUserIdentifier
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'view'>('create');
  const [entryType, setEntryType] = useState<'text' | 'table' | 'api'>('text');
  const [entry, setEntry] = useState<QAItem>({
    id: uuidv4(),
    question: '',
    answer: '',
    keywords: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'api' | 'text'>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [apiConfig, setApiConfig] = useState('{}');
  const [tableData, setTableData] = useState({
    description: '',
    headers: ['Column 1'],
    rows: [['']],
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [existingEntry, setExistingEntry] = useState<QAItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const [viewEntries, setViewEntries] = useState<QAItem[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const [showSwaggerImport, setShowSwaggerImport] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'view') {
      loadEntries();
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeTab === 'create' && !isEditing) {
      resetForm();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscKey);
    }

    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  const resetForm = () => {
    setEntry({
      id: uuidv4(),
      question: '',
      answer: '',
      keywords: []
    });
    setEntryType('text');
    setIsEditing(false);
    setApiConfig('{}');
    setTableData({
      description: '',
      headers: ['Column 1'],
      rows: [['']],
    });
    setError(null);
    setSaveError(null);
  };

  const handleNewEntry = () => {
    resetForm();
    setActiveTab('create');
  };

  const handleEditEntry = (item: QAItem) => {
    setEntry(item);
    setIsEditing(true);
    setActiveTab('create');

    const type = item.entryType || 'text';
    setEntryType(type);

    if (type === 'api') {
      try {
        const parsedConfig = JSON.parse(item.answer);
        setApiConfig(JSON.stringify(parsedConfig, null, 2));
      } catch (error) {
        console.error('Error parsing API config:', error);
        setApiConfig('{}');
      }
    } else if (type === 'table') {
      try {
        const lines = item.answer.split('\n');
        const description = lines[0];
        const headers = lines[2]
          .split('|')
          .filter(Boolean)
          .map((h) => h.trim());
        const rows = lines
          .slice(4)
          .filter(Boolean)
          .map((row) =>
            row
              .split('|')
              .filter(Boolean)
              .map((cell) => cell.trim())
          );
        setTableData({ description, headers, rows });
      } catch (error) {
        console.error('Error parsing table data:', error);
        setTableData({
          description: '',
          headers: ['Column 1'],
          rows: [['']],
        });
      }
    }
  };

  const handleSave = async () => {
    try {
      setSaveError(null);
      setIsSaving(true);

      if (!entry.question.trim()) {
        setSaveError('Question is required');
        return;
      }

      const entryToSave = {
        ...entry,
        entryType,
        answer: entryType === 'api' ? 
          JSON.stringify(JSON.parse(apiConfig), null, 2) : 
          entry.answer
      };

      const provider = storageManager.getCurrentProvider();
      if (isEditing) {
        await provider.updateEntry(entryToSave);
        resetForm();
      } else {
        await provider.addEntry(entryToSave);
      }
      
      onSave(entryToSave);
      await loadEntries(true);
      setActiveTab('view');
    } catch (error) {
      setSaveError('Failed to save entry. Please try again.');
      console.error('Error saving entry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const loadEntries = async (forceRefresh: boolean = false) => {
    try {
      setIsLoading(true);
      if (forceRefresh) {
        setIsRefreshing(true);
      }
      setError(null);

      const provider = storageManager.getCurrentProvider();
      const loadedEntries = await provider.loadEntries();
      console.log('Loaded entries:', loadedEntries.length);
      
      setViewEntries(loadedEntries);
      setEntries(loadedEntries);
    } catch (err) {
      console.error('Error loading entries:', err);
      setError('Failed to load entries. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && currentUser) {
      try {
        setIsImporting(true);
        setImportProgress(0);
        
        const text = await file.text();
        const importedEntries = JSON.parse(text);
        
        const provider = storageManager.getCurrentProvider();
        let processedCount = 0;
        let skippedCount = 0;
        let addedCount = 0;
        
        setTotalEntries(importedEntries.length);
        console.log('Total entries to import:', importedEntries.length);

        for (const entry of importedEntries) {
          try {
            const processedEntry = {
              ...entry,
              id: entry.id || uuidv4(),
              created_at: entry.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
              keywords: Array.isArray(entry.keywords) ? entry.keywords : []
            };

            const existingEntries = await provider.loadEntries();
            const isDuplicate = existingEntries.some(existing => 
              existing.question.toLowerCase() === processedEntry.question.toLowerCase()
            );

            if (isDuplicate) {
              console.log('Skipping duplicate:', processedEntry.question);
              skippedCount++;
            } else {
              await provider.addEntry(processedEntry);
              console.log('Added entry:', processedEntry.question);
              addedCount++;
            }

            processedCount++;
            setImportProgress(processedCount);
          } catch (error) {
            console.error('Error processing entry:', error);
            skippedCount++;
          }
        }

        await loadEntries(true);
        
        const message = `Import completed:\n` +
          `- ${addedCount} entries added\n` +
          `- ${skippedCount} entries skipped\n` +
          `- ${processedCount} total processed`;
        
        console.log(message);
        alert(message);
      } catch (error) {
        console.error('Error importing file:', error);
        setError('Error importing file. Please make sure it is a valid JSON file.');
      } finally {
        setIsImporting(false);
        setImportProgress(0);
        setTotalEntries(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleSwaggerImport = async (swaggerEntries: any[]) => {
    try {
      setIsImporting(true);
      setImportProgress(0);
      setTotalEntries(swaggerEntries.length);

      const provider = storageManager.getCurrentProvider();
      let processedCount = 0;
      let skippedCount = 0;
      let addedCount = 0;

      for (const entry of swaggerEntries) {
        try {
          const existingEntries = await provider.loadEntries();
          const isDuplicate = existingEntries.some(existing => 
            existing.question.toLowerCase() === entry.question.toLowerCase()
          );

          if (isDuplicate) {
            console.log('Skipping duplicate:', entry.question);
            skippedCount++;
          } else {
            await provider.addEntry(entry);
            console.log('Added API entry:', entry.question);
            addedCount++;
          }

          processedCount++;
          setImportProgress(processedCount);
        } catch (error) {
          console.error('Error processing Swagger entry:', error);
          skippedCount++;
        }
      }

      await loadEntries(true);
      
      const message = `Swagger import completed:\n` +
        `- ${addedCount} API entries added\n` +
        `- ${skippedCount} entries skipped (duplicates)\n` +
        `- ${processedCount} total processed`;
      
      console.log(message);
      alert(message);
    } catch (error) {
      console.error('Error importing Swagger entries:', error);
      setError('Error importing Swagger entries. Please try again.');
    } finally {
      setIsImporting(false);
      setImportProgress(0);
      setTotalEntries(0);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportFileDefaultName = 'knowledge-base.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleClose = () => {
    if (isImporting) {
      const confirmClose = window.confirm('Import in progress. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    onClose();
  };

  const handleDeleteEntry = async (item: QAItem) => {
    if (!item.id) {
      console.error('Cannot delete entry: missing ID');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        setIsLoading(true);
        const provider = storageManager.getCurrentProvider();
        await provider.deleteEntry(item.id);
        
        await loadEntries(true);
      } catch (error) {
        console.error('Error deleting entry:', error);
        setError('Failed to delete entry. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="flex items-center justify-center min-h-screen p-2">
        {/* Remove onClick handler from the backdrop */}
        <div className="fixed inset-0 bg-black/25 dark:bg-black/50" />
        <div 
          ref={modalRef}
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-lg bg-white dark:bg-gray-800 shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-3 py-2">
            <h2 className="text-xs font-medium text-gray-900 dark:text-gray-100">
              Knowledge Base Management
            </h2>
            <button
              onClick={handleClose}
              className="p-1.5 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/50">
              <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle size={12} />
                {error}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !isImporting && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          )}

          {/* Content */}
          {!isLoading && (
            <>
              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex px-2">
                  <button
                    onClick={handleNewEntry}
                    className={`px-2 py-1.5 text-xs font-medium border-b-2 ${
                      activeTab === 'create' && !isEditing
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    Create Entry
                  </button>
                  {isEditing && (
                    <button
                      onClick={() => setActiveTab('create')}
                      className={`px-2 py-1.5 text-xs font-medium border-b-2 border-blue-500 text-blue-600 dark:text-blue-400`}
                    >
                      Edit Entry
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('view')}
                    className={`px-2 py-1.5 text-xs font-medium border-b-2 ${
                      activeTab === 'view'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    View Entries
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-3">
                {activeTab === 'create' ? (
                  <EntryForm
                    entry={entry}
                    entryType={entryType}
                    onEntryChange={setEntry}
                    onEntryTypeChange={setEntryType}
                    onSave={handleSave}
                    isSaving={isSaving}
                    saveError={saveError}
                    apiConfig={apiConfig}
                    onApiConfigChange={setApiConfig}
                    tableData={tableData}
                    onTableDataChange={setTableData}
                    isEditing={isEditing}
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-7 pr-3 py-1 text-xs text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Search entries..."
                        />
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => loadEntries(true)}
                          disabled={isRefreshing || isImporting}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
                          title="Refresh entries"
                        >
                          <RotateCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                          <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImport}
                          accept=".json"
                          className="hidden"
                          disabled={isImporting}
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isImporting}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
                        >
                          <Upload size={12} className={isImporting ? 'animate-spin' : ''} />
                          <span className="hidden sm:inline">
                            {isImporting ? 'Importing...' : 'Import'}
                          </span>
                        </button>
                        <button
                          onClick={() => setShowSwaggerImport(true)}
                          disabled={isImporting}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors disabled:opacity-50"
                          title="Import from Swagger/OpenAPI"
                        >
                          <Globe size={12} />
                          <span className="hidden sm:inline">Swagger</span>
                        </button>
                        <button
                          onClick={handleExport}
                          disabled={isImporting}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
                        >
                          <Download size={12} />
                          <span className="hidden sm:inline">Export</span>
                        </button>
                      </div>
                    </div>

                    {/* View Mode Selector */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewMode('all')}
                          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                            viewMode === 'all'
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <FileText size={12} />
                          All
                        </button>
                        <button
                          onClick={() => setViewMode('text')}
                          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                            viewMode === 'text'
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <FileText size={12} />
                          Text
                        </button>
                        <button
                          onClick={() => setViewMode('api')}
                          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                            viewMode === 'api'
                              ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Webhook size={12} />
                          API
                        </button>
                      </div>
                    </div>

                    <EntryList
                      entries={viewEntries}
                      searchQuery={searchQuery}
                      onEdit={handleEditEntry}
                      onDelete={handleDeleteEntry}
                      viewMode={viewMode}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onConfirm={async () => {
          if (existingEntry) {
            setIsSaving(true);
            try {
              const provider = storageManager.getCurrentProvider();
              await provider.updateEntry({
                ...entry,
                id: existingEntry.id
              });
              
              await loadEntries(true);
              setShowConfirmDialog(false);
              setExistingEntry(null);
              setActiveTab('view');
            } catch (error) {
              setSaveError('Failed to update entry. Please try again.');
              console.error('Error updating entry:', error);
            } finally {
              setIsSaving(false);
            }
          }
        }}
        onCancel={() => {
          setShowConfirmDialog(false);
          setExistingEntry(null);
          setIsSaving(false);
        }}
        existingEntry={existingEntry!}
      />

      <SwaggerImportModal
        isOpen={showSwaggerImport}
        onClose={() => setShowSwaggerImport(false)}
        onImport={handleSwaggerImport}
      />
      
      {isImporting && (
        <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Importing entries...
            </span>
          </div>
          <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(importProgress / totalEntries) * 100}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {importProgress} of {totalEntries} entries processed
          </div>
        </div>
      )}
    </div>
  );
};

export default QAManagementModal;