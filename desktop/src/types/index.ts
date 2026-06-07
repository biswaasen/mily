export type RecordingStatus = 'idle' | 'recording' | 'processing';

export interface Message {
  id: string;
  query: string;
  response: string;
  transcription: string;
  action: Record<string, any> | null;
  createdAt: string;
}

export interface Memory {
  id: string;
  content: string;
  createdAt: string;
}

export interface MessagesResponse {
  messages: Message[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

declare const window: Window & { require: (module: string) => any };
