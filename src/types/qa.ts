export interface QAItem {
  id?: string;
  question: string;
  answer: string;
  keywords: string[];
  created_at?: string;
  updated_at?: string;
  entryType?: 'text' | 'table' | 'api';
  score?: number;
  fileType?: string;
  fileName?: string;
}

export interface User {
  username: string;
  email: string;
  id: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Array<{
    text: string;
    isUser: boolean;
    matches?: Array<{
      question: string;
      answer: string;
      score: number;
    }>;
  }>;
  createdAt: Date;
  isDraft: boolean;
}

export type AIModel = 'knowledge' | 'ai' | 'knowledge-ai' | 'knowledge-ai-local';