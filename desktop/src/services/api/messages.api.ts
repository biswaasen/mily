import { MessagesResponse } from '../../types';
import { getAuthHeaders, handleApiResponse } from './api.config';

export class MessagesApi {
  constructor(
    private backendUrl: string,
    private getToken: () => Promise<string | null>
  ) {}

  async getMessages(page: number = 1, limit: number = 20): Promise<MessagesResponse> {
    const headers = await getAuthHeaders(this.getToken);
    
    const response = await fetch(`${this.backendUrl}/api/v1/messages?page=${page}&limit=${limit}`, {
      headers,
    });

    return handleApiResponse<MessagesResponse>(response);
  }
}

