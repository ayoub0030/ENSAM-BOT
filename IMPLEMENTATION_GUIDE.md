# ENSAM RAG - Production Implementation Guide

## ✅ What Was Implemented

### 1. **JWT Authentication with School ID**
- **Backend** (`api.py`):
  - New endpoint: `POST /auth/login` accepts `school_id`
  - Returns JWT token valid for 24 hours
  - Token contains `user_id` and `school_id`
  - All protected endpoints require valid JWT

- **Frontend** (`src/components/Login.jsx`):
  - Simple login form with school ID input
  - Stores token in `localStorage`
  - Redirects to chat after successful login
  - Shows error messages for failed login

### 2. **Conversation Memory**
- **Backend** (`api.py`):
  - `QueryRequest` now accepts `conversation_history` (list of past messages)
  - Enriches user question with last 4 messages for context
  - Injects conversation into RAG prompt automatically

- **Frontend** (`src/App.jsx`):
  - Builds conversation history from `chatHistory` state
  - Sends it with each query
  - Backend uses it to provide contextual answers

### 3. **Auto-Initialize Index on Startup**
- **Backend** (`api.py`):
  - `@app.on_event("startup")` runs when server starts
  - Automatically builds RAG index with default parameters (chunk_size=100, overlap=20)
  - Logs status to console
  - No manual "Build Index" button needed on first run

---

## 🚀 How to Use

### Backend Setup

1. **Install JWT dependency** (already done):
   ```bash
   pip install pyjwt
   ```

2. **Set environment variables** in `.env`:
   ```
   OPENAI_API_KEY=your_key_here
   SECRET_KEY=your_secret_key_here_change_in_production
   ```

3. **Start the backend**:
   ```bash
   python api.py
   ```
   
   You should see:
   ```
   🚀 Starting RAG system initialization...
   ✅ RAG system initialized successfully!
   INFO:     Uvicorn running on http://0.0.0.0:8000
   ```

### Frontend Setup

1. **Start the frontend** (in `frontend/` directory):
   ```bash
   npm run dev
   ```

2. **Login**:
   - Enter any school ID (e.g., `STU001`)
   - Click "Login"
   - You'll get a JWT token stored in `localStorage`

3. **Chat**:
   - Ask questions
   - The backend will use conversation history for context
   - Each message is enriched with previous messages

4. **Logout**:
   - Click the logout button (exit icon) in header
   - Clears token and chat history

---

## 📊 API Endpoints

### Public Endpoints
- `GET /health` - Health check
- `GET /status` - RAG system status
- `GET /docs-info` - List available PDFs
- `POST /auth/login` - Login with school ID

### Protected Endpoints (require JWT)
- `POST /query` - Query RAG with memory
- `POST /build-index` - Manually rebuild index

### Request/Response Examples

**Login:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"school_id": "STU001"}'
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user_id": "user_STU001"
}
```

**Query with Memory:**
```bash
curl -X POST http://localhost:8000/query \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d {
    "question": "What is this about?",
    "use_web_search": false,
    "conversation_history": [
      {"role": "user", "content": "Previous question"},
      {"role": "assistant", "content": "Previous answer"}
    ]
  }
```

---

## 🔐 Security Notes

### Current (Development)
- JWT secret is in `.env` (change it!)
- School ID validation is minimal (accepts any non-empty string)
- No rate limiting

### For Production
1. **Use strong SECRET_KEY**:
   ```python
   import secrets
   print(secrets.token_urlsafe(32))
   ```

2. **Validate school IDs**:
   - Check against a database or list
   - Use SSO/OAuth if available
   - Add email verification

3. **Add rate limiting**:
   ```bash
   pip install slowapi
   ```

4. **Use HTTPS**:
   - Deploy behind Nginx/Apache
   - Use Let's Encrypt SSL

5. **CORS restrictions**:
   - Change `allow_origins=["*"]` to your frontend domain

---

## 📝 Next Steps (Optional)

### 1. Add Supabase for Analytics
```python
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Log messages to Supabase
supabase.table("messages").insert({
    "user_id": user.user_id,
    "question": request.question,
    "answer": result["answer"],
    "created_at": datetime.utcnow().isoformat()
}).execute()
```

### 2. Improve Memory Strategy
- Store conversations in database
- Retrieve full conversation history (not just last 4 messages)
- Add conversation summaries for long chats

### 3. Add User Management
- Create users table in database
- Track login history
- Add user preferences

---

## 🐛 Troubleshooting

**"Invalid token" error**
- Check if token is in `Authorization: Bearer <token>` header
- Verify token hasn't expired (24 hours)
- Check `SECRET_KEY` matches between frontend and backend

**"RAG system not initialized"**
- Check if `docs/` folder exists with PDFs
- Check `OPENAI_API_KEY` is set
- Look for errors in startup logs

**Frontend shows login but can't submit**
- Check browser console for errors
- Verify backend is running on `http://localhost:8000`
- Check CORS is enabled in backend

---

## 📚 Files Modified

- `api.py` - Added auth, memory, auto-init
- `src/api.js` - Added login endpoint, JWT interceptor
- `src/App.jsx` - Added login flow, memory building
- `src/components/Login.jsx` - New login component

---

## 🎯 Key Features Summary

| Feature | Status | Details |
|---------|--------|---------|
| School ID Auth | ✅ | JWT-based, 24h expiry |
| Conversation Memory | ✅ | Last 4 messages injected into prompt |
| Auto-Init Index | ✅ | Runs on backend startup |
| Logout | ✅ | Clears token and chat |
| Error Handling | ✅ | User-friendly messages |
| Production Ready | ⚠️ | Add Supabase logging for full production |

---

**Ready to deploy! 🚀**
