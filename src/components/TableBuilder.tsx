import React from 'react';
import { Plus, Trash2, MoveUp, MoveDown, AlertCircle, GripVertical } from 'lucide-react';

interface TableBuilderProps {
  data: {
    description: string;
    headers: string[];
    rows: string[][];
  };
  onChange: (data: { description: string; headers: string[]; rows: string[][] }) => void;
}

export const TableBuilder: React.FC<TableBuilderProps> = ({
  data,
  onChange
}) => {
  const formatTableMarkdown = (): string => {
    // Format description
    let markdown = data.description ? `${data.description}\n\n` : '';

    // Format headers
    markdown += `| ${data.headers.join(' | ')} |\n`;
    
    // Format separator
    markdown += `| ${data.headers.map(() => '---').join(' | ')} |\n`;
    
    // Format rows
    data.rows.forEach(row => {
      markdown += `| ${row.join(' | ')} |\n`;
    });

    // Add extra newline to separate from following content
    markdown += '\n';

    return markdown;
  };

  const handleDescriptionChange = (value: string) => {
    onChange({
      ...data,
      description: value
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" size={16} />
          <div className="text-xs text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-0.5">Table Builder</p>
            <p className="text-blue-600/90 dark:text-blue-400/90">Create a table with headers and rows. Add a description to provide context.</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={data.description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          className="w-full h-20 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          placeholder="Add a description for this table..."
        />
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-800">
        {/* Table Header */}
        <div className="bg-gradient-to-b from-gray-50 to-gray-50/50 dark:from-gray-700/50 dark:to-gray-700/30 border-b border-gray-200 dark:border-gray-700 p-2">
          <div className="flex items-center gap-2">
            <div className="w-6" /> {/* Spacer for alignment */}
            {data.headers.map((header, index) => (
              <div key={index} className="flex-1 group relative">
                <input
                  type="text"
                  value={header}
                  onChange={(e) => {
                    const newHeaders = [...data.headers];
                    newHeaders[index] = e.target.value;
                    onChange({ ...data, headers: newHeaders });
                  }}
                  className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder={`Column ${index + 1}...`}
                />
                {data.headers.length > 1 && (
                  <button
                    onClick={() => {
                      const newHeaders = data.headers.filter((_, i) => i !== index);
                      const newRows = data.rows.map(row => row.filter((_, i) => i !== index));
                      onChange({ ...data, headers: newHeaders, rows: newRows });
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 rounded transition-opacity"
                    title="Remove column"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => {
                const newHeaders = [...data.headers, `Column ${data.headers.length + 1}`];
                const newRows = data.rows.map(row => [...row, '']);
                onChange({ ...data, headers: newHeaders, rows: newRows });
              }}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
              title="Add column"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {data.rows.map((row, rowIndex) => (
            <div 
              key={rowIndex} 
              className="flex items-center gap-2 p-2 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 group transition-colors"
            >
              <div className="flex items-center gap-0.5">
                <div className="text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400">
                  <GripVertical size={12} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => {
                      if (rowIndex > 0) {
                        const newRows = [...data.rows];
                        [newRows[rowIndex], newRows[rowIndex - 1]] = [newRows[rowIndex - 1], newRows[rowIndex]];
                        onChange({ ...data, rows: newRows });
                      }
                    }}
                    disabled={rowIndex === 0}
                    className="p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                    title="Move up"
                  >
                    <MoveUp size={12} />
                  </button>
                  <button
                    onClick={() => {
                      if (rowIndex < data.rows.length - 1) {
                        const newRows = [...data.rows];
                        [newRows[rowIndex], newRows[rowIndex + 1]] = [newRows[rowIndex + 1], newRows[rowIndex]];
                        onChange({ ...data, rows: newRows });
                      }
                    }}
                    disabled={rowIndex === data.rows.length - 1}
                    className="p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                    title="Move down"
                  >
                    <MoveDown size={12} />
                  </button>
                </div>
              </div>
              {row.map((cell, colIndex) => (
                <div key={colIndex} className="flex-1">
                  <input
                    type="text"
                    value={cell}
                    onChange={(e) => {
                      const newRows = [...data.rows];
                      newRows[rowIndex] = [...newRows[rowIndex]];
                      newRows[rowIndex][colIndex] = e.target.value;
                      onChange({ ...data, rows: newRows });
                    }}
                    className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-md focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="Enter value..."
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  const newRows = data.rows.filter((_, i) => i !== rowIndex);
                  onChange({ ...data, rows: newRows });
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                title="Remove row"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Table Footer */}
        <div className="bg-gradient-to-b from-gray-50/50 to-gray-50 dark:from-gray-700/30 dark:to-gray-700/50 border-t border-gray-200 dark:border-gray-700 p-2 flex justify-between items-center">
          <button
            onClick={() => {
              const newRow = new Array(data.headers.length).fill('');
              onChange({ ...data, rows: [...data.rows, newRow] });
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          >
            <Plus size={14} />
            Add Row
          </button>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
              {data.rows.length} row{data.rows.length !== 1 ? 's' : ''}
            </span>
            <span>×</span>
            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
              {data.headers.length} col{data.headers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview</h4>
        <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
          {formatTableMarkdown()}
        </pre>
      </div>
    </div>
  );
};