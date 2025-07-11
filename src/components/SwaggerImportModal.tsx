import React, { useState } from 'react';
import { X, Globe, Loader2, AlertCircle, CheckCircle2, Download, ExternalLink, Search } from 'lucide-react';

interface SwaggerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (entries: any[]) => void;
}

interface SwaggerSpec {
  openapi?: string;
  swagger?: string;
  info?: {
    title?: string;
    description?: string;
    version?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  host?: string;
  basePath?: string;
  schemes?: string[];
  paths: {
    [path: string]: {
      [method: string]: {
        summary?: string;
        description?: string;
        operationId?: string;
        tags?: string[];
        parameters?: any[];
        requestBody?: any;
        responses?: any;
      };
    };
  };
}

export const SwaggerImportModal: React.FC<SwaggerImportModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [swaggerUrl, setSwaggerUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewEntries, setPreviewEntries] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [detectedUrls, setDetectedUrls] = useState<string[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  const parseSwaggerSpec = (spec: SwaggerSpec): any[] => {
    const entries: any[] = [];
    
    // Determine base URL
    let baseUrl = '';
    if (spec.servers && spec.servers.length > 0) {
      baseUrl = spec.servers[0].url;
    } else if (spec.host) {
      const scheme = spec.schemes?.[0] || 'https';
      const basePath = spec.basePath || '';
      baseUrl = `${scheme}://${spec.host}${basePath}`;
    }

    // Parse each path and method
    Object.entries(spec.paths).forEach(([path, pathItem]) => {
      Object.entries(pathItem).forEach(([method, operation]) => {
        if (typeof operation === 'object' && operation !== null) {
          const methodUpper = method.toUpperCase();
          
          // Skip non-HTTP methods
          if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(methodUpper)) {
            return;
          }

          const fullUrl = baseUrl + path;
          const operationName = operation.summary || operation.operationId || `${methodUpper} ${path}`;
          const description = operation.description || operation.summary || `${methodUpper} request to ${path}`;
          
          // Generate keywords from tags, operation name, and path
          const keywords = [
            ...(operation.tags || []),
            methodUpper.toLowerCase(),
            ...path.split('/').filter(segment => segment && !segment.startsWith('{')),
            ...(operation.operationId ? [operation.operationId] : [])
          ].filter((keyword, index, arr) => arr.indexOf(keyword) === index);

          // Create API configuration
          const apiConfig = {
            name: operationName,
            description: description,
            endpoint: fullUrl,
            method: methodUpper,
            headers: {
              'Content-Type': 'application/json'
            }
          };

          // Add request body for POST/PUT/PATCH methods
          if (['POST', 'PUT', 'PATCH'].includes(methodUpper) && operation.requestBody) {
            try {
              const content = operation.requestBody.content;
              if (content && content['application/json'] && content['application/json'].schema) {
                // Create a sample payload based on schema
                apiConfig.payload = generateSamplePayload(content['application/json'].schema);
              }
            } catch (e) {
              // If we can't parse the request body, just add an empty object
              apiConfig.payload = {};
            }
          }

          const entry = {
            id: `swagger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            question: `How to ${operationName.toLowerCase()}?`,
            answer: JSON.stringify(apiConfig, null, 2),
            keywords: keywords.slice(0, 10), // Limit to 10 keywords
            entryType: 'api',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          entries.push(entry);
        }
      });
    });

    return entries;
  };

  const generateSamplePayload = (schema: any): any => {
    if (!schema || typeof schema !== 'object') return {};

    if (schema.type === 'object' && schema.properties) {
      const payload: any = {};
      Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
        if (prop.type === 'string') {
          payload[key] = prop.example || `sample_${key}`;
        } else if (prop.type === 'number' || prop.type === 'integer') {
          payload[key] = prop.example || 0;
        } else if (prop.type === 'boolean') {
          payload[key] = prop.example || false;
        } else if (prop.type === 'array') {
          payload[key] = [];
        } else if (prop.type === 'object') {
          payload[key] = generateSamplePayload(prop);
        } else {
          payload[key] = prop.example || null;
        }
      });
      return payload;
    }

    return {};
  };

  const generatePossibleUrls = (inputUrl: string): string[] => {
    try {
      const url = new URL(inputUrl);
      const baseUrl = `${url.protocol}//${url.host}`;
      const pathParts = url.pathname.split('/').filter(Boolean);
      
      // Common patterns for Swagger/OpenAPI specs
      const patterns = [
        // Direct JSON files
        `${baseUrl}/swagger.json`,
        `${baseUrl}/openapi.json`,
        `${baseUrl}/api-docs`,
        `${baseUrl}/v2/api-docs`,
        `${baseUrl}/v3/api-docs`,
        
        // Versioned paths
        `${baseUrl}/api/swagger.json`,
        `${baseUrl}/api/openapi.json`,
        `${baseUrl}/api/v1/swagger.json`,
        `${baseUrl}/api/v2/swagger.json`,
        `${baseUrl}/api/v3/swagger.json`,
        
        // Swagger subdirectory patterns
        `${baseUrl}/swagger/v1/swagger.json`,
        `${baseUrl}/swagger/v2/swagger.json`,
        `${baseUrl}/swagger/v3/swagger.json`,
        `${baseUrl}/swagger/swagger.json`,
        
        // If it's a swagger-ui URL, try to extract the spec URL
        ...(url.pathname.includes('swagger-ui') ? [
          `${baseUrl}/v2/api-docs`,
          `${baseUrl}/v3/api-docs`,
          `${baseUrl}/api-docs`,
          `${baseUrl}/swagger.json`,
          `${baseUrl}/openapi.json`,
          // Try removing swagger-ui part and adding common paths
          `${baseUrl}${url.pathname.replace('/swagger-ui', '')}/swagger.json`.replace('//', '/'),
          `${baseUrl}${url.pathname.replace('/swagger-ui/index.html', '')}/swagger.json`.replace('//', '/'),
          `${baseUrl}${url.pathname.replace('/swagger-ui', '')}/api-docs`.replace('//', '/'),
        ] : []),
        
        // Try with current path structure
        ...(pathParts.length > 0 ? [
          `${baseUrl}/${pathParts[0]}/swagger.json`,
          `${baseUrl}/${pathParts[0]}/openapi.json`,
          `${baseUrl}/${pathParts[0]}/api-docs`,
        ] : [])
      ];

      // Remove duplicates and return
      return [...new Set(patterns)];
    } catch (e) {
      return [];
    }
  };

  const detectSwaggerUrls = async (inputUrl: string): Promise<string[]> => {
    const possibleUrls = generatePossibleUrls(inputUrl);
    const validUrls: string[] = [];
    
    setIsDetecting(true);
    
    // Test each URL with a quick HEAD request
    for (const url of possibleUrls) {
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          mode: 'cors',
          cache: 'no-cache'
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            validUrls.push(url);
          }
        }
      } catch (e) {
        // Ignore errors for individual URLs
        continue;
      }
    }
    
    setIsDetecting(false);
    return validUrls;
  };

  const fetchSwaggerSpec = async (url: string): Promise<SwaggerSpec> => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Swagger spec: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Response is not JSON. Please ensure the URL points to a Swagger/OpenAPI JSON specification.');
      }

      const spec = await response.json();
      
      // Validate it's a Swagger/OpenAPI spec
      if (!spec.paths && !spec.openapi && !spec.swagger) {
        throw new Error('Invalid Swagger/OpenAPI specification. Missing required fields.');
      }

      return spec;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(`Failed to fetch the Swagger specification. This might be due to:

1. **CORS restrictions** - The API server doesn't allow cross-origin requests
2. **Network connectivity issues** - Check your internet connection
3. **Invalid URL** - Ensure the URL is correct and accessible

**Possible solutions:**
• Try using a CORS proxy service
• Contact the API provider to enable CORS
• Use the API's official Swagger JSON URL instead of the UI URL`);
      }
      throw error;
    }
  };

  const handleDetectUrls = async () => {
    if (!swaggerUrl.trim()) {
      setError('Please enter a URL first');
      return;
    }

    setError(null);
    const urls = await detectSwaggerUrls(swaggerUrl.trim());
    setDetectedUrls(urls);
    
    if (urls.length === 0) {
      setError('No Swagger/OpenAPI specifications found at the provided URL. Please check the URL or try a direct link to the JSON specification.');
    }
  };

  const handleImportSwagger = async (urlToUse?: string) => {
    const targetUrl = urlToUse || swaggerUrl.trim();
    
    if (!targetUrl) {
      setError('Please enter a Swagger URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const spec = await fetchSwaggerSpec(targetUrl);
      const entries = parseSwaggerSpec(spec);
      
      if (entries.length === 0) {
        throw new Error('No API endpoints found in the Swagger specification.');
      }

      setPreviewEntries(entries);
      setShowPreview(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to import Swagger specification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = () => {
    onImport(previewEntries);
    handleClose();
  };

  const handleClose = () => {
    setSwaggerUrl('');
    setError(null);
    setPreviewEntries([]);
    setShowPreview(false);
    setDetectedUrls([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
        
        <div className="relative w-full max-w-4xl rounded-lg bg-white dark:bg-gray-800 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Import from Swagger/OpenAPI
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Import API endpoints from a Swagger/OpenAPI specification
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {!showPreview ? (
              <div className="space-y-4">
                {/* URL Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Swagger/OpenAPI URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={swaggerUrl}
                      onChange={(e) => setSwaggerUrl(e.target.value)}
                      placeholder="https://api.staging.crossref.org/swagger-ui/index.html"
                      className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                      disabled={isLoading || isDetecting}
                    />
                    <button
                      onClick={handleDetectUrls}
                      disabled={isLoading || isDetecting || !swaggerUrl.trim()}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Auto-detect Swagger URLs"
                    >
                      {isDetecting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Search size={16} />
                      )}
                      Detect
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Enter any Swagger URL (UI or JSON spec). We'll try to find the JSON specification automatically.
                  </p>
                </div>

                {/* Detected URLs */}
                {detectedUrls.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      Found {detectedUrls.length} Swagger specification{detectedUrls.length > 1 ? 's' : ''}:
                    </h4>
                    <div className="space-y-2">
                      {detectedUrls.map((url, index) => (
                        <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-md p-2 border border-green-200 dark:border-green-700">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <ExternalLink size={14} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                            <span className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
                              {url}
                            </span>
                          </div>
                          <button
                            onClick={() => handleImportSwagger(url)}
                            disabled={isLoading}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                          >
                            <Download size={12} />
                            Import
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Examples */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Supported URL formats:
                  </h4>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• <strong>Swagger UI URLs:</strong> https://api.example.com/swagger-ui/index.html</li>
                    <li>• <strong>Direct JSON specs:</strong> https://api.example.com/swagger.json</li>
                    <li>• <strong>API docs:</strong> https://api.example.com/api-docs</li>
                    <li>• <strong>Versioned specs:</strong> https://api.example.com/v2/api-docs</li>
                    <li>• <strong>Example:</strong> https://petstore.swagger.io/v2/swagger.json</li>
                  </ul>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Import Failed</p>
                      <div className="mt-1 whitespace-pre-line">{error}</div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleImportSwagger()}
                    disabled={isLoading || !swaggerUrl.trim()}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        Import APIs
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Preview */
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 size={20} />
                  <div>
                    <h4 className="font-medium">Import Preview</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Found {previewEntries.length} API endpoints
                    </p>
                  </div>
                </div>

                {/* Preview List */}
                <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  {previewEntries.map((entry, index) => {
                    const config = JSON.parse(entry.answer);
                    return (
                      <div
                        key={index}
                        className="p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                config.method === 'GET' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                config.method === 'POST' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                config.method === 'PUT' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                config.method === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {config.method}
                              </span>
                              <h5 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                {config.name}
                              </h5>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                              {config.endpoint}
                            </p>
                            {entry.keywords.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {entry.keywords.slice(0, 3).map((keyword: string, i: number) => (
                                  <span
                                    key={i}
                                    className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                                  >
                                    {keyword}
                                  </span>
                                ))}
                                {entry.keywords.length > 3 && (
                                  <span className="text-xs text-gray-400">
                                    +{entry.keywords.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    <CheckCircle2 size={16} />
                    Import {previewEntries.length} APIs
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};