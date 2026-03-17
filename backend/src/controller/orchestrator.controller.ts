import type { Context } from "hono";
import { OrchestrationService } from "../service/orchestration.service.js";
import { UserService } from "../service/user.service.js";
import { SubscriptionService } from "../service/subscription.service.js";
import { STTService } from "../service/stt.service.js";
import { LLMService } from "../service/llm.service.js";
import { MessageService } from "../service/message.service.js";
import { MemoryService } from "../service/memory.service.js";
import { ensureConnection } from "../config/database.js";
import { AppError } from "../middleware/error.middleware.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger('OrchestratorController');
const PROCESSING_TIMEOUT = 90000;

export class OrchestratorControllerClass {
  private orchestrationService: OrchestrationService;

  constructor() {
    this.orchestrationService = new OrchestrationService(
      new UserService(),
      new SubscriptionService(),
      new STTService(),
      new LLMService(),
      new MessageService(),
      new MemoryService()
    );
    this.processAudio = this.processAudio.bind(this);
  }

  async processAudio(c: Context) {
    const startTime = Date.now();
    
    try {
      const userId = c.get("userId") as string;

      const dbHealthy = await ensureConnection();
      if (!dbHealthy) {
        log.error('Database connection unavailable');
        throw new AppError(503, "Database unavailable");
      }

      const formData = await c.req.formData();
      const audioFile = formData.get("audio") as File | null;
      if (!audioFile) throw new AppError(400, "No audio");

      const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      const audioFileName = audioFile.name || 'audio.webm';
      const audioMimeType = audioFile.type || 'audio/webm';
      
      const result = await Promise.race([
        this.orchestrationService.processAudioRequest(audioBuffer, userId, audioFileName, audioMimeType),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), PROCESSING_TIMEOUT)
        )
      ]);

      const duration = Date.now() - startTime;
      log.info({
        userId,
        transcription: result.transcription,
        intent: result.intent,
        response: result.response,
        duration
      }, 'Audio processed successfully');

      return c.json({
        intent: result.intent,
        response: result.response,
        action: result.action,
        transcription: result.transcription,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof AppError) throw error;

      log.error({
        err: error,
        duration
      }, 'Audio processing failed');

      if (error instanceof Error) {
        const msg = error.message;
        if (msg.includes("timeout")) {
          throw new AppError(504, "Request timeout - please try again");
        }
        if (msg.includes("not supported")) {
          throw new AppError(400, msg);
        }
        if (msg.toLowerCase().includes("limit exceeded")) {
          throw new AppError(429, "Usage limit reached");
        }
        if (msg.includes("Groq") || msg.includes("transcription")) {
          throw new AppError(503, "Service unavailable");
        }
        if (msg.includes("database") || msg.includes("connection")) {
          throw new AppError(503, "Database error - please try again");
        }
      }
      throw new AppError(500, "Server error");
    }
  }
}
