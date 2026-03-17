import { UserService } from "./user.service.js";
import { SubscriptionService } from "./subscription.service.js";
import { STTService } from "./stt.service.js";
import { LLMService } from "./llm.service.js";
import { MessageService } from "./message.service.js";
import { MemoryService } from "./memory.service.js";
import { PROMPT } from "../utils/prompt.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger('OrchestrationService');

export type OrchestrationResult = {
  intent: string;
  response: string;
  action?: any;
  email: string;
  transcription: string;
};

interface ChatCompletionResponse {
  intent: "transcribe" | "generate" | "command";
  message?: string;
  tokens?: number;
  action?: {
    text?: string;
    content?: string;
    command?: {
      action: "open_url" | "open_app" | "press_key" | "take_screenshot";
      url?: string;
      app?: string;
      key?: string;
      modifiers?: string[];
      type?: string;
    };
  };
}

export class OrchestrationService {
  constructor(
    private userService: UserService,
    private subscriptionService: SubscriptionService,
    private sttService: STTService,
    private llmService: LLMService,
    private messageService: MessageService,
    private memoryService: MemoryService
  ) {}

  async processAudioRequest(
    audioBuffer: Buffer,
    userId: string,
    audioFileName: string = 'audio.webm',
    audioMimeType: string = 'audio/webm'
  ): Promise<OrchestrationResult> {
    const [user, subscription] = await Promise.all([
      this.userService.getUser({ userId }),
      this.subscriptionService.getSubscription(userId),
    ]);

    if (!user || !subscription) {
      throw new Error("User or subscription not found");
    }

    const { text: transcription } = await this.sttService.transcribe(audioBuffer, audioFileName, audioMimeType);
    
    const trimmed = transcription.trim();
    if (!trimmed || trimmed.length < 2) {
      return { 
        intent: "transcribe",
        response: "",
        email: user.email, 
        transcription: "" 
      };
    }

    const [recentMessages, userMemories] = await Promise.all([
      this.messageService.getRecentMessages(userId, 10),
      this.memoryService.getMemories(userId),
    ]);

    const conversationHistory = recentMessages
      .filter((msg: any) => msg.query?.trim() && msg.response?.trim())
      .flatMap((msg: any) => [
        { role: "user" as const, content: msg.query.trim() },
        { role: "assistant" as const, content: msg.response.trim() }
      ]);

    let systemPrompt = PROMPT.SYSTEM;
    if (userMemories) {
      systemPrompt += `\n\n${userMemories}`;
    }

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...conversationHistory,
      { role: "user" as const, content: trimmed }
    ];

    const result = await this.llmService.chat(messages, {
      jsonMode: true,
      temperature: 0.1,
      maxTokens: 2000
    }) as ChatCompletionResponse;

    const tokens = result.tokens || 0;
    
    if (subscription.used + tokens > subscription.limit) {
      throw new Error(`Token limit exceeded: ${subscription.used}/${subscription.limit}`);
    }

    await this.subscriptionService.updateSubscription(subscription, {
      used: subscription.used + tokens
    });

    let response = result.message || '';
    let action: any = result.action;
    const intent = result.intent;

    if (intent === "transcribe" && result.action?.text) {
      response = result.action.text;
      action = { shouldPaste: true };
    } else if (intent === "generate" && result.action?.content) {
      response = result.action.content;
      action = { shouldPaste: true };
    } else if (intent === "command" && result.action?.command) {
      const cmd: any = result.action.command;
      if (cmd.action === "open_url") {
        cmd.url = cmd.url || "https://www.google.com";
        if (!cmd.url.startsWith("http")) {
          cmd.url = `https://${cmd.url}`;
        }
      } else if (cmd.action === "open_app") {
        if (!cmd.app) throw new Error("App name required");
      } else if (cmd.action === "press_key") {
        if (!cmd.key) throw new Error("Key required");
      } else if (cmd.action === "take_screenshot") {
        cmd.type = cmd.type || "full";
      }
      response = JSON.stringify(cmd);
      action = cmd;
    }

    this.messageService.saveMessage(
      userId,
      trimmed,
      response || 'No response',
      intent,
      tokens,
      null,
      "desktop",
      null,
      { action }
    ).catch(err => log.error({ err, userId }, 'Post-processing failed'));

    return {
      intent,
      response,
      action,
      email: user.email,
      transcription: trimmed
    };
  }
}
