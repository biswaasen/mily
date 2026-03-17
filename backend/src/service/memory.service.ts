import Memory from "../schema/memory.schema.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger('MemoryService');

export class MemoryService {
  async addMemory(
    userId: string,
    messages: Array<{ role: string; content: string }>,
    key?: string | null
  ): Promise<void> {
    try {
      let memoryContent: string;
      if (messages.length === 1 && messages[0].role === "user") {
        memoryContent = messages[0].content;
      } else {
        memoryContent = messages.map(m => m.content).join(" | ");
      }

      const trimmedKey = typeof key === "string" ? key.trim() || null : null;
      if (trimmedKey) {
        const existing = await Memory.findOne({
          where: { userId, key: trimmedKey },
        });
        if (existing) {
          await existing.update({ content: memoryContent });
          log.info({ userId, key: trimmedKey }, 'Memory updated');
          return;
        }
      }

      await Memory.create({
        userId,
        key: trimmedKey || null,
        content: memoryContent,
      });
      log.info({ userId, messageCount: messages.length, key: trimmedKey }, 'Memory added');
    } catch (error: any) {
      log.error({
        err: error,
        userId,
        message: error?.message,
      }, 'Failed to add memory');
    }
  }

  async getMemories(userId: string): Promise<string> {
    try {
      const memories = await Memory.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
        attributes: ['key', 'content'],
      });

      if (memories.length === 0) return "";

      const lines = memories
        .map(m => {
          const content = m.content?.trim();
          if (!content) return null;
          return m.key ? `${m.key}: ${content}` : content;
        })
        .filter(Boolean);

      return lines.length
        ? `User's Known Information (from memory):\n${lines.join("\n\n")}`
        : "";
    } catch (error: any) {
      log.error({ err: error, userId, message: error?.message }, 'Failed to get memories');
      return "";
    }
  }

  async getAllMemories(userId: string) {
    try {
      const memories = await Memory.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
        attributes: ['id', 'key', 'content', 'createdAt'],
      });
      return memories;
    } catch (error: any) {
      log.error({ err: error, userId, message: error?.message }, 'Failed to get all memories');
      return [];
    }
  }

  async deleteMemory(memoryId: string): Promise<boolean> {
    try {
      const deleted = await Memory.destroy({
        where: { id: memoryId },
      });

      if (deleted > 0) {
        log.info({ memoryId }, 'Memory deleted');
        return true;
      }
      return false;
    } catch (error: any) {
      log.error({
        err: error,
        memoryId,
        message: error?.message,
      }, 'Failed to delete memory');
      return false;
    }
  }
}
