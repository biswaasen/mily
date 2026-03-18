import { z } from "zod";
import { PlanType, SubscriptionStatus } from "../schema/subscription.schema.js";

export const updateSubscriptionSchema = z.object({
  plan: z.enum([PlanType.FREE, PlanType.PRO]).optional(),
  status: z.enum([SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED, SubscriptionStatus.EXPIRED]).optional(),
  limit: z.number().int().positive().optional(),
  used: z.number().int().min(0).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});
