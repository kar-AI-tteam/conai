import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Globe, FileJson, KeyRound } from 'lucide-react';

interface APIConfirmDialogProps {
  isOpen: boolean;
  config: {
    name: string;
    endpoint: string;
    method: string;
    payload?: any;
  };
  onConfirm: (authToken?: string, modifiedConfig?: any) => void;
  onCancel: () => void;
}

export const APIConfirmDialog: React.FC<APIConfirmDialogProps> = ({
  isOpen,
  config,
  onConfirm,
  onCancel,
}) => {
  const [authToken, setAuthToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [endpoint, setEndpoint] = useState(config.endpoint);
  const [payload, setPayload] = useState(
    config.payload ? JSON.stringify(config.payload, null, 2) : ''
  );
  const [payloadError, setPayloadError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setEndpoint(config.endpoint);
      setPayload(config.payload ? JSON.stringify(config.payload, null, 2) : '');
      setAuthToken('');
      setShowToken(false);
      setPayloadError(null);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const validatePayload = () => {
    if (!payload.trim() || config.method === 'GET') return true;
    try {
      JSON.parse(payload);
      return true;
    } catch (error) {
      setPayloadError('Invalid JSON format');
      return false;
    }
  };

  const handleConfirm = () => {
    if (!validatePayload()) return;

    const modifiedConfig = {
      ...config,
      endpoint,
      payload: payload && config.method !== 'GET' ? JSON.parse(payload) : undefined
    };

    const token = authToken.trim();
    onConfirm(token || undefined, modifiedConfig);
    setAuthToken('');
    setShowToken(false);
  };

  const handleCancel = () => {
    onCancel();
    setAuthToken('');
    setShowToken(false);
    setPayloadError(null);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-modal="true"
      role="dialog"
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/25 dark:bg-black/50 transition-opacity"
          onClick={handleBackdropClick}
        />

        <div className="relative w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
          <div className="mb-4">
            <div className="flex items-start gap-3">
              <Globe className="text-blue-500 dark:text-blue-400 mt-0.5" size={20} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {config.name || 'Confirm API Call'}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Review and modify the API configuration before making the call.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Endpoint URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Endpoint URL
              </label>
              <div className="flex items-center gap-2">
                <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-md">
                  {config.method}
                </div>
                <input
                  type="text"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="Enter API endpoint URL..."
                />
              </div>
            </div>

            {/* Payload (for non-GET methods) */}
            {config.method !== 'GET' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Request Payload
                </label>
                <div className="relative">
                  <div className="absolute right-2 top-2 text-xs text-gray-400">
                    <FileJson size={14} />
                  </div>
                  <textarea
                    value={payload}
                    onChange={(e) => {
                      setPayload(e.target.value);
                      setPayloadError(null);
                    }}
                    rows={8}
                    className={`w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-1 ${
                      payloadError 
                        ? 'border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500 dark:focus:ring-red-400' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400'
                    }`}
                    placeholder="Enter JSON payload..."
                  />
                  {payloadError && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {payloadError}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Authorization Token */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Authorization Token (Optional)
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <KeyRound size={14} className="text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type={showToken ? 'text' : 'password'}
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  placeholder="Enter your authorization token..."
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 pl-9 pr-9 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleCancel}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Send Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};