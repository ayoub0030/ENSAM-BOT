import React, { useState } from 'react'
import ChatMessage from './ChatMessage'

const EXAMPLE_QUESTIONS = [
  'What is this document about?',
  'Can you summarize the main topics?',
  'What are the key points?',
  'Tell me about the content',
]

export default function ChatArea({ indexBuilt, loading, chatHistory, onQuery, error, messagesEndRef }) {
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
    <div className="flex flex-col h-full">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            {!indexBuilt ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h2 className="text-xl font-semibold text-white">Setup Required</h2>
                <p className="text-slate-400 max-w-sm">
                  Please configure your API key and build the index from settings to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500 flex items-center justify-center mx-auto">
                  <span className="text-2xl">✦</span>
                </div>
                <h2 className="text-xl font-semibold text-white">Start a Conversation</h2>
                <p className="text-slate-400 max-w-sm">
                  Ask me anything about your documents. I'll search through them and provide accurate answers.
                </p>
                
                {/* Example Questions */}
                <div className="mt-8 space-y-2">
                  <p className="text-xs font-medium text-slate-400 mb-3">Try asking:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-sm">
                    {EXAMPLE_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleExampleQuestion(q)}
                        disabled={loading}
                        className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm rounded-lg transition disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {chatHistory.map((chat, idx) => (
              <ChatMessage key={idx} chat={chat} />
            ))}
            {loading && (
              <div className="flex justify-center py-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 md:mx-6 mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Input Area */}
      {indexBuilt && (
        <div className="px-4 md:px-6 py-4 border-t border-slate-800 bg-slate-950/60 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask me anything..."
              disabled={loading}
              className="flex-1 px-4 py-3 bg-slate-900 text-white placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 transition"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="px-4 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-lg font-medium hover:from-sky-400 hover:to-indigo-400 disabled:opacity-50 transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                </>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-6-4m6 4l6-4" />
                </svg>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
