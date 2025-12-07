from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from VanillaRag import VanillaRAG
from datetime import datetime
from collections import defaultdict
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[WARNING] Supabase credentials not found. Database features will be disabled.")
    supabase_client: Client = None
else:
    supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize FastAPI app
app = FastAPI(
    title="RAG API",
    description="Retrieval-Augmented Generation API",
    version="1.0.0"
)

# Add CORS middleware to allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global RAG instance
rag_instance = None

# In-memory user conversations storage
# Format: { "school_id": [ { "role": "user|assistant", "content": "...", "timestamp": "..." }, ... ] }
user_conversations = defaultdict(list)

# Request/Response models
class LoginRequest(BaseModel):
    school_id: str

class LoginResponse(BaseModel):
    school_id: str
    message: str

class QueryRequest(BaseModel):
    question: str
    use_web_search: bool = False
    school_id: str

class UserInfoRequest(BaseModel):
    school_id: str
    ensam_info: str

class UserInfoResponse(BaseModel):
    school_id: str
    ensam_info: str
    updated_at: str

class BuildIndexRequest(BaseModel):
    chunk_size: int = 1000
    chunk_overlap: int = 200

def initialize_rag(chunk_size: int = 1000, chunk_overlap: int = 200):
    global rag_instance
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not set in environment variables")
    rag_instance = VanillaRAG(
        docs_folder="docs",
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )
    rag_instance.build_index()

class SourceDocument(BaseModel):
    content: str
    page: int = 0

class QueryResponse(BaseModel):
    answer: str
    sources: list[dict]
    web_results: list[dict] = []

# Endpoints

@app.post("/login", response_model=LoginResponse)
def login(request: LoginRequest):
    """Simple login with school ID"""
    school_id = request.school_id.strip()
    if not school_id:
        raise HTTPException(status_code=400, detail="School ID cannot be empty")
    
    # Initialize conversation history for this user if not exists
    if school_id not in user_conversations:
        user_conversations[school_id] = []
    
    # Save user to Supabase if available
    if supabase_client:
        try:
            # Check if user already exists
            existing_user = supabase_client.table("users").select("*").eq("school_id", school_id).execute()
            
            if not existing_user.data:
                # Create new user
                supabase_client.table("users").insert({
                    "school_id": school_id,
                    "created_at": datetime.now().isoformat(),
                    "last_login": datetime.now().isoformat()
                }).execute()
            else:
                # Update last login
                supabase_client.table("users").update({
                    "last_login": datetime.now().isoformat()
                }).eq("school_id", school_id).execute()
        except Exception as e:
            print(f"[ERROR] Failed to save user to Supabase: {str(e)}")
    
    return LoginResponse(
        school_id=school_id,
        message=f"Welcome! You are logged in as {school_id}"
    )

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "rag_ready": rag_instance is not None and rag_instance.vectorstore is not None
    }

