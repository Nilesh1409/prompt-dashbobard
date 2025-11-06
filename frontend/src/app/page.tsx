'use client';

import { useState, useEffect } from 'react';
import { Database, Send, Code2, Table2, Sparkles, CircleDot, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SQLDisplay } from '@/components/SQLDisplay';
import { ResultsTable } from '@/components/ResultsTable';
import { apiService, QueryResult } from '@/lib/api';

export default function Home() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'results' | 'sql'>('results');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const health = await apiService.checkHealth();
      setIsConnected(health.database === 'connected');
    } catch (err) {
      setIsConnected(false);
    }
  };

  const handleQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiService.query(queryText);
      
      if (response.success) {
        setResult(response);
        setActiveTab('results');
      } else {
        setError(response.error || 'Failed to execute query');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleQuery(query);
      setQuery('');
    }
  };

  const exampleQueries = [
    { icon: Database, text: 'Show all tables', query: 'Show me all tables in the database' },
    { icon: Table2, text: 'Count records', query: 'Count the total number of records in each table' },
    { icon: Code2, text: 'Database schema', query: 'What is the database schema?' },
    { icon: Sparkles, text: 'Recent data', query: 'Show me data created in the last 30 days' },
  ];

  return (
    <div className="min-h-screen modern-bg">
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">AI Database Assistant</h1>
              </div>
            </div>
            
            {isConnected !== null && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200">
                <CircleDot 
                  className={`h-3 w-3 ${isConnected ? 'text-green-500 animate-pulse' : 'text-red-500'}`} 
                />
                <span className="text-xs font-medium text-gray-700">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6">
        <div className="py-12">
          {/* Welcome Section (only show when no results) */}
          {!result && !isLoading && !error && (
            <div className="text-center space-y-8 py-12 animate-fade-in">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-500/30">
                <Database className="h-10 w-10 text-white" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-4xl font-bold text-gray-900">
                  What can I help you with?
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Ask me anything about your database in natural language. I'll convert it to SQL and show you the results.
                </p>
              </div>

              {/* Example Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto pt-8">
                {exampleQueries.map((example, index) => {
                  const Icon = example.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(example.query);
                        setTimeout(() => handleQuery(example.query), 100);
                      }}
                      className="gemini-card p-6 text-left group hover:border-blue-200 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1">{example.text}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{example.query}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="gemini-card p-8 text-center animate-fade-in">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-white animate-pulse" />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 animate-ping opacity-20"></div>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">Thinking...</p>
                  <p className="text-sm text-gray-600">Processing your query with AI</p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="gemini-card p-6 border-red-200 bg-red-50/50 animate-fade-in">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 text-xl">⚠️</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">Query Failed</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {result && result.success && !isLoading && (
            <div className="space-y-4 animate-fade-in">
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('results')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-all ${
                    activeTab === 'results'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Table2 className="h-4 w-4" />
                    Results
                    {result.results && (
                      <Badge variant="neutral" size="sm">
                        {result.results.rowCount}
                      </Badge>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('sql')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-all ${
                    activeTab === 'sql'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    SQL Query
                  </div>
                </button>
              </div>

              {/* Tab Content */}
              <div className="gemini-card overflow-hidden">
                {activeTab === 'results' && result.results && (
                  <div className="p-6">
                    <ResultsTable data={result.results} />
                  </div>
                )}
                
                {activeTab === 'sql' && result.generatedSQL && (
                  <div className="p-6">
                    <SQLDisplay 
                      sql={result.generatedSQL} 
                      explanation={result.explanation}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Bottom Input */}
        <div className="sticky bottom-0 left-0 right-0 pb-8 pt-4 bg-gradient-to-t from-white via-white to-transparent">
          <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
            <div className="relative">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask me anything about your database..."
                rows={1}
                className="modern-input modern-scrollbar shadow-2xl shadow-gray-900/10 pr-14 min-h-[56px] max-h-[200px]"
                style={{ fieldSizing: 'content' } as any}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="absolute right-3 bottom-3 w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 flex items-center justify-center"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Press <kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono">Enter</kbd> to send, <kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono">Shift + Enter</kbd> for new line
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
