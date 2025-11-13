'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, CircleDot, Menu, X, Database } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import ChatMessage from '@/components/ChatMessage';
import ChatSessions, { ChatSession } from '@/components/ChatSessions';
import { apiService, QueryResult } from '@/lib/api';

const SESSIONS_STORAGE_KEY = 'promptDashboard_chatSessions';
const ACTIVE_SESSION_KEY = 'promptDashboard_activeSession';

export default function Home() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    checkConnection();
    loadSessions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeSessionId, sessions]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [query]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  const checkConnection = async () => {
    try {
      const health = await apiService.checkHealth();
      setIsConnected(health.database === 'connected');
    } catch (err) {
      setIsConnected(false);
    }
  };

  const loadSessions = () => {
    try {
      const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
      const activeId = localStorage.getItem(ACTIVE_SESSION_KEY);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        setSessions(parsed);
        
        if (activeId && parsed.find((s: ChatSession) => s.id === activeId)) {
          setActiveSessionId(activeId);
        } else if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      } else {
        // Create first session
        createNewSession();
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
      createNewSession();
    }
  };

  const saveSessions = (updatedSessions: ChatSession[], activeId?: string) => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));
      if (activeId) {
        localStorage.setItem(ACTIVE_SESSION_KEY, activeId);
      }
      setSessions(updatedSessions);
    } catch (err) {
      console.error('Failed to save sessions:', err);
    }
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    const updated = [newSession, ...sessions];
    saveSessions(updated, newSession.id);
    setActiveSessionId(newSession.id);
  };

  const deleteSession = (sessionId: string) => {
    const updated = sessions.filter(s => s.id !== sessionId);
    saveSessions(updated);
    
    if (activeSessionId === sessionId) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
        localStorage.setItem(ACTIVE_SESSION_KEY, updated[0].id);
      } else {
        createNewSession();
      }
    }
  };

  const getCurrentSession = (): ChatSession | undefined => {
    return sessions.find(s => s.id === activeSessionId);
  };

  const updateSession = (sessionId: string, updates: Partial<ChatSession>) => {
    const updated = sessions.map(s => 
      s.id === sessionId ? { ...s, ...updates, updatedAt: Date.now() } : s
    );
    saveSessions(updated);
  };

  const addMessage = (
    type: 'user' | 'assistant',
    content: string,
    extra?: {
      sql?: string;
      results?: any;
      explanation?: string;
      metadata?: any;
    }
  ) => {
    const session = getCurrentSession();
    if (!session) return;

    const newMessage = {
      type,
      content,
      timestamp: Date.now(),
      ...extra,
    };

    const updatedMessages = [...session.messages, newMessage];
    
    // Update title if first user message
    let title = session.title;
    if (type === 'user' && session.messages.length === 0) {
      title = content.length > 50 ? content.substring(0, 50) + '...' : content;
    }

    updateSession(session.id, { messages: updatedMessages, title });
  };

  const handleQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;
    
    setIsLoading(true);
    setQuery('');

    try {
      // Get current session before adding message
      const session = getCurrentSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      // Build conversation history from current session messages
      const conversationHistory: Array<{
        question: string;
        sql: string;
        rowCount?: number;
        timestamp: number;
        executionTime?: number;
      }> = [];
      
      for (let i = 0; i < session.messages.length - 1; i++) {
        const current = session.messages[i];
        const next = session.messages[i + 1];
        
        // If current is user message and next is assistant with SQL
        if (current.type === 'user' && next.type === 'assistant' && next.sql) {
          conversationHistory.push({
            question: current.content,
            sql: next.sql,
            rowCount: next.results?.rowCount,
            timestamp: current.timestamp,
            executionTime: next.results?.executionTime,
          });
        }
      }

      // Add user message
      const userMessage = {
        type: 'user' as const,
        content: queryText,
        timestamp: Date.now(),
      };
      
      const messagesWithUser = [...session.messages, userMessage];
      
      // Update title if first user message
      let title = session.title;
      if (session.messages.length === 0) {
        title = queryText.length > 50 ? queryText.substring(0, 50) + '...' : queryText;
      }
      
      // Update session with user message
      updateSession(session.id, { messages: messagesWithUser, title });

      // Call API
      const response = await apiService.query(queryText, conversationHistory);
      
      // Add assistant message
      if (response.success) {
        const assistantMessage = {
          type: 'assistant' as const,
          content: response.explanation || 'Query executed successfully',
          timestamp: Date.now(),
          sql: response.generatedSQL,
          results: response.results,
          explanation: response.explanation,
          metadata: response.metadata,
        };
        
        const messagesWithAssistant = [...messagesWithUser, assistantMessage];
        updateSession(session.id, { messages: messagesWithAssistant });
      } else {
        const errorMessage = {
          type: 'assistant' as const,
          content: `Error: ${response.error || 'Failed to execute query'}`,
          timestamp: Date.now(),
        };
        
        const messagesWithError = [...messagesWithUser, errorMessage];
        updateSession(session.id, { messages: messagesWithError });
      }
    } catch (err: any) {
      const session = getCurrentSession();
      if (session) {
        const errorMessage = {
          type: 'assistant' as const,
          content: `Error: ${err.response?.data?.error || err.message || 'An error occurred'}`,
          timestamp: Date.now(),
        };
        
        updateSession(session.id, { 
          messages: [...session.messages, errorMessage] 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleQuery(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const currentSession = getCurrentSession();
  const exampleQueries = [
    'How many users from Kenya?',
    'Show me all tables',
    'Count records in each table',
    'Show data created in the last 30 days',
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? 'w-64' : 'w-0'
        } transition-all duration-300 border-r border-gray-200 overflow-hidden`}
      >
        <ChatSessions
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onNewSession={createNewSession}
          onDeleteSession={deleteSession}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-gray-200">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {showSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {currentSession?.title || 'AI Database Assistant'}
                  </h1>
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

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {currentSession && currentSession.messages.length === 0 ? (
            /* Welcome Screen */
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-500/30 mb-6">
                <Database className="h-10 w-10 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                What can I help you with?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mb-8">
                Ask me anything about your database in natural language
              </p>

              {/* Example Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
                {exampleQueries.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(example)}
                    className="text-left p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                  >
                    <p className="text-sm text-gray-700 group-hover:text-blue-700">
                      {example}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Chat Messages */
            <div className="py-4">
              {currentSession?.messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  type={message.type}
                  content={message.content}
                  sql={message.sql}
                  results={message.results}
                  explanation={message.explanation}
                  timestamp={message.timestamp}
                  metadata={message.metadata}
                />
              ))}
              
              {isLoading && (
                <div className="flex gap-4 py-6 px-4 sm:px-6 bg-gray-50/50 max-w-4xl mx-auto">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div className="flex-1 pt-1 max-w-[85%]">
                    <div className="text-sm font-medium text-gray-900 mb-2">Assistant</div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <LoadingSpinner size="sm" />
                      <span className="text-sm">Generating SQL query...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about your database..."
                rows={1}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none transition-all"
                style={{ maxHeight: '200px' }}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="absolute right-2 bottom-2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <p className="text-xs text-gray-500 text-center mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
