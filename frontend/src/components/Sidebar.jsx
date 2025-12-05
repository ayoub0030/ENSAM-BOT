import React from 'react'

export default function Sidebar({
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
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">⚙️ Configuration</h2>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* API Key Note */}
      <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-gray-700">
        <p className="font-semibold mb-1">📝 Setup Required:</p>
        <p>Make sure your <code className="bg-gray-100 px-1 rounded">.env</code> file contains:</p>
        <code className="block bg-gray-100 p-2 rounded mt-2 text-xs">OPENAI_API_KEY=your_key</code>
      </div>

      {/* RAG Parameters */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">RAG Parameters</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chunk Size: <span className="text-blue-600">{chunkSize}</span>
          </label>
          <input
            type="range"
            min="100"
            max="2000"
            step="50"
            value={chunkSize}
            onChange={(e) => setChunkSize(Number(e.target.value))}
            disabled={indexBuilt}
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chunk Overlap: <span className="text-blue-600">{chunkOverlap}</span>
          </label>
          <input
            type="range"
            min="0"
            max="500"
            step="50"
            value={chunkOverlap}
            onChange={(e) => setChunkOverlap(Number(e.target.value))}
            disabled={indexBuilt}
            className="w-full"
          />
        </div>
      </div>

      {/* Web Search Toggle */}
      <div className="mb-6 pb-6 border-b">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={useWebSearch}
            onChange={(e) => setUseWebSearch(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="ml-2 text-sm font-medium text-gray-700">🌐 Enable Web Search</span>
        </label>
        <p className="text-xs text-gray-500 mt-2">Augment answers with real-time web results</p>
      </div>

      {/* Build Index Button */}
      <button
        onClick={onBuildIndex}
        disabled={loading || indexBuilt}
        className={`w-full py-2 px-4 rounded font-semibold mb-3 transition ${
          indexBuilt
            ? 'bg-green-100 text-green-700 cursor-not-allowed'
            : loading
            ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {loading ? '⏳ Building...' : indexBuilt ? '✅ Index Built' : '🔨 Build Index'}
      </button>

      {/* Clear History Button */}
      <button
        onClick={onClearHistory}
        disabled={loading}
        className="w-full py-2 px-4 rounded font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition disabled:opacity-50"
      >
        🗑️ Clear History
      </button>

      {/* Status */}
      <div className="mt-6 pt-6 border-t">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${indexBuilt ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className="text-sm font-medium text-gray-700">
            {indexBuilt ? '✅ Ready' : '⚠️ Not Ready'}
          </span>
        </div>
      </div>
    </div>
  )
}
