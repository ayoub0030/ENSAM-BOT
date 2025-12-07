import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const ragAPI = {
  // Health check
  healthCheck: () => api.get('/health'),

  // Build index
  buildIndex: (chunkSize = 150, chunkOverlap = 20) =>
    api.post('/build-index', {
      chunk_size: chunkSize,
      chunk_overlap: chunkOverlap,
    }),

  // Query the RAG system
  query: (question, useWebSearch = false) =>
    api.post('/query', {
      question,
      use_web_search: useWebSearch,
    }),

  // Get system status
  getStatus: () => api.get('/status'),

  // Get documents info
  getDocsInfo: () => api.get('/docs-info'),
}

export default api
