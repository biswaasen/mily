import type { Context } from "hono";
import crypto from "crypto";
import { z } from "zod";
import { SubscriptionService } from "../service/subscription.service.js";
import { UserService } from "../service/user.service.js";
import { RazorpayService } from "../service/razorpay.service.js";
import { AppError } from "../middleware/error.middleware.js";
import { PlanType, SubscriptionStatus } from "../schema/subscription.schema.js";
import { Subscription } from "../schema/index.schema.js";
import { PLAN_LIMITS_TOKENS } from "../utils/plans.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("BillingController");

const UPGRADE_EVENTS = new Set(["subscription.activated", "subscription.charged"]);
const DOWNGRADE_EVENTS = new Set(["subscription.cancelled", "subscription.completed"]);

const createSubscriptionSchema = z.object({
  source: z.enum(["desktop", "web"]).optional(),
});

function verifyWebhookSignature(params: { rawBody: string; signature: string; secret: string }): boolean {
  const expected = crypto
    .createHmac("sha256", params.secret)
    .update(params.rawBody)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(params.signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export class BillingControllerClass {
  private subscriptionService = new SubscriptionService();
  private userService = new UserService();

  constructor() {
    this.createProSubscription = this.createProSubscription.bind(this);
    this.cancelProSubscription = this.cancelProSubscription.bind(this);
    this.razorpayWebhook = this.razorpayWebhook.bind(this);
  }

  async createProSubscription(c: Context) {
    const userId = c.get("userId") as string;
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const planId = process.env.RAZORPAY_PRO_PLAN_ID;
    if (!planId) throw new AppError(500, "Missing Razorpay plan id");

    const body = await c.req.json().catch(() => ({}));
    createSubscriptionSchema.parse(body);

    const [user, subscription] = await Promise.all([
      this.userService.getUser({ userId }),
      this.subscriptionService.getSubscription(userId),
    ]);

    if (!user) throw new AppError(404, "User not found");
    if (!subscription) throw new AppError(404, "Subscription not found");

    if (subscription.plan === PlanType.PRO && subscription.status === SubscriptionStatus.ACTIVE) {
      return c.json({ success: true, alreadyPro: true });
    }

    if (subscription.razorpaySubscriptionId && subscription.plan === PlanType.FREE) {
      return c.json({
        success: true,
        razorpay: { subscriptionId: subscription.razorpaySubscriptionId },
      });
    }

    const razorpay = new RazorpayService();

    let customerId = subscription.razorpayCustomerId;
    if (!customerId) {
      customerId = await razorpay.createCustomer({ name: user.name, email: user.email });
      await this.subscriptionService.updateSubscription(subscription, { razorpayCustomerId: customerId });
    }

    const rpSub = await razorpay.createSubscription({
      planId,
      customerId,
      customerNotify: 1,
      totalCount: 120,
    });

    await this.subscriptionService.updateSubscription(subscription, {
      razorpaySubscriptionId: rpSub.subscriptionId,
    });

    return c.json({
      success: true,
      razorpay: { subscriptionId: rpSub.subscriptionId },
    });
  }

  async cancelProSubscription(c: Context) {
    const userId = c.get("userId") as string;
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const subscription = await this.subscriptionService.getSubscription(userId);
    if (!subscription) throw new AppError(404, "Subscription not found");

    if (subscription.plan !== PlanType.PRO) {
      return c.json({ success: true, alreadyFree: true });
    }

    if (!subscription.razorpaySubscriptionId) {
      return c.json({ success: true, alreadyFree: true });
    }

    const razorpay = new RazorpayService();
    await razorpay.cancelSubscription(subscription.razorpaySubscriptionId);

    log.info({ userId }, "User requested Pro subscription cancellation — access continues until cycle end");
    return c.json({ success: true, scheduledForCancellation: true });
  }

  async razorpayWebhook(c: Context) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) throw new AppError(500, "Missing webhook secret");

    const signature = c.req.header("x-razorpay-signature");
    if (!signature) return c.json({ error: "Missing signature" }, 400);

    const rawBody = await c.req.raw.clone().text();
    if (!verifyWebhookSignature({ rawBody, signature, secret })) {
      return c.json({ error: "Invalid signature" }, 401);
    }

    const payload: any = JSON.parse(rawBody);
    const event = String(payload?.event || "");

    log.info({ event }, "Razorpay webhook received");

    const razorpaySubscriptionId = String(
      payload?.payload?.subscription?.entity?.id || ""
    );

    if (!razorpaySubscriptionId) {
      return c.json({ success: true, ignored: true });
    }

    const sub = await Subscription.findOne({
      where: { razorpaySubscriptionId },
      order: [["createdAt", "DESC"]],
    });

    if (!sub) {
      log.warn({ event, razorpaySubscriptionId }, "Webhook: no matching subscription found");
      return c.json({ success: true, ignored: true });
    }

    if (UPGRADE_EVENTS.has(event) && sub.plan !== PlanType.PRO) {
      await sub.update({
        plan: PlanType.PRO,
        status: SubscriptionStatus.ACTIVE,
        limit: PLAN_LIMITS_TOKENS[PlanType.PRO],
        razorpaySubscriptionId,
      });
      log.info({ event, userId: sub.userId }, "User upgraded to Pro");
    } else if (DOWNGRADE_EVENTS.has(event) && sub.plan !== PlanType.FREE) {
      await sub.update({
        plan: PlanType.FREE,
        status: SubscriptionStatus.ACTIVE,
        limit: PLAN_LIMITS_TOKENS[PlanType.FREE],
        razorpaySubscriptionId: null,
      });
      log.info({ event, userId: sub.userId }, "User downgraded to Free");
    } else {
      log.info({ event, plan: sub.plan }, "Webhook: no action taken");
    }

    return c.json({ success: true });
  }
}
