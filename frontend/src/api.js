import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const ragAPI = {
  // Login with school ID
  login: (schoolId) =>
    api.post('/login', {
      school_id: schoolId,
    }),

  // Health check
  healthCheck: () => api.get('/health'),

  // Build index
  buildIndex: (chunkSize = 1000, chunkOverlap = 200) =>
    api.post('/build-index', {
      chunk_size: chunkSize,
      chunk_overlap: chunkOverlap,
    }),

  // Query the RAG system
  query: (question, useWebSearch = false, schoolId = '') =>
    api.post('/query', {
      question,
      use_web_search: useWebSearch,
      school_id: schoolId,
    }),

  // Get system status
  getStatus: () => api.get('/status'),

  // Get documents info
  getDocsInfo: () => api.get('/docs-info'),

  // Add new user ENSAM info entry
  addUserInfo: (schoolId, ensam_info) =>
    api.post('/user-info', {
      school_id: schoolId,
      ensam_info: ensam_info,
    }),

  // Get all user ENSAM info entries
  getUserInfo: (schoolId) =>
    api.get(`/user-info/${schoolId}`),

  // Delete a specific ENSAM info entry
  deleteUserInfo: (infoId) =>
    api.delete(`/user-info/${infoId}`),
}

export default api
