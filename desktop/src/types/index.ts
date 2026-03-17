export interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture?: string;
  status: string;
}

export interface Subscription {
  id: string;
  plan: string;
  status: string;
  limit: number;
  used: number;
  expiresAt: string | null;
  createdAt: string;
}

export type RecordingStatus = 'idle' | 'recording' | 'processing';

export interface Message {
  id: string;
  query: string;
  response: string;
  intent: "transcribe" | "generate" | "command";
  tokens: number;
  audio: string | null;
  source: "desktop" | "mobile" | "web";
  error: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export interface Memory {
  id: string;
  key: string | null;
  content: string;
  createdAt: string;
}

export interface MessagesResponse {
  success: boolean;
  messages: Message[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

declare const window: Window & { require: (module: string) => any };

