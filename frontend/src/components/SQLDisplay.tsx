'use client';

import { useState } from 'react';
import { Copy, Check, Info } from 'lucide-react';

interface SQLDisplayProps {
  sql: string;
  explanation?: string;
}

export const SQLDisplay = ({ sql, explanation }: SQLDisplayProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* SQL Code Block */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Generated SQL Query</h3>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </button>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-gray-800">
          <pre className="bg-gray-900 text-gray-100 p-6 overflow-x-auto modern-scrollbar text-sm leading-relaxed">
            <code>{sql}</code>
          </pre>
        </div>
      </div>

      {/* Explanation */}
      {explanation && (
        <div className="rounded-2xl bg-blue-50 border border-blue-200 p-6">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Info className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">What this query does</h4>
              <p className="text-sm text-blue-800 leading-relaxed">{explanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
