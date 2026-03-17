import type { Context } from "hono";
import { z } from "zod";
import { UserService } from "../service/user.service.js";
import { SubscriptionService } from "../service/subscription.service.js";
import jwt from "jsonwebtoken";
import admin from "../config/firebase.js";
import { Status } from "../schema/user.schema.js";
import { PlanType, SubscriptionStatus } from "../schema/subscription.schema.js";
import { loginSchema } from "../validations/user.validation.js";

const userService = new UserService();
const subscriptionService = new SubscriptionService();

export class UserControllerClass {
  constructor() {
    this.login = this.login.bind(this);
    this.getUser = this.getUser.bind(this);
    this.updateUser = this.updateUser.bind(this);
  }

  async login(c: Context) {
    try {
      const body = await c.req.json();
      const { idToken } = loginSchema.parse(body);

      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const email = decodedToken.email;
      const name = decodedToken.name || decodedToken.email?.split("@")[0] || "User";
      const picture = decodedToken.picture || undefined;

      if (!email) {
        return c.json({ error: "Email not found" }, 400);
      }

      let user = await userService.getUser({ email });

      if (!user) {
        user = await userService.createUser({
          name,
          email,
          picture: picture || null,
          status: Status.ACTIVE,
        });

        await subscriptionService.createSubscription({
          userId: user.id,
          plan: PlanType.FREE,
          status: SubscriptionStatus.ACTIVE,
        });
      } else {
        if (name || picture) {
          user = await userService.updateUser(user, {
            ...(name && { name }),
            ...(picture && { picture }),
          });
        }
      }

      const auth_token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || "",
      );

      return c.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          picture: user.picture,
          status: user.status,
        },
        auth_token,
      }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: "Invalid input" }, 400);
      }
      if (error instanceof Error && error.message.includes("auth/")) {
        return c.json({ error: "Invalid token" }, 401);
      }
      throw error;
    }
  }

  async getUser(c: Context) {
    try {
      const userId = c.get("userId");

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const user = await userService.getUser({ userId });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      return c.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          picture: user.picture,
          status: user.status,
        },
      }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: "Invalid input" }, 400);
      }
      throw error;
    }
  }

  async updateUser(c: Context) {
    try {
      const userId = c.get("userId");

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      return c.json({ error: "No user fields are updatable" }, 400);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: "Invalid input" }, 400);
      }
      throw error;
    }
  }
}

