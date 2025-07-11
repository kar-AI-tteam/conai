import React, { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  AlertCircle,
  Save,
  Loader2,
  Upload,
  File,
  Edit2,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  FileText,
  Table2,
  Webhook
} from 'lucide-react';
import { QAItem } from '../../types/qa';
import { AnswerBuilder } from '../AnswerBuilder';
import { TableBuilder } from '../TableBuilder';
import { APIConfigBuilder } from '../APIConfigBuilder';
import { readDocumentContent } from '../../utils/documentUtils';
import { marked } from 'marked';

interface EntryFormProps {
  entry: QAItem;
  entryType: 'text' | 'table' | 'api';
  onEntryChange: (entry: QAItem) => void;
  onEntryTypeChange: (type: 'text' | 'table' | 'api') => void;
  onSave: () => void;
  isSaving: boolean;
  saveError: string | null;
  apiConfig: string;
  onApiConfigChange: (config: string) => void;
  tableData: {
    description: string;
    headers: string[];
    rows: string[][];
  };
  onTableDataChange: (data: typeof tableData) => void;
  isEditing?: boolean;
}

export const EntryForm: React.FC<EntryFormProps> = ({
  entry,
  entryType,
  onEntryChange,
  onEntryTypeChange,
  onSave,
  isSaving,
  saveError,
  apiConfig,
  onApiConfigChange,
  tableData,
  onTableDataChange,
  isEditing = false
}) => {
  const [keyword, setKeyword] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileUpload = async (file: File): Promise<void> => {
    try {
      setIsUploading(true);
      setUploadError(null);

      const { content, error } = await readDocumentContent(file);
      
      if (error) {
        setUploadError(error);
        return;
      }

      if (!content.trim()) {
        setUploadError('No readable content found in the document.');
        return;
      }

      onEntryChange({
        ...entry,
        answer: content,
        fileType: file.type,
        fileName: file.name,
      });
    } catch (error) {
      console.error('Error reading file:', error);
      setUploadError(
        error instanceof Error ? error.message : 'Failed to read document'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const getPreviewContent = (): string => {
    switch (entryType) {
      case 'text':
        return entry.answer;
      case 'table': {
        const headers = `| ${tableData.headers.join(' | ')} |`;
        const separator = `| ${tableData.headers.map(() => '---').join(' | ')} |`;
        const rows = tableData.rows.map(row => `| ${row.join(' | ')} |`).join('\n');
        return `${tableData.description}\n\n${headers}\n${separator}\n${rows}`;
      }
      case 'api': {
        try {
          const config = JSON.parse(apiConfig);
          return `## API Configuration\n\n### ${config.name || 'Untitled API'}\n\n${
            config.description || ''
          }\n\n**Endpoint:** \`${config.method || 'GET'} ${
            config.endpoint || ''
          }\`\n\n\`\`\`json\n${JSON.stringify(config, null, 2)}\n\`\`\``;
        } catch {
          return 'Invalid API configuration';
        }
      }
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Entry Type Selection */}
      <div className="relative">
        <div className="flex gap-2">
          <button
            onClick={() => onEntryTypeChange('text')}
            className={`flex-1 group relative overflow-hidden ${
              entryType === 'text'
                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
            } border rounded-lg transition-all duration-200`}
          >
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded-md ${
                    entryType === 'text'
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400'
                  }`}>
                    <FileText size={14} />
                  </div>
                  <span className={`text-xs font-semibold ${
                    entryType === 'text'
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>Text</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                Rich text with markdown support
              </p>
            </div>
            {entryType === 'text' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
            )}
          </button>

          <button
            onClick={() => onEntryTypeChange('table')}
            className={`flex-1 group relative overflow-hidden ${
              entryType === 'table'
                ? 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800'
            } border rounded-lg transition-all duration-200`}
          >
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded-md ${
                    entryType === 'table'
                      ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:text-purple-500 dark:group-hover:text-purple-400'
                  }`}>
                    <Table2 size={14} />
                  </div>
                  <span className={`text-xs font-semibold ${
                    entryType === 'table'
                      ? 'text-purple-700 dark:text-purple-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>Table</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                Structured data in table format
              </p>
            </div>
            {entryType === 'table' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500" />
            )}
          </button>

          <button
            onClick={() => onEntryTypeChange('api')}
            className={`flex-1 group relative overflow-hidden ${
              entryType === 'api'
                ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800'
            } border rounded-lg transition-all duration-200`}
          >
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded-md ${
                    entryType === 'api'
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400'
                  }`}>
                    <Webhook size={14} />
                  </div>
                  <span className={`text-xs font-semibold ${
                    entryType === 'api'
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>API</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                Configure API endpoints & auth
              </p>
            </div>
            {entryType === 'api' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
            )}
          </button>
        </div>
      </div>

      {/* Question Input */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Question
        </label>
        <input
          type="text"
          value={entry.question}
          onChange={(e) => onEntryChange({ ...entry, question: e.target.value })}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
          placeholder="Enter your question..."
        />
      </div>

      {/* Keywords */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Keywords
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (keyword.trim() && !entry.keywords.includes(keyword.trim())) {
                  onEntryChange({
                    ...entry,
                    keywords: [...entry.keywords, keyword.trim()],
                  });
                  setKeyword('');
                }
              }
            }}
            className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholder="Add keywords..."
          />
          <button
            onClick={() => {
              if (keyword.trim() && !entry.keywords.includes(keyword.trim())) {
                onEntryChange({
                  ...entry,
                  keywords: [...entry.keywords, keyword.trim()],
                });
                setKeyword('');
              }
            }}
            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Add
          </button>
        </div>
        {entry.keywords.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {entry.keywords.map((kw, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                {kw}
                <button
                  onClick={() =>
                    onEntryChange({
                      ...entry,
                      keywords: entry.keywords.filter((_, i) => i !== index),
                    })
                  }
                  className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Answer Section */}
      <div className="min-h-[400px]">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Answer
        </label>

        {/* Content Editor Section */}
        {entryType === 'text' && (
          <div className="space-y-4">
            <AnswerBuilder
              onInsert={(text) => onEntryChange({ ...entry, answer: text })}
              value={entry.answer}
              onFileUpload={handleFileUpload}
              isUploading={isUploading}
              uploadError={uploadError}
              fileName={entry.fileName}
            />
          </div>
        )}

        {entryType === 'table' && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800/50">
            <TableBuilder
              data={tableData}
              onChange={onTableDataChange}
            />
          </div>
        )}

        {entryType === 'api' && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800/50">
            <APIConfigBuilder 
              value={apiConfig} 
              onChange={(config) => {
                onApiConfigChange(config);
                try {
                  const parsedConfig = JSON.parse(config);
                  onEntryChange({
                    ...entry,
                    answer: JSON.stringify(parsedConfig, null, 2),
                    entryType: 'api'
                  });
                } catch (error) {
                  console.error('Error updating API entry:', error);
                }
              }}
            />
          </div>
        )}

        {/* Preview Section */}
        <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/50"
          >
            <div className="flex items-center gap-2">
              <MessageSquare size={14} className="text-gray-500 dark:text-gray-400" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Preview
              </span>
            </div>
            {showPreview ? (
              <ChevronDown size={14} className="text-gray-400" />
            ) : (
              <ChevronRight size={14} className="text-gray-400" />
            )}
          </button>

          {showPreview && (
            <div className="p-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0 prose dark:prose-invert prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: marked(getPreviewContent(), {
                    gfm: true,
                    breaks: true
                  }) }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {saveError && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-lg p-3">
          <AlertCircle size={16} />
          {saveError}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {isEditing ? 'Updating...' : 'Saving...'}
            </>
          ) : (
            <>
              {isEditing ? (
                <>
                  <Edit2 size={16} />
                  Update Entry
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Entry
                </>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};