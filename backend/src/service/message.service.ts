import Message from "../schema/message.schema.js";

export class MessageService {
  async saveMessage(
    userId: string,
    query: string,
    response: string,
    intent: "transcribe" | "generate" | "command",
    tokens: number = 0,
    audio: string | null = null,
    source: "desktop" | "mobile" | "web" = "desktop",
    error: string | null = null,
    metadata: Record<string, any> | null = null
  ): Promise<Message> {
    return await Message.create({
      userId,
      query,
      response,
      intent,
      tokens,
      audio,
      source,
      error,
      metadata,
    });
  }

  async getRecentMessages(userId: string, limit: number = 15): Promise<Message[]> {
    const messages = await Message.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      limit: Math.min(limit, 50),
      attributes: ['query', 'response'],
    });
    return messages.reverse();
  }

  async getMessages(userId: string, page: number = 1, limit: number = 20) {
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * safeLimit;

    const { count, rows } = await Message.findAndCountAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      limit: safeLimit,
      offset,
    });

    return {
      messages: rows,
      total: count,
      page: safePage,
      limit: safeLimit,
    };
  }
}

