import type { Context } from "hono";
import { z } from "zod";
import { MessageService } from "../service/message.service.js";
import { getMessagesQuerySchema } from "../validations/message.validation.js";

export class MessageControllerClass {
  private messageService: MessageService;

  constructor() {
    this.messageService = new MessageService();
    this.getMessages = this.getMessages.bind(this);
  }

  async getMessages(c: Context) {
    try {
      const userId = c.get("userId") as string;
      const { page, limit } = getMessagesQuerySchema.parse({
        page: c.req.query("page"),
        limit: c.req.query("limit"),
      });

      const result = await this.messageService.getMessages(userId, page, limit);

      return c.json({
        success: true,
        messages: result.messages,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: "Invalid input" }, 400);
      }
      throw error;
    }
  }
}

