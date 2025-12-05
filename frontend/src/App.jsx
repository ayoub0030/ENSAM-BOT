import React, { useState, useEffect } from 'react'
import { ragAPI } from './api'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import SystemInfo from './components/SystemInfo'

export default function App() {
  const [indexBuilt, setIndexBuilt] = useState(false)
  const [loading, setLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const [useWebSearch, setUseWebSearch] = useState(false)
  const [chunkSize, setChunkSize] = useState(1000)
  const [chunkOverlap, setChunkOverlap] = useState(200)
  const [docsInfo, setDocsInfo] = useState(null)
  const [error, setError] = useState(null)

  // Check initial status
  useEffect(() => {
    checkStatus()
    fetchDocsInfo()
  }, [])

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-blue-600">📚 ENSAM RAG System</h1>
          <p className="text-gray-600 mt-1">Retrieval-Augmented Generation with OpenAI</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar
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
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <ChatArea
              indexBuilt={indexBuilt}
              loading={loading}
              chatHistory={chatHistory}
              onQuery={handleQuery}
            />
          </div>

          {/* System Info */}
          <div className="lg:col-span-1">
            <SystemInfo indexBuilt={indexBuilt} docsInfo={docsInfo} />
          </div>
        </div>
      </div>
    </div>
  )
}
