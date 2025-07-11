import { isOpenSearchConfigured, getClient } from './openSearchUtils';

export const testOpenSearchConnection = async () => {
  try {
    console.log('Testing OpenSearch connection...');
    
    // Check if configuration exists
    if (!isOpenSearchConfigured()) {
      return {
        success: false,
        message: 'OpenSearch configuration missing',
        details: {
          endpoint: 'search-chatbotos-lzhisiggnsl4omralswog6vwxq.us-east-2.opensearch.amazonaws.com',
          region: 'us-east-2',
          configured: false,
          connected: false,
          indexInitialized: false
        }
      };
    }

    // Get client and test connection
    const client = getClient();
    
    try {
      const data = await client.request('GET', '/qa_entries/_search');
      
      return {
        success: true,
        message: 'Successfully connected to OpenSearch',
        details: {
          endpoint: 'search-chatbotos-lzhisiggnsl4omralswog6vwxq.us-east-2.opensearch.amazonaws.com',
          region: 'us-east-2',
          hits: data.hits?.total?.value || 0,
          configured: true,
          connected: true,
          indexInitialized: true
        }
      };
    } catch (fetchError) {
      // Handle failed fetch attempts gracefully
      if (fetchError.message === 'Failed to fetch') {
        return {
          success: false,
          message: 'OpenSearch service is not accessible. Please check your network connection and ensure the service is running.',
          details: {
            endpoint: 'search-chatbotos-lzhisiggnsl4omralswog6vwxq.us-east-2.opensearch.amazonaws.com',
            region: 'us-east-2',
            configured: true,
            connected: false,
            indexInitialized: false,
            error: 'Service unreachable'
          }
        };
      }

      // Handle other fetch-related errors
      if (fetchError.status === 401 || fetchError.status === 403) {
        return {
          success: false,
          message: 'Authentication failed. Please check your OpenSearch credentials.',
          details: {
            endpoint: 'search-chatbotos-lzhisiggnsl4omralswog6vwxq.us-east-2.opensearch.amazonaws.com',
            region: 'us-east-2',
            configured: true,
            connected: false,
            indexInitialized: false,
            error: 'Authentication error'
          }
        };
      }

      // Handle other HTTP errors
      return {
        success: false,
        message: `OpenSearch connection failed: ${fetchError.message}`,
        details: {
          endpoint: 'search-chatbotos-lzhisiggnsl4omralswog6vwxq.us-east-2.opensearch.amazonaws.com',
          region: 'us-east-2',
          configured: true,
          connected: false,
          indexInitialized: false,
          error: fetchError.message
        }
      };
    }
  } catch (error) {
    console.error('OpenSearch connection test failed:', error);
    
    // Return a user-friendly error message
    return {
      success: false,
      message: 'Unable to test OpenSearch connection. Please check your configuration and try again.',
      details: {
        endpoint: 'search-chatbotos-lzhisiggnsl4omralswog6vwxq.us-east-2.opensearch.amazonaws.com',
        region: 'us-east-2',
        configured: isOpenSearchConfigured(),
        connected: false,
        indexInitialized: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
};