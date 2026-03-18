import { getAuthHeaders, handleApiResponse, ApiError } from './api.config';

export interface CreateProSubscriptionResponse {
  success: boolean;
  alreadyPro?: boolean;
  razorpay?: {
    subscriptionId: string;
    shortUrl?: string;
    status?: string;
  };
}

export class BillingApi {
  constructor(
    private backendUrl: string,
    private getToken: () => Promise<string | null>
  ) {}

  async createProSubscription(): Promise<CreateProSubscriptionResponse> {
    const headers = await getAuthHeaders(this.getToken);

    const response = await fetch(`${this.backendUrl}/api/v1/billing/razorpay/subscription`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ source: 'desktop' }),
    });

    const data = await handleApiResponse<CreateProSubscriptionResponse>(response);
    if (!data?.success) throw new ApiError('Failed to create subscription');
    return data;
  }
}

