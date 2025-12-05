import React, { useState } from 'react'

export default function ChatMessage({ chat }) {
  const [expandedSources, setExpandedSources] = useState(false)
  const [expandedWeb, setExpandedWeb] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      {/* Question */}
      <div>
        <p className="text-sm font-semibold text-gray-600">Q: {chat.question}</p>
      </div>

      {/* Answer */}
      <div className="answer-box">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{chat.answer}</p>
      </div>

      {/* Sources */}
      {chat.sources && chat.sources.length > 0 && (
        <div>
          <button
            onClick={() => setExpandedSources(!expandedSources)}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center"
          >
            <span className="mr-2">{expandedSources ? '▼' : '▶'}</span>
            📄 Sources ({chat.sources.length})
          </button>
          {expandedSources && (
            <div className="mt-2 space-y-2">
              {chat.sources.map((source, idx) => (
                <div key={idx} className="source-box">
                  <p className="font-semibold text-xs text-gray-700 mb-1">Source {idx + 1}</p>
                  <p className="text-xs text-gray-600">{source.content}...</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Web Results */}
      {chat.webResults && chat.webResults.length > 0 && (
        <div>
          <button
            onClick={() => setExpandedWeb(!expandedWeb)}
            className="text-sm font-semibold text-green-600 hover:text-green-800 flex items-center"
          >
            <span className="mr-2">{expandedWeb ? '▼' : '▶'}</span>
            🌐 Web Results ({chat.webResults.length})
          </button>
          {expandedWeb && (
            <div className="mt-2 space-y-2">
              {chat.webResults.map((result, idx) => (
                <div key={idx} className="web-result-box">
                  <p className="font-semibold text-sm text-gray-900 mb-1">
                    {idx + 1}. {result.title || 'No title'}
                  </p>
                  <p className="text-xs text-gray-700 mb-2">{result.body || result.snippet || 'No description'}</p>
                  {result.href && (
                    <a
                      href={result.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      🔗 Visit Link
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
