import React, { useState } from 'react';
import { Edit2, Trash2, Webhook, FileText } from 'lucide-react';
import { QAItem } from '../../types/qa';
import { v4 as uuidv4 } from 'uuid';

interface EntryListProps {
  entries: QAItem[];
  searchQuery: string;
  onEdit: (item: QAItem) => void;
  onDelete: (item: QAItem) => void;
  viewMode?: 'all' | 'api' | 'text';
}

export const EntryList: React.FC<EntryListProps> = ({
  entries = [],
  searchQuery,
  onEdit,
  onDelete,
  viewMode = 'all'
}) => {
  // Create a Map to track unique identifiers for entries
  const uniqueIds = React.useMemo(() => {
    const idMap = new Map<string, string>();
    const questionCounts = new Map<string, number>();

    return entries.reduce((acc, entry) => {
      const normalizedQuestion = entry.question.toLowerCase().trim();
      const count = questionCounts.get(normalizedQuestion) || 0;
      questionCounts.set(normalizedQuestion, count + 1);

      // Create a unique identifier based on ID or question
      const baseId = entry.id || normalizedQuestion;
      const uniqueId = count > 0 ? `${baseId}_${count}` : baseId;
      acc.set(entry, uniqueId);

      return acc;
    }, new Map<QAItem, string>());
  }, [entries]);

  // Filter entries based on search query and view mode
  const filteredEntries = entries.filter(
    (item) => {
      // First filter by view mode
      if (viewMode === 'api' && item.entryType !== 'api') return false;
      if (viewMode === 'text' && item.entryType === 'api') return false;

      // Then filter by search query
      const searchTerms = searchQuery.toLowerCase().split(' ');
      return searchTerms.every(term => 
        item.question.toLowerCase().includes(term) ||
        (Array.isArray(item.keywords) && item.keywords.some(kw =>
          kw.toLowerCase().includes(term)
        ))
      );
    }
  );

  // Function to render API entry details
  const renderAPIDetails = (entry: QAItem) => {
    try {
      const apiConfig = JSON.parse(entry.answer);
      return (
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
              {apiConfig.method || 'GET'}
            </span>
            <span className="truncate">{apiConfig.endpoint || 'No endpoint specified'}</span>
          </div>
          {apiConfig.description && (
            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
              {apiConfig.description}
            </p>
          )}
        </div>
      );
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      {filteredEntries.map((item) => {
        const isApiEntry = item.entryType === 'api';
        const uniqueId = uniqueIds.get(item) || uuidv4();
        
        return (
          <div
            key={uniqueId}
            className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {isApiEntry ? (
                    <Webhook size={16} className="text-purple-500 dark:text-purple-400 flex-shrink-0" />
                  ) : (
                    <FileText size={16} className="text-blue-500 dark:text-blue-400 flex-shrink-0" />
                  )}
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
                    {item.question}
                  </h3>
                </div>
                {Array.isArray(item.keywords) && item.keywords.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1 sm:gap-1.5">
                    {item.keywords.map((kw, i) => (
                      <span
                        key={`${uniqueId}_kw_${i}`}
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          isApiEntry 
                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
                {isApiEntry && renderAPIDetails(item)}
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  onClick={() => onEdit(item)}
                  className="p-1 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Edit entry"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => onDelete(item)}
                  className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Delete entry"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
      
      {filteredEntries.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {searchQuery 
            ? 'No entries found matching your search' 
            : viewMode === 'api'
              ? 'No API entries yet'
              : viewMode === 'text'
                ? 'No text entries yet'
                : 'No entries yet'
          }
        </div>
      )}
    </div>
  );
};