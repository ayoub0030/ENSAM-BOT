import React, { useState, useEffect } from 'react'
import { ragAPI } from '../api'

export default function SettingsPanel({
  indexBuilt,
  loading,
  onBuildIndex,
  onClearHistory,
  chunkSize,
  setChunkSize,
  chunkOverlap,
  setChunkOverlap,
  useWebSearch,
  setUseWebSearch,
  error,
  docsInfo,
  onClose,
  schoolId,
}) {
  const [ensam_info, setEnsam_info] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [infoError, setInfoError] = useState(null)

  // Load user info on mount
  useEffect(() => {
    if (schoolId) {
      loadUserInfo()
    }
  }, [schoolId])

  const loadUserInfo = async () => {
    try {
      const response = await ragAPI.getUserInfo(schoolId)
      setEnsam_info(response.data.ensam_info)
    } catch (err) {
      // User info doesn't exist yet, that's fine
      console.log('No existing user info')
    }
  }

  const handleSaveInfo = async () => {
    if (!ensam_info.trim()) {
      setInfoError('Please enter your ENSAM information')
      return
    }

    setSaving(true)
    setInfoError(null)
    setSaveSuccess(false)

    try {
      await ragAPI.saveUserInfo(schoolId, ensam_info)
      setSaveSuccess(true)
      setEnsam_info('') // Clear the textarea after save
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setInfoError(err.response?.data?.detail || 'Failed to save information')
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="w-full md:w-80 border-l border-slate-800 bg-slate-950/60 backdrop-blur-sm overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-white">Your Information</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-700 rounded transition text-slate-400 hover:text-white md:hidden"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content - Scrollable Area */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {/* Saved Information History - Top */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-slate-200">📌 Your Saved Information</h3>
          
          {ensam_info ? (
            <div className="p-3 bg-slate-900/70 border border-sky-500/40 rounded-lg">
              <p className="text-sm text-slate-200 whitespace-pre-wrap break-words">{ensam_info}</p>
              <p className="text-xs text-slate-400 mt-2">Last updated: Just now</p>
            </div>
          ) : (
            <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-center">
              <p className="text-xs text-slate-400">No information saved yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Input Section - Bottom */}
      <div className="px-4 py-4 border-t border-slate-800 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">Add New Information</h3>

        {infoError && (
          <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs">
            {infoError}
          </div>
        )}

        {saveSuccess && (
          <div className="p-2 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-xs">
            ✅ Information saved successfully
          </div>
        )}

        <textarea
          value={ensam_info}
          onChange={(e) => setEnsam_info(e.target.value)}
          placeholder="Enter information about your ENSAM profile, background, or interests..."
          className="w-full h-24 px-3 py-2 bg-slate-900 text-white placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none text-sm"
        />

        <button
          onClick={handleSaveInfo}
          disabled={saving || !ensam_info.trim()}
          className={`w-full py-2 px-3 rounded-lg font-semibold transition text-sm ${
            saving
              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
              : ensam_info.trim()
              ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:from-sky-400 hover:to-indigo-400'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          {saving ? '💾 Saving...' : '💾 Save Information'}
        </button>
      </div>
    </div>
  )
}
