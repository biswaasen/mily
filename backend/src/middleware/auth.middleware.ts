import type { Context, Next } from "hono";
import jwt from "jsonwebtoken";

interface JWTPayload {
  userId: string;
}

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const auth_token = authHeader.replace("Bearer ", "");

    const decoded = jwt.verify(
      auth_token,
      process.env.JWT_SECRET || ""
    ) as JWTPayload;

    c.set("userId", decoded.userId);

    await next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return c.json({ error: "Invalid token" }, 401);
    }
    if (error instanceof jwt.TokenExpiredError) {
      return c.json({ error: "Token expired" }, 401);
    }
    console.error(error);
    return c.json({ error: "unauthorized" }, 401);
  }
};

