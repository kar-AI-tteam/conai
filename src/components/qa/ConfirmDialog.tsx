import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { QAItem } from '../../types/qa';

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  existingEntry: QAItem;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  existingEntry,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
        <div className="relative w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
          <div className="mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-500 mt-0.5" size={20} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Entry Already Exists
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  An entry with this question already exists. Would you like to override it?
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4 bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 text-sm">
            <div className="mb-2">
              <span className="text-gray-600 dark:text-gray-400">Existing Question:</span>
              <p className="font-medium text-gray-900 dark:text-gray-100">{existingEntry.question}</p>
            </div>
            {existingEntry.keywords.length > 0 && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Keywords:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {existingEntry.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-3 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-md transition-colors"
            >
              Override Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};