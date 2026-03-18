import { Subscription } from "../schema/index.schema.js";
import { PlanType, SubscriptionStatus } from "../schema/subscription.schema.js";
import { PLAN_LIMITS_TOKENS } from "../utils/plans.js";

export class SubscriptionService {
  async getSubscription(userId: string): Promise<Subscription | null> {
    const subscription = await Subscription.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      order: [["createdAt", "DESC"]],
    });

    return subscription;
  }

  async createSubscription(data: {
    userId: string;
    plan: PlanType;
    status: SubscriptionStatus;
    limit?: number;
    expiresAt?: Date | null;
  }): Promise<Subscription> {
    const defaultLimit = PLAN_LIMITS_TOKENS[data.plan];

    const subscription = await Subscription.create({
      ...data,
      limit: data.limit ?? defaultLimit,
      used: 0,
      expiresAt: data.expiresAt ?? null,
    });
    return subscription;
  }

  async updateSubscription(
    subscription: Subscription,
    data: {
      plan?: PlanType;
      status?: SubscriptionStatus;
      limit?: number;
      used?: number;
      expiresAt?: Date | null;
      razorpayCustomerId?: string | null;
      razorpaySubscriptionId?: string | null;
    }
  ): Promise<Subscription> {
    await subscription.update(data);
    return subscription;
  }
}

