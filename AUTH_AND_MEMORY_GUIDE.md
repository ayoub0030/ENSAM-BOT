# Minimal Auth & Per-User Memory Implementation

## Overview

This implementation adds:
- **Minimal Authentication**: Users login with their school ID (no JWT, just simple ID tracking)
- **Per-User Memory**: Conversation history is stored per school ID and used to enrich RAG queries
- **Session Persistence**: School ID is stored in `localStorage` so users stay logged in

---

## Backend Changes (`api.py`)

### 1. New Imports
```python
from datetime import datetime
from collections import defaultdict
```

### 2. In-Memory Storage
```python
# Stores conversations per school_id
user_conversations = defaultdict(list)
# Format: { "school_id": [ { "role": "user|assistant", "content": "...", "timestamp": "..." }, ... ] }
```

### 3. New Request/Response Models
```python
class LoginRequest(BaseModel):
    school_id: str

class LoginResponse(BaseModel):
    school_id: str
    message: str
```

### 4. Updated QueryRequest
```python
class QueryRequest(BaseModel):
    question: str
    use_web_search: bool = False
    school_id: str  # NEW: Required for per-user memory
```

### 5. New Endpoint: `/login`
```python
@app.post("/login", response_model=LoginResponse)
def login(request: LoginRequest):
    """Simple login with school ID"""
    school_id = request.school_id.strip()
    if not school_id:
        raise HTTPException(status_code=400, detail="School ID cannot be empty")
    
    # Initialize conversation history for this user if not exists
    if school_id not in user_conversations:
        user_conversations[school_id] = []
    
    return LoginResponse(
        school_id=school_id,
        message=f"Welcome! You are logged in as {school_id}"
    )
```

### 6. Updated `/query` Endpoint
The endpoint now:
1. Accepts `school_id` from the request
2. Loads the last 6 messages from that user's conversation history
3. Prepends the history to the question as context
4. Stores both the user question and assistant answer in the conversation history

**Key Logic:**
```python
# Load recent conversation history
history = user_conversations.get(school_id, [])
recent_history = history[-6:]  # Last 6 messages
history_text = "User: ...\nAssistant: ...\n..."

# Enrich the question with history
enriched_question = history_text + f"Current question: {request.question}"

# Query RAG with enriched question
result = rag_instance.query(enriched_question)

# Store the exchange
user_conversations[school_id].append({
    "role": "user",
    "content": request.question,
    "timestamp": datetime.now().isoformat()
})
user_conversations[school_id].append({
    "role": "assistant",
    "content": answer,
    "timestamp": datetime.now().isoformat()
})
```

---

## Frontend Changes

### 1. New Login Component (`Login.jsx`)
- Beautiful login screen with school ID input
- Calls `/login` endpoint
- Stores `school_id` in `localStorage`
- Calls `onLoginSuccess` callback

### 2. Updated `App.jsx`
- Added `schoolId` state
- Checks `localStorage` on mount to restore session
- Shows `<Login />` component if not authenticated
- Passes `schoolId` to all queries
- Added logout button in header that clears `localStorage`
- Displays current `schoolId` in header

### 3. Updated `api.js`
- Added `login(schoolId)` method
- Updated `query()` to accept and pass `schoolId`

---

## How It Works

### User Flow

1. **First Visit**
   - User sees login screen
   - Enters school ID (e.g., "STU-2024-001")
   - Clicks "Login"
   - Frontend calls `POST /login` with school ID
   - Backend initializes empty conversation history for this user
   - Frontend stores school ID in `localStorage`
   - User is redirected to chat interface

2. **Asking Questions**
   - User types a question
   - Frontend sends: `{ question, use_web_search, school_id }`
   - Backend:
     - Loads last 6 messages from this user's history
     - Prepends them to the question
     - Queries RAG with enriched question
     - Stores both Q&A in user's history
   - Frontend displays answer

3. **Conversation Memory**
   - Each subsequent question includes context from previous messages
   - RAG model can reference earlier parts of the conversation
   - Example: If user asks "Tell me more about that", the model has context

4. **Page Refresh**
   - `localStorage` still has school ID
   - User is automatically logged back in
   - Chat history is preserved (in backend memory)

5. **Logout**
   - User clicks logout button
   - Frontend clears `localStorage`
   - User is redirected to login screen
   - Backend still has conversation history (until server restart)

---

## Storage Notes

### Current Implementation (In-Memory)
- Conversations are stored in Python `defaultdict(list)`
- **Lost on server restart**
- Good for development/testing
- Sufficient for single-session use

### Future: Persistent Storage
To persist conversations, replace `user_conversations` with:

**Option 1: JSON File**
```python
import json

def save_conversations():
    with open("conversations.json", "w") as f:
        json.dump(dict(user_conversations), f)

def load_conversations():
    global user_conversations
    if os.path.exists("conversations.json"):
        with open("conversations.json", "r") as f:
            user_conversations = defaultdict(list, json.load(f))
```

**Option 2: Supabase (Production)**
```python
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# On query:
supabase.table("messages").insert({
    "school_id": school_id,
    "role": "user",
    "content": question,
    "timestamp": datetime.now().isoformat()
}).execute()
```

---

## Testing

### Test Login
```bash
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"school_id": "STU-2024-001"}'
```

### Test Query with School ID
```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is this document about?",
    "use_web_search": false,
    "school_id": "STU-2024-001"
  }'
```

### Test Memory (Ask Follow-up)
1. Ask: "What is the main topic?"
2. Ask: "Tell me more about that" (should reference previous answer)

---

## Security Notes

⚠️ **Current Implementation is NOT Production-Ready**

For production, add:
1. **Validate school IDs** against a whitelist or database
2. **Rate limiting** to prevent abuse
3. **Persistent storage** (Supabase, PostgreSQL, etc.)
4. **HTTPS** for all API calls
5. **CORS restrictions** (don't use `allow_origins=["*"]`)
6. **Session expiration** (add timestamps, invalidate old sessions)
7. **Audit logging** (log all queries with school ID)

---

## API Reference

### POST /login
**Request:**
```json
{
  "school_id": "STU-2024-001"
}
```

**Response:**
```json
{
  "school_id": "STU-2024-001",
  "message": "Welcome! You are logged in as STU-2024-001"
}
```

### POST /query
**Request:**
```json
{
  "question": "What is this about?",
  "use_web_search": false,
  "school_id": "STU-2024-001"
}
```

**Response:**
```json
{
  "answer": "...",
  "sources": [...],
  "web_results": [...]
}
```

---

## Troubleshooting

### "School ID is required" error
- Make sure frontend is passing `school_id` in the query request
- Check that user is logged in (school ID in localStorage)

### Conversation history not working
- Check browser console for errors
- Verify backend is receiving `school_id` in requests
- Restart backend to clear in-memory history

### Login not working
- Ensure backend is running on `http://localhost:8000`
- Check CORS settings in `api.py`
- Verify school ID is not empty

---

## Next Steps

1. **Test the flow** end-to-end
2. **Add persistent storage** if needed (Supabase recommended)
3. **Add validation** for school IDs (whitelist, format checks)
4. **Add analytics** (track which users ask what questions)
5. **Add session management** (expiration, refresh tokens)
