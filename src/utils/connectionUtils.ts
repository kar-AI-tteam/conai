import { OpenAI } from 'openai';
import { testOpenSearchConnection } from './openSearchTest';

export interface ConnectionStatus {
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  details?: string;
  error?: string;
}

export const checkConnections = async (): Promise<ConnectionStatus[]> => {
  const statuses: ConnectionStatus[] = [];

  // Check OpenAI Connection
  try {
    const openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
    
    await openai.models.list();
    statuses.push({
      name: 'OpenAI',
      status: 'connected',
      details: 'API key is valid and connection is working'
    });
  } catch (error) {
    statuses.push({
      name: 'OpenAI',
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to connect to OpenAI'
    });
  }

  // Check Ollama Connection
  try {
    const response = await fetch('http://localhost:11434/api/health')
      .catch(() => null);
    
    if (response?.ok) {
      statuses.push({
        name: 'Ollama',
        status: 'connected',
        details: 'Local Llama model is accessible'
      });
    } else {
      throw new Error('Cannot connect to Ollama service');
    }
  } catch (error) {
    statuses.push({
      name: 'Ollama',
      status: 'error',
      error: 'Ollama is not running or inaccessible. Please ensure:\n' +
            '1. Ollama is installed and running (run `ollama serve`)\n' +
            '2. The service is accessible at http://localhost:11434\n' +
            '3. You have pulled the llama3 model (run `ollama pull llama3:2b`)'
    });
  }

  // Check OpenSearch Connection
  try {
    const openSearchStatus = await testOpenSearchConnection();
    if (openSearchStatus.success) {
      statuses.push({
        name: 'OpenSearch',
        status: 'connected',
        details: openSearchStatus.message
      });
    } else {
      throw new Error(openSearchStatus.message);
    }
  } catch (error) {
    statuses.push({
      name: 'OpenSearch',
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to connect to OpenSearch'
    });
  }

  return statuses;
};

export const formatConnectionStatus = (statuses: ConnectionStatus[]): string => {
  let message = '';
  
  // Group statuses by connection state
  const connected = statuses.filter(s => s.status === 'connected');
  const failed = statuses.filter(s => s.status === 'error' || s.status === 'disconnected');
  
  // Format connected services
  for (const status of connected) {
    message += `✅ **${status.name}**\n`;
    if (status.details) {
      message += `${status.details}\n`;
    }
    message += '\n';
  }
  
  // Format failed connections
  for (const status of failed) {
    message += `❌ **${status.name}**\n`;
    if (status.error) {
      // Split multi-line error messages and format them
      const errorLines = status.error.split('\n');
      if (errorLines.length > 1) {
        message += `Error:\n`;
        for (const line of errorLines) {
          message += `• ${line}\n`;
        }
      } else {
        message += `Error: ${status.error}\n`;
      }
    }
    message += '\n';
  }
  
  // Add summary footer
  const total = statuses.length;
  const connectedCount = connected.length;
  message += '---\n';
  message += `**Summary:** ${connectedCount} of ${total} services connected`;
  
  return message;
};