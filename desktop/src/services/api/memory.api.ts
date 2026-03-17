import { Memory } from '../../types';
import { getAuthHeaders, handleApiResponse } from './api.config';

export class MemoryApi {
  constructor(
    private backendUrl: string,
    private getToken: () => Promise<string | null>
  ) {}

  async getMemories(): Promise<Memory[]> {
    const headers = await getAuthHeaders(this.getToken);
    const response = await fetch(`${this.backendUrl}/api/v1/memory`, { headers });
    const data = await handleApiResponse<{ success: boolean; memories: Memory[] }>(response);
    return data.memories || [];
  }

  async addMemory(content: string, key?: string | null): Promise<void> {
    const headers = await getAuthHeaders(this.getToken);
    const body: { content: string; key?: string } = { content };
    if (typeof key === 'string' && key.trim()) body.key = key.trim();
    const response = await fetch(`${this.backendUrl}/api/v1/memory`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    await handleApiResponse(response);
  }

  async deleteMemory(id: string): Promise<void> {
    const headers = await getAuthHeaders(this.getToken);
    
    const response = await fetch(`${this.backendUrl}/api/v1/memory`, {
      method: 'DELETE',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });

    await handleApiResponse(response);
  }
}
