'use client';

import { Database, Clock, CheckCircle } from 'lucide-react';

interface ResultsTableProps {
  data: {
    rows: any[];
    rowCount: number;
    executionTime: number;
    fields: string[];
  };
}

export const ResultsTable = ({ data }: ResultsTableProps) => {
  const { rows, rowCount, executionTime, fields } = data;

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    if (typeof value === 'boolean') {
      return value ? '✓' : '✗';
    }
    return String(value);
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="font-medium">{rowCount}</span>
          <span>{rowCount === 1 ? 'result' : 'results'}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="h-4 w-4 text-blue-500" />
          <span className="font-medium">{executionTime}ms</span>
        </div>
      </div>

      {/* Results */}
      {rows.length === 0 ? (
        <div className="text-center py-16">
          <Database className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium">No results found</p>
          <p className="text-sm text-gray-500 mt-1">The query returned no data</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto modern-scrollbar">
            <table className="modern-table">
              <thead>
                <tr>
                  {fields.map((field, index) => (
                    <th key={index} className="whitespace-nowrap">
                      {field}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {fields.map((field, cellIndex) => {
                      const value = row[field];
                      const isNull = value === null || value === undefined;
                      
                      return (
                        <td
                          key={cellIndex}
                          className={`whitespace-nowrap ${
                            isNull ? 'text-gray-400 italic' : 'text-gray-700'
                          }`}
                        >
                          {formatValue(value)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rowCount > rows.length && (
        <p className="text-sm text-gray-500 text-center pt-2">
          Showing {rows.length} of {rowCount} total results
        </p>
      )}
    </div>
  );
};
