'use client';

import React from 'react';
import { MessageSquare, Plus, Trash2, Clock } from 'lucide-react';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Array<{
    type: 'user' | 'assistant';
    content: string;
    timestamp: number;
    sql?: string;
    results?: any;
    explanation?: string;
    metadata?: any;
  }>;
}

interface ChatSessionsProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export default function ChatSessions({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}: ChatSessionsProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const sortedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg font-medium transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {sortedSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageSquare className="w-12 h-12 text-gray-600 mb-3" />
            <p className="text-gray-400 text-sm">No conversations yet</p>
            <p className="text-gray-500 text-xs mt-1">Start a new chat above</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sortedSessions.map((session) => (
              <div
                key={session.id}
                className={`group relative flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all ${
                  activeSessionId === session.id
                    ? 'bg-gray-800'
                    : 'hover:bg-gray-800/50'
                }`}
                onClick={() => onSelectSession(session.id)}
              >
                <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-200 truncate">
                    {session.title}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatTime(session.updatedAt)}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this conversation?')) {
                      onDeleteSession(session.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-600/20 rounded transition-all"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-500 text-center">
          {sessions.length} conversation{sessions.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

