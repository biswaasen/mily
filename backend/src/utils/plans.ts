import { PlanType } from "../schema/subscription.schema.js";

export const PLAN_LIMITS_TOKENS: Record<PlanType, number> = {
  [PlanType.FREE]: 500000,
  [PlanType.PRO]: 5000000,
};

