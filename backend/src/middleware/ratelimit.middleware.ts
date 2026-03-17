import type { Context, Next } from "hono";
import { createLogger } from "../utils/logger.js";

const log = createLogger('RateLimiter');

const userRequests = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60000;

function cleanup() {
  const now = Date.now();
  for (const [userId, data] of userRequests.entries()) {
    if (now > data.resetTime) {
      userRequests.delete(userId);
    }
  }
}

setInterval(cleanup, 60000);

export const createRateLimiter = (maxRequests: number) => {
  return async (c: Context, next: Next) => {
    const userId = c.get("userId") as string;

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const now = Date.now();
    const key = `${userId}:${maxRequests}`;
    const userData = userRequests.get(key);

    if (!userData || now > userData.resetTime) {
      userRequests.set(key, {
        count: 1,
        resetTime: now + WINDOW_MS,
      });
      await next();
      return;
    }

    if (userData.count >= maxRequests) {
      log.warn({ userId, count: userData.count, limit: maxRequests }, 'Rate limit exceeded');
      return c.json({ error: "Too many requests" }, 429);
    }

    userData.count++;
    await next();
  };
};

export const rateLimitMiddleware = createRateLimiter(100);
export const heavyRateLimitMiddleware = createRateLimiter(30);
