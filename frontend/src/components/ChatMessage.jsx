import React, { useState } from 'react'

export default function ChatMessage({ chat }) {
  const [expandedSources, setExpandedSources] = useState(false)
  const [expandedWeb, setExpandedWeb] = useState(false)

  return (
    <div className="space-y-3">
      {/* User Message */}
      <div className="flex justify-end">
        <div className="max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl rounded-tr-none bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm">
          {chat.question}
        </div>
      </div>

      {/* Assistant Message */}
      <div className="flex justify-start">
        <div className="max-w-xs md:max-w-md lg:max-w-lg space-y-2">
          <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-slate-700 text-slate-100 text-sm leading-relaxed">
            {chat.answer}
          </div>

          {/* Sources */}
          {chat.sources && chat.sources.length > 0 && (
            <div className="px-3 py-2">
              <button
                onClick={() => setExpandedSources(!expandedSources)}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
              >
                <span>{expandedSources ? '▼' : '▶'}</span>
                <span>📄 Sources ({chat.sources.length})</span>
              </button>
              {expandedSources && (
                <div className="mt-2 space-y-2">
                  {chat.sources.map((source, idx) => (
                    <div key={idx} className="px-3 py-2 bg-slate-600/50 rounded-lg border border-slate-500/30">
                      <p className="font-semibold text-xs text-slate-300 mb-1">Source {idx + 1}</p>
                      <p className="text-xs text-slate-400 line-clamp-3">{source.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Web Results */}
          {chat.webResults && chat.webResults.length > 0 && (
            <div className="px-3 py-2">
              <button
                onClick={() => setExpandedWeb(!expandedWeb)}
                className="text-xs font-semibold text-green-400 hover:text-green-300 flex items-center gap-1 transition"
              >
                <span>{expandedWeb ? '▼' : '▶'}</span>
                <span>🌐 Web Results ({chat.webResults.length})</span>
              </button>
              {expandedWeb && (
                <div className="mt-2 space-y-2">
                  {chat.webResults.map((result, idx) => (
                    <div key={idx} className="px-3 py-2 bg-slate-600/50 rounded-lg border border-slate-500/30">
                      <p className="font-semibold text-xs text-slate-200 mb-1">
                        {idx + 1}. {result.title || 'No title'}
                      </p>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                        {result.body || result.snippet || 'No description'}
                      </p>
                      {result.href && (
                        <a
                          href={result.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-cyan-400 hover:text-cyan-300 transition inline-flex items-center gap-1"
                        >
                          <span>🔗</span>
                          <span>Visit Link</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
