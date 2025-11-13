import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export interface ConversationItem {
  question: string;
  sql: string;
  rowCount?: number;
  timestamp: number;
  executionTime?: number;
}

export interface QueryResult {
  success: boolean;
  prompt?: string;
  generatedSQL?: string;
  explanation?: string;
  results?: {
    rows: any[];
    rowCount: number;
    executionTime: number;
    fields: string[];
  };
  error?: string;
  metadata?: {
    attempts?: number;
    relevantTables?: string[];
    totalTime?: number;
    enhanced?: boolean;
  };
}

export interface SchemaResponse {
  success: boolean;
  schema: Record<string, Array<{ column: string; type: string; nullable: boolean }>>;
  formatted: string;
}

export interface StatsResponse {
  success: boolean;
  stats: Array<{
    schemaname: string;
    tablename: string;
    size: string;
    row_count: number;
  }>;
}

export interface HealthResponse {
  status: string;
  database: string;
  timestamp: string;
}

export const apiService = {
  // Health check
  async checkHealth(): Promise<HealthResponse> {
    const response = await api.get<HealthResponse>('/health');
    return response.data;
  },

  // Get database schema
  async getSchema(): Promise<SchemaResponse> {
    const response = await api.get<SchemaResponse>('/schema');
    return response.data;
  },

  // Get database statistics
  async getStats(): Promise<StatsResponse> {
    const response = await api.get<StatsResponse>('/stats');
    return response.data;
  },

  // Natural language query
  async query(prompt: string, conversationHistory: ConversationItem[] = []): Promise<QueryResult> {
    const response = await api.post<QueryResult>('/query', { 
      prompt,
      conversationHistory: conversationHistory.slice(-5) // Send last 5 conversations
    });
    return response.data;
  },

  // Execute raw SQL
  async execute(sql: string): Promise<QueryResult> {
    const response = await api.post<QueryResult>('/execute', { sql });
    return response.data;
  },
};