@app.post("/build-index")
def build_index(request: BuildIndexRequest):
    """Build the RAG index from documents in the docs folder"""
    try:
        initialize_rag(
            chunk_size=request.chunk_size,
            chunk_overlap=request.chunk_overlap,
        )
        return {
            "status": "success",
            "message": "Index built successfully",
            "chunk_size": request.chunk_size,
            "chunk_overlap": request.chunk_overlap
        }
    
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
def query(request: QueryRequest) -> QueryResponse:
    """Query the RAG system with per-user memory"""
    global rag_instance
    
    if rag_instance is None or rag_instance.vectorstore is None:
        raise HTTPException(
            status_code=400,
            detail="RAG system not initialized. Please build the index first."
        )
    
    school_id = request.school_id.strip()
    if not school_id:
        raise HTTPException(status_code=400, detail="School ID is required")
    
    try:
        # Load recent conversation history for this user (last 6 messages)
        history = user_conversations.get(school_id, [])
        history_text = ""
        
        if history:
            # Get last 6 messages
            recent_history = history[-6:]
            for msg in recent_history:
                role = "User" if msg["role"] == "user" else "Assistant"
                history_text += f"{role}: {msg['content']}\n"
            history_text += "\n---\n\n"
        
        # Enrich the question with conversation history
        enriched_question = history_text + f"Current question: {request.question}"
        
        # Query RAG with enriched question
        if request.use_web_search:
            result = rag_instance.query_with_web_search(
                enriched_question,
                use_web_search=True
            )
        else:
            result = rag_instance.query(enriched_question)
        
        answer = result["answer"]
        
        # Format source documents
        sources = [
            {
                "content": doc.page_content[:1000],
                "page": doc.metadata.get("page", 0) if hasattr(doc, "metadata") else 0
            }
            for doc in result["source_documents"]
        ]
        
        # Store user question and assistant answer in conversation history
        user_msg = {
            "role": "user",
            "content": request.question,
            "timestamp": datetime.now().isoformat()
        }
        assistant_msg = {
            "role": "assistant",
            "content": answer,
            "timestamp": datetime.now().isoformat()
        }
        
        user_conversations[school_id].append(user_msg)
        user_conversations[school_id].append(assistant_msg)
        
        # Save conversation to Supabase if available
        if supabase_client:
            try:
                # Save user message
                supabase_client.table("conversations").insert({
                    "school_id": school_id,
                    "role": "user",
                    "question": request.question,
                    "answer": None,
                    "timestamp": user_msg["timestamp"]
                }).execute()
                
                # Save assistant message
                supabase_client.table("conversations").insert({
                    "school_id": school_id,
                    "role": "assistant",
                    "question": request.question,
                    "answer": answer,
                    "timestamp": assistant_msg["timestamp"]
                }).execute()
            except Exception as e:
                print(f"[ERROR] Failed to save conversation to Supabase: {str(e)}")
        
        return QueryResponse(
            answer=answer,
            sources=sources,
            web_results=result.get("web_results", [])
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/user-info", response_model=UserInfoResponse)
def save_user_info(request: UserInfoRequest):
    """Save or update user's ENSAM info"""
    school_id = request.school_id.strip()
    if not school_id:
        raise HTTPException(status_code=400, detail="School ID is required")
    
    if not request.ensam_info:
        raise HTTPException(status_code=400, detail="ENSAM info cannot be empty")
    
    # Save to Supabase if available
    if supabase_client:
        try:
            # Check if user info already exists
            existing_info = supabase_client.table("user_info_ensam").select("*").eq("school_id", school_id).execute()
            
            if existing_info.data:
                # Update existing info
                supabase_client.table("user_info_ensam").update({
                    "ensam_info": request.ensam_info,
                    "updated_at": datetime.now().isoformat()
                }).eq("school_id", school_id).execute()
            else:
                # Create new info
                supabase_client.table("user_info_ensam").insert({
                    "school_id": school_id,
                    "ensam_info": request.ensam_info,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }).execute()
        except Exception as e:
            print(f"[ERROR] Failed to save user info to Supabase: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to save user info: {str(e)}")
    else:
        raise HTTPException(status_code=500, detail="Database not available")
    
    return UserInfoResponse(
        school_id=school_id,
        ensam_info=request.ensam_info,
        updated_at=datetime.now().isoformat()
    )

@app.get("/user-info/{school_id}", response_model=UserInfoResponse)
def get_user_info(school_id: str):
    """Get user's ENSAM info"""
    school_id = school_id.strip()
    if not school_id:
        raise HTTPException(status_code=400, detail="School ID is required")
    
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        result = supabase_client.table("user_info_ensam").select("*").eq("school_id", school_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="User info not found")
        
        user_info = result.data[0]
        return UserInfoResponse(
            school_id=user_info["school_id"],
            ensam_info=user_info["ensam_info"],
            updated_at=user_info["updated_at"]
        )
    except Exception as e:
        print(f"[ERROR] Failed to retrieve user info from Supabase: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve user info: {str(e)}")

@app.get("/status")
def get_status():
    """Get RAG system status"""
    global rag_instance
    
    if rag_instance is None:
        return {
            "initialized": False,
            "index_built": False,
            "message": "RAG system not initialized"
        }
    
    return {
        "initialized": True,
        "index_built": rag_instance.vectorstore is not None,
        "message": "RAG system ready" if rag_instance.vectorstore else "RAG system initialized but index not built"
    }

@app.get("/docs-info")
def get_docs_info():
    """Get information about available documents"""
    docs_folder = "docs"
    
    if not os.path.exists(docs_folder):
        return {
            "folder_exists": False,
            "pdf_count": 0,
            "files": []
        }
    
    pdf_files = [f for f in os.listdir(docs_folder) if f.endswith('.pdf')]
    
    return {
        "folder_exists": True,
        "pdf_count": len(pdf_files),
        "files": pdf_files
    }

@app.on_event("startup")
def startup_event():
    try:
        initialize_rag()
    except Exception as e:
        print(f"Failed to initialize RAG index on startup: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
