import React from 'react'

export default function SystemInfo({ indexBuilt, docsInfo }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">📊 System Info</h2>

      {/* Status */}
      <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm font-semibold text-gray-900 mb-1">Status</p>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${indexBuilt ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className="text-sm text-gray-700">
            {indexBuilt ? '✅ RAG System Ready' : '⚠️ Index not built'}
          </span>
        </div>
      </div>

      {/* Documents */}
      {docsInfo && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-900 mb-2">📁 Documents</p>
          {docsInfo.folder_exists ? (
            <>
              <div className="mb-3 p-2 bg-gray-50 rounded">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">{docsInfo.pdf_count}</span> PDF files
                </p>
              </div>
              {docsInfo.files && docsInfo.files.length > 0 && (
                <div className="space-y-1">
                  {docsInfo.files.map((file) => (
                    <p key={file} className="text-xs text-gray-600 truncate">
                      📄 {file}
                    </p>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-red-600">No docs folder found</p>
          )}
        </div>
      )}

      {/* Quick Tips */}
      <div className="pt-4 border-t">
        <p className="text-sm font-semibold text-gray-900 mb-2">💡 Tips</p>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Build index after adding PDFs</li>
          <li>• Enable web search for current info</li>
          <li>• Check sources for accuracy</li>
        </ul>
      </div>
    </div>
  )
}
