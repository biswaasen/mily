import { Subscription } from '../../types';
import { getAuthHeaders, handleApiResponse, ApiError } from './api.config';

export interface SubscriptionResponse {
  success: boolean;
  subscription: Subscription;
}

export class SubscriptionApi {
  constructor(
    private backendUrl: string,
    private getToken: () => Promise<string | null>
  ) {}

  async getSubscription(): Promise<Subscription> {
    const headers = await getAuthHeaders(this.getToken);
    
    const response = await fetch(`${this.backendUrl}/api/v1/subscription`, {
      headers,
    });

    const data = await handleApiResponse<SubscriptionResponse>(response);
    
    if (!data.success || !data.subscription) {
      throw new ApiError('Invalid subscription data received');
    }

    return data.subscription;
  }
}

