import { getBackendUrl, handleApiResponse, ApiError } from "./api.config";

function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export interface CreateSubscriptionResponse {
  success: boolean;
  alreadyPro?: boolean;
  razorpay?: { subscriptionId: string };
}

export interface CancelSubscriptionResponse {
  success: boolean;
  alreadyFree?: boolean;
}

export const billingApi = {
  async createProSubscription(token: string): Promise<CreateSubscriptionResponse> {
    const url = getBackendUrl();
    if (!url) throw new ApiError("Backend URL not configured");
    const res = await fetch(`${url}/api/v1/billing/razorpay/subscription`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ source: "web" }),
    });
    return handleApiResponse<CreateSubscriptionResponse>(res);
  },

  async cancelProSubscription(token: string): Promise<CancelSubscriptionResponse> {
    const url = getBackendUrl();
    if (!url) throw new ApiError("Backend URL not configured");
    const res = await fetch(`${url}/api/v1/billing/razorpay/cancel`, {
      method: "POST",
      headers: authHeaders(token),
    });
    return handleApiResponse<CancelSubscriptionResponse>(res);
  },
};
