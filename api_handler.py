import requests
import json
import logging
from typing import Dict, Any, Optional, Generator
from urllib.parse import urlparse
from requests.adapters import HTTPAdapter, Retry
from urllib3.exceptions import IncompleteRead

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class APIHandler:
    def __init__(self, config: Dict[str, Any]):
        """Initialize the API handler with configuration"""
        self.config = self._validate_config(config)
        self.session = self._create_session()

    def _create_session(self) -> requests.Session:
        """Create a requests session with retries and timeouts"""
        session = requests.Session()
        
        # Configure retries
        retries = Retry(
            total=3,
            backoff_factor=0.5,
            status_forcelist=[500, 502, 503, 504],
            allowed_methods=["GET", "POST", "PUT", "DELETE", "PATCH"]
        )
        
        adapter = HTTPAdapter(max_retries=retries)
        session.mount('http://', adapter)
        session.mount('https://', adapter)
        
        return session

    def _validate_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Validate the API configuration"""
        if not config.get('endpoint'):
            raise ValueError('API endpoint is required')
        
        try:
            url = urlparse(config['endpoint'])
            if not all([url.scheme, url.netloc]):
                raise ValueError('Invalid URL format')
            if url.scheme not in ['http', 'https']:
                raise ValueError('URL must use http or https protocol')
        except Exception as e:
            raise ValueError(f'Invalid endpoint URL: {str(e)}')

        method = config.get('method', 'GET').upper()
        if method not in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']:
            raise ValueError(f'Unsupported HTTP method: {method}')

        headers = config.get('headers', {})
        if not isinstance(headers, dict):
            raise ValueError('Headers must be a dictionary')

        return {
            'endpoint': config['endpoint'],
            'method': method,
            'headers': headers,
            'payload': config.get('payload')
        }

    def _stream_response(self, response: requests.Response) -> Generator[bytes, None, None]:
        """Stream response content in chunks"""
        chunk_size = 8192  # 8KB chunks
        
        try:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:
                    yield chunk
        except IncompleteRead as e:
            logger.warning(f"Incomplete read while streaming: {str(e)}")
            if e.partial:
                yield e.partial
        except Exception as e:
            logger.error(f"Error streaming response: {str(e)}")
            raise

    def _handle_response(self, response: requests.Response) -> Dict[str, Any]:
        """Handle the API response with streaming support"""
        try:
            content_type = response.headers.get('content-type', '')
            content_length = int(response.headers.get('content-length', 0))
            
            # Initialize response data
            accumulated_data = bytearray()
            
            # Stream the response
            for chunk in self._stream_response(response):
                accumulated_data.extend(chunk)
                
                # Log progress for large responses
                if content_length > 1_000_000:  # 1MB
                    progress = len(accumulated_data) / content_length * 100
                    logger.info(f"Download progress: {progress:.1f}%")

            # Process the complete response
            try:
                if 'application/json' in content_type:
                    data = json.loads(accumulated_data)
                else:
                    data = accumulated_data.decode('utf-8')
            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                logger.warning(f"Error decoding response: {str(e)}")
                data = str(accumulated_data)

            return {
                'success': response.ok,
                'status_code': response.status_code,
                'status_text': response.reason,
                'headers': dict(response.headers),
                'data': data,
                'url': response.url,
                'method': self.config['method'],
                'size': len(accumulated_data)
            }

        except Exception as e:
            logger.error(f"Error handling response: {str(e)}")
            return {
                'success': False,
                'status_code': response.status_code,
                'error': f'Error processing response: {str(e)}',
                'method': self.config['method'],
                'url': response.url
            }

    def execute(self, auth_token: Optional[str] = None) -> Dict[str, Any]:
        """Execute the API request with streaming support"""
        try:
            # Prepare headers
            headers = self.config['headers'].copy()
            if auth_token:
                headers['Authorization'] = (
                    auth_token if auth_token.startswith('Bearer ') 
                    else f'Bearer {auth_token}'
                )

            # Prepare request parameters
            request_params = {
                'url': self.config['endpoint'],
                'headers': headers,
                'timeout': (5, 60),  # (connect timeout, read timeout)
                'stream': True
            }

            # Add payload based on method
            method = self.config['method']
            if method == 'GET' and self.config.get('payload'):
                request_params['params'] = self.config['payload']
            elif method in ['POST', 'PUT', 'PATCH', 'DELETE'] and self.config.get('payload'):
                request_params['json'] = self.config['payload']

            # Make the request with streaming
            with self.session.request(method, **request_params) as response:
                return self._handle_response(response)

        except requests.exceptions.Timeout:
            return {
                'success': False,
                'status_code': 408,
                'error': 'Request timed out',
                'method': self.config['method'],
                'url': self.config['endpoint']
            }
        except requests.exceptions.ConnectionError as e:
            return {
                'success': False,
                'status_code': 503,
                'error': f'Connection error: {str(e)}',
                'method': self.config['method'],
                'url': self.config['endpoint']
            }
        except Exception as e:
            return {
                'success': False,
                'status_code': 500,
                'error': str(e),
                'method': self.config['method'],
                'url': self.config['endpoint']
            }
        finally:
            self.session.close()

def handle_api_request(config: Dict[str, Any], auth_token: Optional[str] = None) -> Dict[str, Any]:
    """
    Handle an API request with streaming support
    
    Args:
        config: Dictionary containing API configuration:
            - endpoint: API endpoint URL (required)
            - method: HTTP method (GET, POST, PUT, PATCH, DELETE)
            - headers: Request headers
            - payload: Request payload (for POST/PUT/PATCH/DELETE)
        auth_token: Optional authorization token
    
    Returns:
        Dictionary containing the API response
    """
    try:
        handler = APIHandler(config)
        return handler.execute(auth_token)
    except Exception as e:
        return {
            'success': False,
            'status_code': 500,
            'error': str(e),
            'method': config.get('method', 'GET'),
            'url': config.get('endpoint', '')
        }

if __name__ == '__main__':
    # Example configuration
    config = {
        "name": "Get Countries",
        "description": "Fetch all countries data",
        "endpoint": "https://restcountries.com/v3.1/all",
        "method": "GET",
        "headers": {
            "Content-Type": "application/json"
        }
    }

    # Make the request
    response = handle_api_request(config)
    
    # Print formatted response
    print(json.dumps(response, indent=2))