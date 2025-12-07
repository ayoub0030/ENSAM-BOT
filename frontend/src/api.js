import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const ragAPI = {
  // Authentication
  login: (schoolId) =>
    api.post('/auth/login', {
      school_id: schoolId,
    }),

  // Health check
  healthCheck: () => api.get('/health'),

  // Build index
  buildIndex: (chunkSize = 100, chunkOverlap = 20) =>
    api.post('/build-index', {
      chunk_size: chunkSize,
      chunk_overlap: chunkOverlap,
    }),

  // Query the RAG system with conversation history
  query: (question, useWebSearch = false, conversationHistory = null) =>
    api.post('/query', {
      question,
      use_web_search: useWebSearch,
      conversation_history: conversationHistory,
    }),

  // Get system status
  getStatus: () => api.get('/status'),

  // Get documents info
  getDocsInfo: () => api.get('/docs-info'),
}

export default api
