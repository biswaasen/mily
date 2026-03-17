import type { Context } from "hono";
import { z } from "zod";
import { SubscriptionService } from "../service/subscription.service.js";
import { PlanType, SubscriptionStatus } from "../schema/subscription.schema.js";
import { updateSubscriptionSchema } from "../validations/subscription.validation.js";

const subscriptionService = new SubscriptionService();

export class SubscriptionControllerClass {
  constructor() {
    this.getSubscription = this.getSubscription.bind(this);
    this.updateSubscription = this.updateSubscription.bind(this);
  }

  async getSubscription(c: Context) {
    try {
      const userId = c.get("userId") as string;

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      let subscription = await subscriptionService.getSubscription(userId);

      if (!subscription) {
        subscription = await subscriptionService.createSubscription({
          userId,
          plan: PlanType.FREE,
          status: SubscriptionStatus.ACTIVE,
        });
      }

      return c.json({
        success: true,
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          limit: subscription.limit,
          used: subscription.used,
          expiresAt: subscription.expiresAt,
          createdAt: subscription.createdAt,
        },
      }, 200);
    } catch (error) {
      throw error;
    }
  }

  async updateSubscription(c: Context) {
    try {
      const userId = c.get("userId") as string;

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const body = await c.req.json();
      const parsed = updateSubscriptionSchema.parse(body);

      let subscription = await subscriptionService.getSubscription(userId);

      if (!subscription) {
        return c.json({ error: "Subscription not found" }, 404);
      }

      const updateData: any = {};
      if (parsed.plan) updateData.plan = parsed.plan;
      if (parsed.status) updateData.status = parsed.status;
      if (parsed.limit) updateData.limit = parsed.limit;
      if (parsed.used !== undefined) updateData.used = parsed.used;
      if (parsed.expiresAt !== undefined) {
        updateData.expiresAt = parsed.expiresAt === null ? null : new Date(parsed.expiresAt);
      }

      subscription = await subscriptionService.updateSubscription(subscription, updateData);

      return c.json({
        success: true,
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          limit: subscription.limit,
          used: subscription.used,
          expiresAt: subscription.expiresAt,
          createdAt: subscription.createdAt,
        },
      }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: "Invalid input" }, 400);
      }
      throw error;
    }
  }
}

