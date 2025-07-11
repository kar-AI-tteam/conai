import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

interface APIConfigBuilderProps {
  value: string;
  onChange: (value: string) => void;
}

export const APIConfigBuilder: React.FC<APIConfigBuilderProps> = ({
  value,
  onChange
}) => {
  const [config, setConfig] = useState(() => {
    try {
      const parsed = JSON.parse(value);
      return {
        name: parsed.name || "",
        description: parsed.description || "",
        endpoint: parsed.endpoint || "",
        method: parsed.method || "GET",
        headers: parsed.headers || {
          "Content-Type": "application/json"
        },
        payload: parsed.payload || {}
      };
    } catch {
      return {
        name: "",
        description: "",
        endpoint: "",
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        payload: {}
      };
    }
  });

  const [payloadError, setPayloadError] = useState<string | null>(null);

  const validatePayload = (value: string): boolean => {
    try {
      JSON.parse(value);
      setPayloadError(null);
      return true;
    } catch (error) {
      setPayloadError('Invalid JSON format');
      return false;
    }
  };

  const updateConfig = (updates: Partial<typeof config>) => {
    const newConfig = { ...config, ...updates };
    
    // Remove payload if method is GET
    if (newConfig.method === 'GET') {
      delete newConfig.payload;
    } else if (!newConfig.payload) {
      newConfig.payload = {};
    }
    
    setConfig(newConfig);
    onChange(JSON.stringify(newConfig, null, 2));
  };

  const addHeader = () => {
    updateConfig({
      headers: {
        ...config.headers,
        "": ""
      }
    });
  };

  const updateHeader = (oldKey: string, newKey: string, value: string) => {
    const headers = { ...config.headers };
    if (oldKey !== newKey) {
      delete headers[oldKey];
    }
    headers[newKey] = value;
    updateConfig({ headers });
  };

  const removeHeader = (key: string) => {
    const headers = { ...config.headers };
    delete headers[key];
    updateConfig({ headers });
  };

  const handlePayloadChange = (value: string) => {
    if (value.trim() === '') {
      updateConfig({ payload: {} });
      setPayloadError(null);
      return;
    }

    try {
      const parsed = JSON.parse(value);
      updateConfig({ payload: parsed });
      setPayloadError(null);
    } catch {
      setConfig(prev => ({
        ...prev,
        payload: value
      }));
      setPayloadError('Invalid JSON format');
    }
  };

  const handlePayloadBlur = () => {
    if (typeof config.payload === 'string') {
      try {
        const parsed = JSON.parse(config.payload as string);
        updateConfig({ payload: parsed });
        setPayloadError(null);
      } catch {
        updateConfig({ payload: {} });
        setPayloadError(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" size={16} />
          <div className="text-xs text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-0.5">API Configuration</p>
            <p className="text-blue-600/90 dark:text-blue-400/90">Configure the API endpoint and parameters. Authentication will be requested when needed.</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
        {/* Basic Info */}
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => updateConfig({ name: e.target.value })}
                className="w-full rounded-md border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="Enter API name..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <input
                type="text"
                value={config.description}
                onChange={(e) => updateConfig({ description: e.target.value })}
                className="w-full rounded-md border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="Enter API description..."
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Endpoint
              </label>
              <input
                type="text"
                value={config.endpoint}
                onChange={(e) => updateConfig({ endpoint: e.target.value })}
                className="w-full rounded-md border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="Enter API endpoint URL..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Method
              </label>
              <select
                value={config.method}
                onChange={(e) => updateConfig({ method: e.target.value })}
                className="w-full rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
          </div>
        </div>

        {/* Headers */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Headers
            </label>
            <button
              onClick={addHeader}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
            >
              <Plus size={12} />
              Add Header
            </button>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {Object.entries(config.headers || {}).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => updateHeader(key, e.target.value, value as string)}
                    className="w-full rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="Header name..."
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={value as string}
                    onChange={(e) => updateHeader(key, key, e.target.value)}
                    className="w-full rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="Header value..."
                  />
                </div>
                <button
                  onClick={() => removeHeader(key)}
                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Payload - Only show for non-GET methods */}
        {config.method !== 'GET' && (
          <div className="p-3">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payload
            </label>
            <div className="relative">
              <textarea
                value={typeof config.payload === 'string' ? config.payload : JSON.stringify(config.payload, null, 2)}
                onChange={(e) => handlePayloadChange(e.target.value)}
                onBlur={handlePayloadBlur}
                onPaste={(e) => {
                  const text = e.clipboardData.getData('text');
                  handlePayloadChange(text);
                }}
                className={`w-full h-48 rounded-md border px-2.5 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 font-mono placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                  payloadError 
                    ? 'border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500 dark:focus:ring-red-400' 
                    : 'border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400'
                }`}
                placeholder="Enter your JSON payload here..."
                spellCheck={false}
              />
              {payloadError && (
                <div className="absolute inset-x-0 -bottom-6 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {payloadError}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};