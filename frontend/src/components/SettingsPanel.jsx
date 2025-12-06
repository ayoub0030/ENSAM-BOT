import React from 'react'

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
}) {
  return (
    <div className="w-full md:w-80 border-l border-slate-800 bg-slate-950/60 backdrop-blur-sm overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-white">Settings</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-700 rounded transition text-slate-400 hover:text-white md:hidden"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-6">
        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Status */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-200">Status</h3>
          <div className="flex items-center gap-2 p-3 bg-slate-900/70 rounded-lg">
            <div className={`w-3 h-3 rounded-full ${indexBuilt ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
            <span className="text-sm text-slate-300">
              {indexBuilt ? '✅ Ready to chat' : '⚠️ Setup required'}
            </span>
          </div>
        </div>

        {/* RAG Parameters */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">RAG Parameters</h3>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-slate-300">Chunk Size</label>
              <span className="text-sm font-semibold text-cyan-400">{chunkSize}</span>
            </div>
            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={chunkSize}
              onChange={(e) => setChunkSize(Number(e.target.value))}
              disabled={indexBuilt}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 disabled:opacity-50"
            />
            <p className="text-xs text-slate-400 mt-1">Size of text chunks for processing</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-slate-300">Chunk Overlap</label>
              <span className="text-sm font-semibold text-cyan-400">{chunkOverlap}</span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="50"
              value={chunkOverlap}
              onChange={(e) => setChunkOverlap(Number(e.target.value))}
              disabled={indexBuilt}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-50"
            />
            <p className="text-xs text-slate-400 mt-1">Overlap between consecutive chunks</p>
          </div>
        </div>

        {/* Web Search Toggle */}
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-slate-700/30 rounded-lg transition">
            <input
              type="checkbox"
              checked={useWebSearch}
              onChange={(e) => setUseWebSearch(e.target.checked)}
              className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
            />
            <div>
              <p className="text-sm font-medium text-slate-200">Enable Web Search</p>
              <p className="text-xs text-slate-400">Augment answers with real-time web results</p>
            </div>
          </label>
        </div>

        {/* Documents Info */}
        {docsInfo && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-200">Documents</h3>
            {docsInfo.folder_exists ? (
              <div className="p-3 bg-slate-900/70 rounded-lg space-y-2">
                <p className="text-sm text-slate-300">
                  <span className="font-semibold text-cyan-400">{docsInfo.pdf_count}</span> PDF files
                </p>
                {docsInfo.files && docsInfo.files.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {docsInfo.files.map((file) => (
                      <p key={file} className="text-xs text-slate-400 truncate">
                        📄 {file}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-red-400">No docs folder found</p>
            )}
          </div>
        )}

        {/* Setup Info */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-200">Setup</h3>
          <div className="p-3 bg-sky-500/10 border border-sky-500/40 rounded-lg text-sm text-slate-300 space-y-1">
            <p className="font-semibold">Required:</p>
            <p className="text-xs">Make sure your <code className="bg-slate-700 px-1 rounded">.env</code> file contains:</p>
            <code className="block bg-slate-700 p-2 rounded text-xs text-cyan-400 mt-2">OPENAI_API_KEY=your_key</code>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-4 border-t border-slate-800 space-y-2">
        <button
          onClick={onBuildIndex}
          disabled={loading || indexBuilt}
          className={`w-full py-2 px-4 rounded-lg font-semibold transition text-sm ${
            indexBuilt
              ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
              : loading
              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:from-sky-400 hover:to-indigo-400'
          }`}
        >
          {loading ? '⏳ Building...' : indexBuilt ? '✅ Index Built' : '🔨 Build Index'}
        </button>

        <button
          onClick={onClearHistory}
          disabled={loading}
          className="w-full py-2 px-4 rounded-lg font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition disabled:opacity-50 text-sm"
        >
          🗑️ Clear History
        </button>
      </div>
    </div>
  )
}
