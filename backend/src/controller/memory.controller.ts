import type { Context } from "hono";
import { z } from "zod";
import { MemoryService } from "../service/memory.service.js";
import { AppError } from "../middleware/error.middleware.js";
import { createLogger } from "../utils/logger.js";
import { addMemorySchema, deleteMemorySchema } from "../validations/memory.validation.js";

const log = createLogger('MemoryController');

export class MemoryControllerClass {
  private memoryService: MemoryService;

  constructor() {
    this.memoryService = new MemoryService();
    this.addMemory = this.addMemory.bind(this);
    this.getMemories = this.getMemories.bind(this);
    this.deleteMemory = this.deleteMemory.bind(this);
  }

  async addMemory(c: Context) {
    const userId = c.get("userId") as string;
    const body = await c.req.json();
    let parsed: z.infer<typeof addMemorySchema>;
    try {
      parsed = addMemorySchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const msg = error.errors.map((e) => e.message).join("; ");
        throw new AppError(400, msg);
      }
      throw error;
    }

    await this.memoryService.addMemory(
      userId,
      [{ role: "user", content: parsed.content }],
      parsed.key
    );

    log.info({ userId, key: parsed.key }, 'Memory added successfully');
    return c.json({ success: true, message: "Memory saved successfully" });
  }

  async getMemories(c: Context) {
    const userId = c.get("userId") as string;
    const memories = await this.memoryService.getAllMemories(userId);
    return c.json({ success: true, memories });
  }

  async deleteMemory(c: Context) {
    const userId = c.get("userId") as string;
    const body = await c.req.json();
    let parsed: z.infer<typeof deleteMemorySchema>;
    try {
      parsed = deleteMemorySchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const msg = error.errors.map((e) => e.message).join("; ");
        throw new AppError(400, msg);
      }
      throw error;
    }

    const deleted = await this.memoryService.deleteMemory(parsed.id);

    if (!deleted) {
      throw new AppError(404, "Memory not found");
    }

    log.info({ userId, memoryId: parsed.id }, 'Memory deleted successfully');
    return c.json({ success: true, message: "Memory deleted successfully" });
  }
}
