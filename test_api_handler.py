import json
from api_handler import handle_api_request

def test_api_handler():
    """Test various API scenarios using the handler"""
    
    # Test cases
    tests = [
        {
            "name": "Basic GET Request",
            "config": {
                "endpoint": "http://localhost:8000/api/test",
                "method": "GET",
                "headers": {"Content-Type": "application/json"}
            }
        },
        {
            "name": "POST with Payload",
            "config": {
                "endpoint": "http://localhost:8000/api/test",
                "method": "POST",
                "headers": {"Content-Type": "application/json"},
                "payload": {"data": "test payload"}
            }
        },
        {
            "name": "Authentication Test",
            "config": {
                "endpoint": "http://localhost:8000/api/auth",
                "method": "GET",
                "headers": {"Content-Type": "application/json"}
            },
            "auth_token": "test-token"
        },
        {
            "name": "Error Response",
            "config": {
                "endpoint": "http://localhost:8000/api/error?code=400",
                "method": "GET",
                "headers": {"Content-Type": "application/json"}
            }
        },
        {
            "name": "Timeout Test",
            "config": {
                "endpoint": "http://localhost:8000/api/delay?seconds=3",
                "method": "GET",
                "headers": {"Content-Type": "application/json"}
            }
        }
    ]

    # Run tests
    for test in tests:
        print(f"\n{'-'*50}")
        print(f"Running test: {test['name']}")
        print(f"Configuration: {json.dumps(test['config'], indent=2)}")
        
        try:
            response = handle_api_request(
                test['config'],
                auth_token=test.get('auth_token')
            )
            print(f"\nResponse: {json.dumps(response, indent=2)}")
        except Exception as e:
            print(f"Error: {str(e)}")

if __name__ == '__main__':
    test_api_handler()