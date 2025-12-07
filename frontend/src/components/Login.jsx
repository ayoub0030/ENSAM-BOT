import React, { useState } from 'react'
import { ragAPI } from '../api'

export default function Login({ onLoginSuccess }) {
  const [schoolId, setSchoolId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await ragAPI.login(schoolId)
      const { user_id, school_id } = response.data

      // Store user info
      localStorage.setItem('user_id', user_id)
      localStorage.setItem('school_id', school_id)

      onLoginSuccess({ user_id, school_id })
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500 flex items-center justify-center mx-auto">
            <span className="text-2xl">✦</span>
          </div>
          <h1 className="text-3xl font-bold text-white">ENSAM</h1>
          <p className="text-slate-400">RAG Assistant</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              School ID
            </label>
            <input
              type="text"
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              placeholder="Enter your school ID"
              disabled={loading}
              className="w-full px-4 py-3 bg-slate-900 text-white placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 transition"
            />
            <p className="text-xs text-slate-400">
              Your unique school identifier
            </p>
          </div>

          {isSignUp && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-200">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-slate-900 text-white placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 transition"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-200">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-slate-900 text-white placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 transition"
                />
              </div>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !schoolId.trim() || (isSignUp && (!email.trim() || !password.trim()))}
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-lg font-semibold hover:from-sky-400 hover:to-indigo-400 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>{isSignUp ? 'Creating account...' : 'Logging in...'}</span>
              </>
            ) : (
              <span>{isSignUp ? 'Sign Up' : 'Login'}</span>
            )}
          </button>
        </form>

        {/* Toggle Sign Up / Login */}
        <div className="text-center text-sm">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
              setEmail('')
              setPassword('')
            }}
            className="text-sky-400 hover:text-sky-300 transition"
          >
            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          <p>🔒 Secure authentication with your school ID</p>
        </div>
      </div>
    </div>
  )
}
