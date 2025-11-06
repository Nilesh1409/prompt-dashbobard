'use client';

import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Button } from './Button';

interface QueryInputProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
}

const exampleQueries = [
  'Show me all tables in the database',
  'Count the total records in each table',
  'What is the database schema?',
  'Show me data created in the last 30 days',
];

export const QueryInput = ({ onSubmit, isLoading }: QueryInputProps) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query.trim());
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your database... (⌘/Ctrl + Enter to send)"
            rows={4}
            className="w-full px-4 py-3 pr-32 text-base bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 placeholder:text-gray-400"
            disabled={isLoading}
          />
          <div className="absolute bottom-3 right-3">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              disabled={!query.trim() || isLoading}
            >
              {isLoading ? 'Processing' : 'Send'}
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Sparkles className="h-4 w-4" />
        <span className="font-medium">Try these examples:</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {exampleQueries.map((example, index) => (
          <button
            key={index}
            onClick={() => handleExampleClick(example)}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
};

