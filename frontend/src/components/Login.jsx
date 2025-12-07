import React, { useState } from 'react'
import { ragAPI } from '../api'

export default function Login({ onLoginSuccess }) {
  const [schoolId, setSchoolId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!schoolId.trim()) {
      setError('Please enter your school ID')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await ragAPI.login(schoolId.trim())
      const data = response.data
      localStorage.setItem('school_id', data.school_id)
      onLoginSuccess(data.school_id)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="flex items-center justify-center px-4 py-6 border-b border-slate-800 bg-slate-950/60 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">✦</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">ENSAM</h1>
            <p className="text-xs text-slate-400">RAG Assistant</p>
          </div>
        </div>
      </header>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500 flex items-center justify-center">
              <span className="text-4xl">👤</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
            <p className="text-slate-400">Enter your school ID to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                School ID
              </label>
              <input
                type="text"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                placeholder="e.g., STU-2024-001"
                disabled={loading}
                className="w-full px-4 py-3 bg-slate-900 text-white placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 transition"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-lg font-semibold hover:from-sky-400 hover:to-indigo-400 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Info */}
          <div className="p-4 bg-sky-500/10 border border-sky-500/40 rounded-lg text-sm text-slate-300">
            <p className="font-semibold mb-1">Demo Mode</p>
            <p className="text-xs text-slate-400">
              Enter any school ID to get started. Your conversation history will be saved for this session.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
