import { getBackendUrl, handleApiResponse, ApiError } from "./api.config";

export interface Subscription {
  id: string;
  userId: string;
  plan: "free" | "pro";
  status: "active" | "cancelled" | "expired";
  limit: number;
  used: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export const subscriptionApi = {
  async getSubscription(token: string): Promise<Subscription> {
    const url = getBackendUrl();
    if (!url) throw new ApiError("Backend URL not configured");
    const res = await fetch(`${url}/api/v1/subscription`, { headers: authHeaders(token) });
    const data = await handleApiResponse<{ success: boolean; subscription: Subscription }>(res);
    return data.subscription;
  },
};
