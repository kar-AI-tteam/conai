import os
import json
import time
import requests
from dotenv import load_dotenv
from flask import Flask, Response, stream_with_context, request
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from langchain_community.chat_models import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone
import random
load_dotenv()

# Set up API keys and environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
API_BASE_URL = os.getenv("API_BASE_URL")

# Initialize Pinecone
pinecone = Pinecone(api_key=PINECONE_API_KEY)
index = pinecone.Index(PINECONE_INDEX_NAME)

# Use SentenceTransformer for embeddings
embedding_model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")

def embed_text(text):
    return embedding_model.encode(text).tolist()

# Initialize Pinecone vector store
vectorstore = PineconeVectorStore(index=index, embedding=embed_text, text_key="text")
retriever = vectorstore.as_retriever()

# Initialize ChatOpenAI
llm = ChatOpenAI(temperature=0, openai_api_key=OPENAI_API_KEY)

# Initialize ConversationalRetrievalChain
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
qa_chain = ConversationalRetrievalChain.from_llm(
    llm=llm,
    retriever=retriever,
    memory=memory
)

def query_api_chain(query, top_k=1, max_depth=3):
    chain_result = []
    visited_apis = set()
    current_query, depth = query, 0

    while depth < max_depth:
        query_vector = embed_text(current_query)
        result = index.query(vector=query_vector, top_k=top_k, include_metadata=True)

        if not result.get("matches"):
            break

        best_match = result["matches"][0]
        api_metadata = best_match["metadata"].get("api_data", "{}")

        try:
            api_info = json.loads(api_metadata)
        except json.JSONDecodeError:
            api_info = {}

        api_name = api_info.get("api_name", "")

        if api_name in visited_apis:
            break

        visited_apis.add(api_name)
        chain_result.append(api_info)

        next_step = api_info.get("next_step")
        if not next_step:
            break

        current_query = next_step
        depth += 1

    return chain_result

def execute_api_call(api_info, params=None):
    endpoint = api_info["endpoint"]
    method, path = endpoint.split(" ", 1)
    url = f"{API_BASE_URL}{path}"

    headers = {"Content-Type": "application/json"}

    try:
        if method.upper() == "POST":
            response = requests.post(url, json=params, headers=headers)
        else:
            response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        return {
            "request": {
                "method": method,
                "url": url,
                "params": params,
                "headers": headers
            },
            "response": {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "body": response.json()
            }
        }
    except requests.RequestException as e:
        raise Exception(f"API call failed: {e}")

def poll_status(api_info, poll_id, max_duration=120, interval=5):
    start_time = time.time()
    while time.time() - start_time < max_duration:
        try:
            result = execute_api_call(api_info, {"id": poll_id})
            status = result['response']['body'].get('expired', False)
            yield f"data: {json.dumps({'message': f'Polling status: {status}', 'data': result})}\n\n"
            if status:
                return
        except Exception as e:
            yield f"data: {json.dumps({'message': f'Error while polling: {str(e)}'})}\n\n"
        time.sleep(interval)
    raise TimeoutError("Polling timed out")

app = Flask(__name__)

# Configure CORS properly for streaming
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": False,
        "max_age": 3600
    }
})

def format_sse(data: str, event=None) -> str:
    """Format data as SSE"""
    msg = f'data: {data}\n'
    if event is not None:
        msg = f'event: {event}\n{msg}'
    return f'{msg}\n'

@app.route("/create-poll-workflow")
def create_poll_workflow():
    def generate():
        """Generate SSE data"""
        messages = [
            "⏳ Waiting for response...",
            "🔄 Processing request...",
            "✅ Operation successful!",
            "❌ An error occurred, retrying...",
            "⏰ Still working on it...",
        ]

        # Send initial message
        yield format_sse(json.dumps({
            "type": "start",
            "message": "Starting workflow..."
        }))

        try:
            for _ in range(5):  # Limit to 5 messages for testing
                message = random.choice(messages)
                data = json.dumps({
                    "type": "update",
                    "message": message,
                    "timestamp": time.strftime("%H:%M:%S")
                })
                yield format_sse(data)
                time.sleep(random.uniform(1, 3))  # Random delay between 1-3 seconds

            # Send completion message
            yield format_sse(json.dumps({
                "type": "complete",
                "message": "Workflow completed successfully!"
            }))

        except GeneratorExit:
            # Client disconnected
            print("Client disconnected")
            return
        except Exception as e:
            # Send error message
            yield format_sse(json.dumps({
                "type": "error",
                "message": str(e)
            }))

    # Set up response with proper headers for SSE
    response = Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
            'Content-Encoding': 'none'
        }
    )

    # Add CORS headers specifically for this endpoint
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Expose-Headers'] = 'Content-Type'

    return response

@app.after_request
def after_request(response):
    """Ensure all responses have proper CORS headers"""
    # Handle preflight requests
    if request.method == 'OPTIONS':
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Max-Age'] = '3600'
    
    # Ensure CORS headers are set
    if 'Access-Control-Allow-Origin' not in response.headers:
        response.headers['Access-Control-Allow-Origin'] = '*'
    
    return response

if __name__ == "__main__":
    # Run with threaded=True for better streaming support
    app.run(debug=True, port=5000, threaded=True)