'use client';

import React from 'react';
import { User, Bot, Copy, Check, Clock } from 'lucide-react';
import { SQLDisplay } from './SQLDisplay';
import { ResultsTable } from './ResultsTable';

interface ChatMessageProps {
  type: 'user' | 'assistant';
  content: string;
  sql?: string;
  results?: {
    rows: any[];
    rowCount: number;
    executionTime?: number;
    fields: string[];
  };
  explanation?: string;
  timestamp?: number;
  metadata?: {
    attempts?: number;
    relevantTables?: string[];
    totalTime?: number;
  };
}

export default function ChatMessage({ 
  type, 
  content, 
  sql, 
  results,
  explanation,
  timestamp,
  metadata 
}: ChatMessageProps) {
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'results' | 'sql'>('results');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (type === 'user') {
    return (
      <div className="flex gap-4 py-6 px-4 sm:px-6 max-w-4xl mx-auto justify-end">
        <div className="flex-1 pt-1 flex flex-col items-end">
          <div className="text-sm font-medium text-gray-900 mb-1">You</div>
          <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
            <div className="whitespace-pre-wrap">{content}</div>
          </div>
          {timestamp && (
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
              <Clock className="w-3 h-3" />
              {formatTime(timestamp)}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 py-6 px-4 sm:px-6 bg-gray-50/50 max-w-4xl mx-auto">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
        <Bot className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 pt-1 min-w-0 max-w-[85%]">
        <div className="text-sm font-medium text-gray-900 mb-1">Assistant</div>
        
        {/* Explanation */}
        {explanation && (
          <div className="text-gray-800 mb-4 whitespace-pre-wrap">
            {explanation}
          </div>
        )}

        {/* SQL & Results */}
        {sql && results && (
          <div className="space-y-4">
            {/* Stats Bar */}
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded">
                ✓ {results.rowCount} rows
              </span>
              {results.executionTime !== undefined && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  ⚡ {results.executionTime}ms
                </span>
              )}
              {metadata?.attempts && metadata.attempts > 1 && (
                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
                  🔄 {metadata.attempts} attempts
                </span>
              )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('results')}
                  className={`pb-2 px-1 text-sm font-medium transition-colors ${
                    activeTab === 'results'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Results
                </button>
                <button
                  onClick={() => setActiveTab('sql')}
                  className={`pb-2 px-1 text-sm font-medium transition-colors ${
                    activeTab === 'sql'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  SQL Query
                </button>
              </div>
            </div>

            {/* Content */}
            {activeTab === 'results' ? (
              <ResultsTable rows={results.rows} fields={results.fields} />
            ) : (
              <div className="relative">
                <button
                  onClick={() => copyToClipboard(sql)}
                  className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors z-10"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <SQLDisplay sql={sql} />
              </div>
            )}
          </div>
        )}

        {timestamp && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-3">
            <Clock className="w-3 h-3" />
            {formatTime(timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}

