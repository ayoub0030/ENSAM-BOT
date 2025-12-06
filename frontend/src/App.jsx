import React, { useState, useEffect, useRef } from 'react'
import { ragAPI } from './api'
import ChatArea from './components/ChatArea'
import SettingsPanel from './components/SettingsPanel'

export default function App() {
  const [indexBuilt, setIndexBuilt] = useState(false)
  const [loading, setLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const [useWebSearch, setUseWebSearch] = useState(false)
  const [chunkSize, setChunkSize] = useState(1000)
  const [chunkOverlap, setChunkOverlap] = useState(200)
  const [docsInfo, setDocsInfo] = useState(null)
  const [error, setError] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef(null)

  // Check initial status
  useEffect(() => {
    checkStatus()
    fetchDocsInfo()
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const checkStatus = async () => {
    try {
      const response = await ragAPI.getStatus()
      setIndexBuilt(response.data.index_built)
      setError(null)
    } catch (err) {
      console.error('Error checking status:', err)
      setError('Failed to connect to backend')
    }
  }

  const fetchDocsInfo = async () => {
    try {
      const response = await ragAPI.getDocsInfo()
      setDocsInfo(response.data)
    } catch (err) {
      console.error('Error fetching docs info:', err)
    }
  }

  const handleBuildIndex = async () => {
    setLoading(true)
    setError(null)
    try {
      await ragAPI.buildIndex(chunkSize, chunkOverlap)
      setIndexBuilt(true)
      setChatHistory([])
    } catch (err) {
      setError(err.response?.data?.detail || 'Error building index')
    } finally {
      setLoading(false)
    }
  }

  const handleQuery = async (question) => {
    if (!question.trim()) return

    setLoading(true)
    setError(null)
    try {
      const response = await ragAPI.query(question, useWebSearch)
      setChatHistory([
        ...chatHistory,
        {
          question,
          answer: response.data.answer,
          sources: response.data.sources,
          webResults: response.data.web_results,
        },
      ])
    } catch (err) {
      setError(err.response?.data?.detail || 'Error querying RAG system')
    } finally {
      setLoading(false)
    }
  }

  const handleClearHistory = () => {
    setChatHistory([])
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 md:px-6 border-b border-slate-800 bg-slate-950/60 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">✦</span>
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white">ENSAM</h1>
            <p className="text-xs text-slate-400">RAG Assistant</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${indexBuilt ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-300 hover:text-white"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatArea
            indexBuilt={indexBuilt}
            loading={loading}
            chatHistory={chatHistory}
            onQuery={handleQuery}
            error={error}
            messagesEndRef={messagesEndRef}
          />
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <SettingsPanel
            indexBuilt={indexBuilt}
            loading={loading}
            onBuildIndex={handleBuildIndex}
            onClearHistory={handleClearHistory}
            chunkSize={chunkSize}
            setChunkSize={setChunkSize}
            chunkOverlap={chunkOverlap}
            setChunkOverlap={setChunkOverlap}
            useWebSearch={useWebSearch}
            setUseWebSearch={setUseWebSearch}
            error={error}
            docsInfo={docsInfo}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    </div>
  )
}
