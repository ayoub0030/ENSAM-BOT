# Supabase Setup Guide

This guide explains how to set up Supabase for storing user data and conversations in the ENSAM RAG chatbot.

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project Name**: `ensam-rag` (or your choice)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your location
5. Click "Create new project" and wait for it to initialize

---

## 2. Get Your Credentials

Once your project is created:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → This is your `SUPABASE_URL`
   - **anon public** key → This is your `SUPABASE_KEY`

3. Add them to your `.env` file:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-public-key
```

---

## 3. Create Tables

Go to **SQL Editor** in Supabase and run these SQL commands:

### Table 1: Users
```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  school_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_users_school_id ON users(school_id);
```

### Table 2: Conversations
```sql
CREATE TABLE conversations (
  id BIGSERIAL PRIMARY KEY,
  school_id VARCHAR(255) NOT NULL REFERENCES users(school_id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  question TEXT,
  answer TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_conversations_school_id ON conversations(school_id);
CREATE INDEX idx_conversations_timestamp ON conversations(timestamp);
```

### Table 3: User Info ENSAM
```sql
CREATE TABLE user_info_ensam (
  id BIGSERIAL PRIMARY KEY,
  school_id VARCHAR(255) NOT NULL REFERENCES users(school_id) ON DELETE CASCADE,
  ensam_info TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_user_info_ensam_school_id ON user_info_ensam(school_id);
```

---

## 4. Database Schema

### `users` Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `school_id` | VARCHAR(255) | Unique school ID (login credential) |
| `created_at` | TIMESTAMP | Account creation time |
| `last_login` | TIMESTAMP | Last login time |
| `updated_at` | TIMESTAMP | Last update time |

### `conversations` Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `school_id` | VARCHAR(255) | Foreign key to users |
| `role` | VARCHAR(50) | "user" or "assistant" |
| `question` | TEXT | User's question |
| `answer` | TEXT | Assistant's answer (NULL for user messages) |
| `timestamp` | TIMESTAMP | When message was created |
| `created_at` | TIMESTAMP | Database record creation time |

### `user_info_ensam` Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `school_id` | VARCHAR(255) | Foreign key to users (allows multiple entries per user) |
| `ensam_info` | TEXT | User's ENSAM information/profile |
| `created_at` | TIMESTAMP | When info was created |

---

## 4.5 Fix Existing Table (If Already Created)

If you already created the `user_info_ensam` table with the UNIQUE constraint, run this to fix it:

```sql
-- Drop the unique constraint
ALTER TABLE user_info_ensam DROP CONSTRAINT user_info_ensam_school_id_key;

-- Remove the updated_at column if it exists
ALTER TABLE user_info_ensam DROP COLUMN IF EXISTS updated_at;
```

---

## 5. Install Supabase Python Client

```bash
pip install supabase
```

Update your `requirements.txt`:
```
supabase
```

---

## 6. How It Works

### Login Flow
1. User enters school ID
2. Backend calls `/login` endpoint
3. Backend checks if user exists in `users` table
4. If new user: creates record with `school_id`, `created_at`, `last_login`
5. If existing user: updates `last_login` timestamp

### Query Flow
1. User asks a question
2. Backend calls `/query` endpoint
3. RAG system generates answer
4. Backend saves both question and answer to `conversations` table:
   - One row for user message (role="user", answer=NULL)
   - One row for assistant message (role="assistant", answer=<response>)

---

## 7. Backend Integration

The backend automatically:
- Creates/updates users on login
- Saves all conversations to Supabase
- Continues to work if Supabase is unavailable (graceful degradation)

### Environment Variables Required
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-public-key
```

---

## 8. Query Examples

### Get all users
```sql
SELECT * FROM users ORDER BY last_login DESC;
```

### Get all conversations for a user
```sql
SELECT * FROM conversations 
WHERE school_id = 'STU-2024-001' 
ORDER BY timestamp DESC;
```

### Get user's questions only
```sql
SELECT question, timestamp FROM conversations 
WHERE school_id = 'STU-2024-001' AND role = 'user'
ORDER BY timestamp DESC;
```

### Get user's answers only
```sql
SELECT answer, timestamp FROM conversations 
WHERE school_id = 'STU-2024-001' AND role = 'assistant'
ORDER BY timestamp DESC;
```

### Get conversation count per user
```sql
SELECT school_id, COUNT(*) as message_count 
FROM conversations 
GROUP BY school_id 
ORDER BY message_count DESC;
```

### Get most active users
```sql
SELECT u.school_id, COUNT(c.id) as total_messages, u.last_login
FROM users u
LEFT JOIN conversations c ON u.school_id = c.school_id
GROUP BY u.school_id, u.last_login
ORDER BY total_messages DESC;
```

---

## 9. Row-Level Security (RLS)

For production, enable RLS to restrict data access:

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (school_id = current_user_id());

-- Enable RLS on conversations table
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (school_id = current_user_id());
```

---

## 10. Monitoring & Analytics

### Dashboard Queries

**Active Users Today**
```sql
SELECT COUNT(DISTINCT school_id) FROM users 
WHERE DATE(last_login) = CURRENT_DATE;
```

**Total Messages**
```sql
SELECT COUNT(*) FROM conversations;
```

**Average Messages per User**
```sql
SELECT AVG(msg_count) FROM (
  SELECT COUNT(*) as msg_count FROM conversations 
  GROUP BY school_id
) subquery;
```

**Messages by Hour**
```sql
SELECT DATE_TRUNC('hour', timestamp) as hour, COUNT(*) as count
FROM conversations
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC;
```

---

## 11. Troubleshooting

### "Supabase credentials not found"
- Check `.env` file has `SUPABASE_URL` and `SUPABASE_KEY`
- Restart backend after adding credentials

### "Failed to save user to Supabase"
- Check table names match exactly: `users`, `conversations`
- Verify column names are correct
- Check Supabase project is active
- Look at backend console for detailed error

### "Foreign key constraint violation"
- Ensure user exists in `users` table before adding to `conversations`
- Backend handles this automatically, but check if user creation failed

### Connection Timeout
- Check internet connection
- Verify Supabase URL is correct
- Check if Supabase project is paused (free tier pauses after 1 week inactivity)

---

## 12. Next Steps

1. ✅ Create Supabase project
2. ✅ Get credentials and add to `.env`
3. ✅ Create tables using SQL
4. ✅ Install `supabase` package
5. ✅ Restart backend
6. 🔄 Test login and queries
7. 📊 Monitor conversations in Supabase dashboard
8. 🔐 Enable RLS for production
9. 📈 Set up analytics dashboards

---

## 13. Testing

### Test 1: User Creation
```bash
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"school_id": "STU-2024-001"}'
```

Then check Supabase: `SELECT * FROM users;`

### Test 2: Save Conversation
```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is this about?",
    "use_web_search": false,
    "school_id": "STU-2024-001"
  }'
```

Then check Supabase: `SELECT * FROM conversations WHERE school_id = 'STU-2024-001';`

---

## 14. Production Checklist

- [ ] Enable RLS (Row-Level Security)
- [ ] Use service role key instead of anon key for admin operations
- [ ] Set up backups
- [ ] Enable audit logging
- [ ] Monitor database size and costs
- [ ] Set up alerts for unusual activity
- [ ] Use connection pooling for high traffic
- [ ] Implement rate limiting on API endpoints
- [ ] Encrypt sensitive data before storing
- [ ] Regular security audits

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Python Client](https://github.com/supabase-community/supabase-py)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row-Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
