import { PlanType } from "../schema/subscription.schema.js";

export const PLAN_LIMITS_TOKENS: Record<PlanType, number> = {
  [PlanType.FREE]: 100000,
  [PlanType.PRO]: 250000,
  [PlanType.PREMIUM]: 500000,
  [PlanType.ENTERPRISE]: 1000000,
};

