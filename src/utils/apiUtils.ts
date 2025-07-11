import { APIConfig } from '../types/qa';

export const triggerAPI = async (
  config: APIConfig,
  authToken?: string,
  onStream?: (chunk: any) => void
): Promise<any> => {
  try {
    // Validate required fields
    if (!config.endpoint) {
      throw new Error('API endpoint is required');
    }
    if (!config.method) {
      throw new Error('HTTP method is required');
    }

    // Improved URL validation and handling
    let url: URL;
    try {
      // Handle relative URLs by prepending current origin
      if (config.endpoint.startsWith('/')) {
        url = new URL(config.endpoint, window.location.origin);
      } else {
        // Keep the original URL if it's not localhost/127.0.0.1
        let endpoint = config.endpoint;
        
        // Only transform localhost URLs in WebContainer environment
        if (window.location.hostname.includes('webcontainer-api.io')) {
          if (endpoint.includes('127.0.0.1:') || endpoint.includes('localhost:')) {
            // Extract the port and path
            const match = endpoint.match(/(localhost|127\.0\.0\.1):(\d+)(.*)/);
            if (match) {
              const [, , port, path] = match;
              // Use the port directly without appending to hostname
              endpoint = `http://localhost:${port}${path}`;
              console.log('Using direct localhost URL:', endpoint);
            }
          }
        }
        
        url = new URL(endpoint);
      }

      // Ensure protocol is http or https
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol. URL must use http or https');
      }
    } catch (error) {
      throw new Error(`Invalid API endpoint URL: ${error.message}`);
    }

    // Set up request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      // Prepare headers
      const headers = new Headers({
        ...config.headers,
        'Content-Type': config.headers['Content-Type'] || 'application/json',
        'Accept': 'text/event-stream'
      });

      // Only add Authorization header if token is provided
      if (authToken?.trim()) {
        headers.set('Authorization', authToken.toLowerCase().startsWith('bearer ') ? authToken : `Bearer ${authToken}`);
      }

      // Log request details
      console.log('Making API request:', {
        url: url.toString(),
        method: config.method,
        headers: Object.fromEntries(headers.entries()),
        body: config.method !== 'GET' ? config.payload : undefined
      });

      // Make the request
      const response = await fetch(url.toString(), {
        method: config.method,
        headers,
        mode: 'cors',
        signal: controller.signal,
        ...(config.method !== 'GET' && config.payload && {
          body: JSON.stringify(config.payload)
        })
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      // Handle streaming response
      if (response.headers.get('content-type')?.includes('text/event-stream') && onStream) {
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body available for streaming');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim() && !line.startsWith(':')) {
                try {
                  // Handle SSE format (data: {...})
                  const data = line.startsWith('data: ') ? line.substring(6) : line;
                  try {
                    const parsedData = JSON.parse(data);
                    onStream(parsedData);
                  } catch {
                    onStream(data);
                  }
                } catch (e) {
                  console.warn('Error parsing stream data:', e);
                  onStream(line);
                }
              }
            }
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            console.log('Stream aborted');
          } else {
            throw error;
          }
        } finally {
          reader.releaseLock();
        }

        return {
          success: true,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          streaming: true
        };
      }

      // Handle regular response
      const contentType = response.headers.get('content-type');
      const text = await response.text();

      let data;
      try {
        data = contentType?.includes('application/json') ? JSON.parse(text) : text;
      } catch {
        data = text;
      }

      return {
        success: true,
        data,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        config: {
          method: config.method,
          endpoint: url.toString()
        }
      };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timed out after 30 seconds',
        status: 408
      };
    }

    // Improved error handling for network and CORS issues
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      const errorDetails = {
        endpoint: config.endpoint,
        method: config.method
      };

      console.error('API request failed:', errorDetails);

      return {
        success: false,
        error: `API request failed. Please check:\n` +
              `1. The endpoint ${config.endpoint} is accessible\n` +
              `2. Your network connection is stable\n` +
              `3. CORS is properly configured on the server\n` +
              `4. The server is running and responding to requests`,
        status: 0,
        details: errorDetails
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to make API request',
      status: error.status || 500,
      details: {
        endpoint: config.endpoint,
        method: config.method
      }
    };
  }
};

export const formatAPIResponse = (response: any): string => {
  if (!response.success) {
    let errorMessage = `### API Request Failed\n\n**Error:** ${response.error}\n\n`;
    
    // Add details section if available
    if (response.details) {
      errorMessage += `**Details:**\n`;
      Object.entries(response.details).forEach(([key, value]) => {
        errorMessage += `- ${key}: \`${value}\`\n`;
      });
      errorMessage += '\n';
    }
    
    errorMessage += `\`\`\`json\n${JSON.stringify({
      error: response.error,
      status: response.status || 500,
      ...(response.details || {})
    }, null, 2)}\n\`\`\``;
    
    return errorMessage;
  }

  // Format successful response
  let formattedResponse = `### API Request Successful\n\n`;
  
  // Add request details
  formattedResponse += `**Request Details:**\n`;
  formattedResponse += `- Method: \`${response.config.method}\`\n`;
  formattedResponse += `- Endpoint: \`${response.config.endpoint}\`\n`;
  formattedResponse += `- Status: \`${response.status} ${response.statusText}\`\n`;
  formattedResponse += '\n';

  // Add response headers if present
  if (Object.keys(response.headers || {}).length > 0) {
    formattedResponse += `**Response Headers:**\n\`\`\`json\n${JSON.stringify(response.headers, null, 2)}\n\`\`\`\n\n`;
  }

  // Format response data based on type
  formattedResponse += `**Response Body:**\n`;
  if (typeof response.data === 'string') {
    // Try to parse string as JSON first
    try {
      const jsonData = JSON.parse(response.data);
      formattedResponse += `\`\`\`json\n${JSON.stringify(jsonData, null, 2)}\n\`\`\``;
    } catch {
      // If not JSON, format as plain text with wrapping
      const wrappedText = response.data
        .split('\n')
        .map((line: string) => line.length > 80 ? line.match(/.{1,80}(\s|$)/g)?.join('\n') : line)
        .join('\n');
      formattedResponse += `\`\`\`\n${wrappedText}\n\`\`\``;
    }
  } else {
    // Format objects and arrays as JSON
    formattedResponse += `\`\`\`json\n${JSON.stringify(response.data, null, 2)}\n\`\`\``;
  }

  return formattedResponse;
};