import http.server
import socketserver
import json
import time
from typing import Dict, Any
from urllib.parse import urlparse, parse_qs
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class TestAPIHandler(http.server.SimpleHTTPRequestHandler):
    def _send_cors_headers(self):
        """Send CORS headers"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Content-Type', 'application/json')

    def _get_request_body(self) -> Dict[str, Any]:
        """Get request body as JSON"""
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            body = self.rfile.read(content_length).decode('utf-8')
            try:
                return json.loads(body)
            except json.JSONDecodeError:
                return {}
        return {}

    def _send_response_json(self, data: Dict[str, Any], status: int = 200):
        """Send JSON response with proper headers"""
        self.send_response(status)
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode())

    def _handle_request(self, method: str):
        """Handle API request with logging and response formatting"""
        try:
            # Parse URL and query parameters
            parsed_url = urlparse(self.path)
            path = parsed_url.path
            query_params = parse_qs(parsed_url.query)
            
            # Get request body for non-GET requests
            body = self._get_request_body() if method != 'GET' else {}
            
            # Log request details
            logger.info(f"\n{'-'*50}")
            logger.info(f"Received {method} request:")
            logger.info(f"Path: {path}")
            logger.info(f"Query params: {query_params}")
            logger.info(f"Headers: {dict(self.headers)}")
            if body:
                logger.info(f"Body: {json.dumps(body, indent=2)}")

            # Handle different endpoints
            if path == '/api/test':
                # Basic test endpoint
                response_data = {
                    'success': True,
                    'method': method,
                    'message': f'Test {method} request successful',
                    'query_params': {k: v[0] for k, v in query_params.items()},
                    'headers': dict(self.headers),
                    'body': body
                }
                self._send_response_json(response_data)

            elif path == '/api/delay':
                # Endpoint with delay to test timeouts
                delay = int(query_params.get('seconds', [2])[0])
                time.sleep(delay)
                response_data = {
                    'success': True,
                    'message': f'Delayed response after {delay} seconds'
                }
                self._send_response_json(response_data)

            elif path == '/api/error':
                # Endpoint to test error responses
                error_code = int(query_params.get('code', [400])[0])
                response_data = {
                    'success': False,
                    'error': f'Test error response with code {error_code}'
                }
                self._send_response_json(response_data, error_code)

            elif path == '/api/auth':
                # Endpoint to test authentication
                auth_header = self.headers.get('Authorization')
                if not auth_header:
                    self._send_response_json({
                        'success': False,
                        'error': 'Authorization header required'
                    }, 401)
                else:
                    self._send_response_json({
                        'success': True,
                        'message': 'Authentication successful',
                        'token': auth_header
                    })

            else:
                self._send_response_json({
                    'success': False,
                    'error': 'Endpoint not found'
                }, 404)

        except Exception as e:
            logger.error(f"Error handling request: {str(e)}")
            self._send_response_json({
                'success': False,
                'error': str(e)
            }, 500)

    def do_GET(self):
        self._handle_request('GET')

    def do_POST(self):
        self._handle_request('POST')

    def do_PUT(self):
        self._handle_request('PUT')

    def do_PATCH(self):
        self._handle_request('PATCH')

    def do_DELETE(self):
        self._handle_request('DELETE')

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

def print_test_examples():
    """Print example curl commands for testing"""
    port = 8000
    base_url = f"http://localhost:{port}/api"
    
    examples = {
        'Basic Tests': {
            'GET': f"curl '{base_url}/test?param1=value1&param2=value2'",
            'POST': f"curl -X POST -H 'Content-Type: application/json' -d '{{'data': 'test'}}' '{base_url}/test'",
            'PUT': f"curl -X PUT -H 'Content-Type: application/json' -d '{{'data': 'update'}}' '{base_url}/test'",
            'DELETE': f"curl -X DELETE '{base_url}/test'"
        },
        'Authentication': {
            'With Token': f"curl -H 'Authorization: Bearer test-token' '{base_url}/auth'",
            'Without Token': f"curl '{base_url}/auth'"
        },
        'Error Handling': {
            '400 Error': f"curl '{base_url}/error?code=400'",
            '500 Error': f"curl '{base_url}/error?code=500'"
        },
        'Timeout Test': {
            '2s Delay': f"curl '{base_url}/delay?seconds=2'",
            '5s Delay': f"curl '{base_url}/delay?seconds=5'"
        }
    }
    
    logger.info("\nTest API Examples:")
    for category, tests in examples.items():
        logger.info(f"\n{category}:")
        for name, command in tests.items():
            logger.info(f"\n{name}:")
            logger.info(command)

def run_server(port: int = 8000):
    """Run the test server"""
    with socketserver.TCPServer(("", port), TestAPIHandler) as httpd:
        logger.info(f"\nStarting test server on port {port}...")
        print_test_examples()
        logger.info("\nPress Ctrl+C to stop the server")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            logger.info("\nShutting down server...")
            httpd.server_close()

if __name__ == '__main__':
    run_server()