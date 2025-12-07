# Supabase Setup Guide for ENSAM RAG

## 🎯 What is Supabase?

Supabase is a **PostgreSQL database** with built-in authentication, real-time features, and a REST API. It's perfect for storing user data, conversations, and analytics.

---

## 📋 Step 1: Create a Supabase Account

1. Go to **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with email or GitHub
4. Create a new organization (name it whatever you want)
5. Create a new project:
   - **Project name**: `ensam-rag`
   - **Database password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
6. Wait for the project to initialize (2-3 minutes)

---

## 🗄️ Step 2: Create Database Tables

Once your project is ready, go to **SQL Editor** and run these queries:

### Table 1: Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_users_email ON users(email);
```

### Table 2: Conversations
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
```

### Table 3: Messages
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  sources JSONB, -- Store source documents as JSON
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
```

### Table 4: Analytics (Optional)
```sql
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query_count INT DEFAULT 0,
  total_tokens_used INT DEFAULT 0,
  last_query_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_user_id ON analytics(user_id);
```

---

## 🔑 Step 3: Get Your Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon key**: Public key (safe to expose in frontend)
   - **service_role key**: Secret key (NEVER expose, backend only)

3. Add to your `.env` file:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

---

## 🔐 Step 4: Set Row Level Security (RLS)

This ensures users can only see their own data.

Go to **Authentication** → **Policies** and add:

### For `users` table:
```sql
-- Users can only read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (id = auth.uid());

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (id = auth.uid());
```

### For `conversations` table:
```sql
-- Users can only see their own conversations
CREATE POLICY "Users can read own conversations" ON conversations
  FOR SELECT USING (user_id = auth.uid());

-- Users can create conversations
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update own conversations
CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete own conversations
CREATE POLICY "Users can delete own conversations" ON conversations
  FOR DELETE USING (user_id = auth.uid());
```

### For `messages` table:
```sql
-- Users can read messages from their conversations
CREATE POLICY "Users can read own messages" ON messages
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert messages
CREATE POLICY "Users can insert messages" ON messages
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

---

## 💻 Step 5: Install Supabase Client

```bash
pip install supabase
```

---

## 🔗 Step 6: Integrate with Backend

Update your `api.py`:

```python
from supabase import create_client, Client
import uuid
import bcrypt

# Initialize Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Update signup endpoint to store user in database
@app.post("/auth/signup", response_model=AuthResponse)
def signup(request: SignUpRequest):
    """Sign up with school ID, email, and password"""
    school_id = request.school_id.strip()
    email = request.email.strip()
    password = request.password.strip()
    
    if not school_id or not email or not password:
        raise HTTPException(status_code=400, detail="All fields are required")
    
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    try:
        # Hash password
        password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        
        # Create user in Supabase
        user_id = str(uuid.uuid4())
        supabase.table("users").insert({
            "id": user_id,
            "school_id": school_id,
            "email": email,
            "password_hash": password_hash
        }).execute()
        
        # Create JWT token
        access_token = create_access_token(
            data={"sub": user_id, "school_id": school_id, "email": email}
        )
        
        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=user_id
        )
    
    except Exception as e:
        if "duplicate" in str(e).lower():
            raise HTTPException(status_code=400, detail="School ID or email already exists")
        raise HTTPException(status_code=500, detail=str(e))

# Update login to verify password
@app.post("/auth/login", response_model=AuthResponse)
def login(request: LoginRequest):
    """Login with school ID"""
    school_id = request.school_id.strip()
    if not school_id:
        raise HTTPException(status_code=400, detail="school_id cannot be empty")
    
    try:
        # Get user from Supabase
        response = supabase.table("users").select("*").eq("school_id", school_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=401, detail="Invalid school ID")
        
        user = response.data[0]
        user_id = user["id"]
        email = user["email"]
        
        # Create JWT token
        access_token = create_access_token(
            data={"sub": user_id, "school_id": school_id, "email": email}
        )
        
        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=user_id
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Log messages to Supabase
@app.post("/query")
def query(request: QueryRequest, user: CurrentUser = Depends(get_current_user)) -> QueryResponse:
    """Query the RAG system with conversation memory"""
    global rag_instance
    
    if rag_instance is None or rag_instance.vectorstore is None:
        raise HTTPException(
            status_code=400,
            detail="RAG system not initialized. Please build the index first."
        )
    
    try:
        # Build conversation context from history
        conversation_context = ""
        if request.conversation_history and len(request.conversation_history) > 0:
            recent_messages = request.conversation_history[-4:]
            for msg in recent_messages:
                role = "User" if msg.get("role") == "user" else "Assistant"
                conversation_context += f"{role}: {msg.get('content', '')}\n"
            conversation_context += "\n---\n\n"
        
        enriched_question = conversation_context + f"Current question: {request.question}"
        
        if request.use_web_search:
            result = rag_instance.query_with_web_search(
                enriched_question,
                use_web_search=True
            )
        else:
            result = rag_instance.query(enriched_question)
        
        # Format source documents
        sources = [
            {
                "content": doc.page_content[:1000],
                "page": doc.metadata.get("page", 0) if hasattr(doc, "metadata") else 0
            }
            for doc in result["source_documents"]
        ]
        
        # Log to Supabase (optional, async would be better)
        try:
            supabase.table("messages").insert({
                "user_id": user.user_id,
                "conversation_id": request.conversation_id or str(uuid.uuid4()),
                "role": "user",
                "content": request.question,
                "sources": sources
            }).execute()
            
            supabase.table("messages").insert({
                "user_id": user.user_id,
                "conversation_id": request.conversation_id or str(uuid.uuid4()),
                "role": "assistant",
                "content": result["answer"],
                "sources": sources
            }).execute()
        except Exception as e:
            print(f"Warning: Failed to log to Supabase: {e}")
        
        return QueryResponse(
            answer=result["answer"],
            sources=sources,
            web_results=result.get("web_results", [])
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 📊 Step 7: Query Data from Supabase

### Get user conversations:
```python
response = supabase.table("conversations").select("*").eq("user_id", user_id).execute()
conversations = response.data
```

### Get messages from a conversation:
```python
response = supabase.table("messages").select("*").eq("conversation_id", conversation_id).execute()
messages = response.data
```

### Get user analytics:
```python
response = supabase.table("analytics").select("*").eq("user_id", user_id).execute()
analytics = response.data[0] if response.data else None
```

---

## 🚀 Step 8: Test It

1. **Sign up** with a new school ID
2. **Check Supabase** → **Table Editor** → **users** table
3. You should see your new user!
4. **Ask a question** in the chat
5. **Check messages** table to see the conversation logged

---

## 📝 Environment Variables Summary

```
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT
SECRET_KEY=your_secret_key_here

# OpenAI
OPENAI_API_KEY=your_openai_key_here
```

---

## ⚠️ Security Checklist

- [ ] Never commit `.env` file to Git
- [ ] Use `SUPABASE_SERVICE_ROLE_KEY` only in backend
- [ ] Use `SUPABASE_ANON_KEY` only in frontend
- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Hash passwords with bcrypt before storing
- [ ] Use HTTPS in production
- [ ] Rotate `SECRET_KEY` regularly

---

## 🎓 Next Steps

1. **Implement password verification** in login
2. **Add email verification** for sign-up
3. **Create conversation management** endpoints
4. **Add analytics dashboard** to track usage
5. **Implement conversation history** retrieval

---

**You're all set! 🎉**
