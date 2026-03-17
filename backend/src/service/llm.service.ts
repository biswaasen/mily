import Groq from "groq-sdk";
import { createLogger } from "../utils/logger.js";

const log = createLogger('LLMService');
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.3-70b-versatile";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export class LLMService {
  async chat(messages: ChatMessage[], options: ChatCompletionOptions = {}): Promise<any> {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages,
      temperature: options.temperature ?? 0.1,
      max_tokens: options.maxTokens ?? 2000,
      top_p: 1,
      stream: false,
      ...(options.jsonMode && { response_format: { type: "json_object" } }),
    }) as any;

    const content = response.choices[0]?.message?.content || "";
    if (!content) throw new Error("Empty response from LLM");

    const tokens = response.usage?.total_tokens || 0;

    if (options.jsonMode) {
      try {
        const parsed = JSON.parse(content);
        parsed.tokens = tokens;
        return parsed;
      } catch {
        log.error({ content }, 'LLM returned invalid JSON');
        throw new Error('Invalid JSON response from LLM');
      }
    }

    return { content: content.trim(), tokens };
  }
}
