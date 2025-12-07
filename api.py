from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from VanillaRag import VanillaRAG

# Load environment variables
load_dotenv()

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

# Request/Response models
class QueryRequest(BaseModel):
    question: str
    use_web_search: bool = False

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
    """Query the RAG system"""
    global rag_instance
    
    if rag_instance is None or rag_instance.vectorstore is None:
        raise HTTPException(
            status_code=400,
            detail="RAG system not initialized. Please build the index first."
        )
    
    try:
        if request.use_web_search:
            result = rag_instance.query_with_web_search(
                request.question,
                use_web_search=True
            )
        else:
            result = rag_instance.query(request.question)
        
        # Format source documents
        sources = [
            {
                "content": doc.page_content[:1000],  # Limit to 500 chars
                "page": doc.metadata.get("page", 0) if hasattr(doc, "metadata") else 0
            }
            for doc in result["source_documents"]
        ]
        
        return QueryResponse(
            answer=result["answer"],
            sources=sources,
            web_results=result.get("web_results", [])
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
