export interface Source {
  id: number;
  title: string;
  url: string;
  content?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

export interface ConversationItem {
  id: string;
  title: string;
  createdAt?: string;
}

export interface AIModelConfig {
  id: string;
  name: string;
  provider: 'groq' | 'openrouter';
  model: string;
  badge: string;
}
