import React, { useState } from 'react'
import ChatMessage from './ChatMessage'

const EXAMPLE_QUESTIONS = [
  'What is this document about?',
  'Can you summarize the main topics?',
  'What are the key points?',
  'Tell me about the content',
]

export default function ChatArea({ indexBuilt, loading, chatHistory, onQuery }) {
  const [question, setQuestion] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (question.trim() && !loading) {
      onQuery(question)
      setQuestion('')
    }
  }

  const handleExampleQuestion = (q) => {
    if (!loading) {
      onQuery(q)
    }
  }

  return (
    <div className="space-y-6">
      {/* Query Input */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">💬 Ask Questions</h2>

        {!indexBuilt ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
            👈 Please configure your API key and build the index using the sidebar.
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., What is this document about?"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {loading ? '⏳ Searching...' : '🔍 Ask'}
              </button>
            </form>

            {/* Example Questions */}
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-3">💡 Example Questions:</p>
              <div className="grid grid-cols-1 gap-2">
                {EXAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleExampleQuestion(q)}
                    disabled={loading}
                    className="text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 transition disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Chat History */}
      {chatHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📝 Conversation History</h2>
          <div className="space-y-4">
            {[...chatHistory].reverse().map((chat, idx) => (
              <ChatMessage key={idx} chat={chat} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
