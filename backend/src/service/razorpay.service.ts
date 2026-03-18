import Razorpay from "razorpay";

export type RazorpaySubscriptionCreateResult = {
  subscriptionId: string;
  shortUrl?: string;
  status?: string;
};

export class RazorpayService {
  private client: Razorpay;

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error("Missing Razorpay credentials");
    }
    this.client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  async createCustomer(input: { name: string; email: string }): Promise<string> {
    const c: any = await this.client.customers.create({
      name: input.name,
      email: input.email,
    });
    return String(c.id);
  }

  async createSubscription(input: {
    planId: string;
    customerId: string;
    customerNotify?: 0 | 1;
    totalCount?: number;
  }): Promise<RazorpaySubscriptionCreateResult> {
    const s: any = await (this.client.subscriptions as any).create({
      plan_id: input.planId,
      customer_id: input.customerId,
      customer_notify: input.customerNotify ?? 1,
      total_count: input.totalCount ?? 120,
    });

    return {
      subscriptionId: String(s.id),
      shortUrl: s.short_url ? String(s.short_url) : undefined,
      status: s.status ? String(s.status) : undefined,
    };
  }

  async cancelSubscription(subscriptionId: string, cancelAtCycleEnd = true): Promise<void> {
    await (this.client.subscriptions as any).cancel(subscriptionId, cancelAtCycleEnd);
  }
}

