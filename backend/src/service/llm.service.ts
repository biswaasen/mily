import Groq from "groq-sdk";
import { createLogger } from "../utils/logger.js";

const log = createLogger('LLMService');
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const FALLBACK_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768"
];

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  maxCompletionTokens?: number;
  topP?: number;
  stream?: boolean;
  stop?: string[] | null;
  jsonMode?: boolean;
}

export class LLMService {
  async chat(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<any> {
    const models = options.model 
      ? [options.model, ...FALLBACK_MODELS]
      : FALLBACK_MODELS;

    let lastError: Error | null = null;

    for (const model of models) {
      try {
        const response = await groq.chat.completions.create({
          model,
          messages,
          temperature: options.temperature ?? (options.jsonMode ? 0.1 : 1),
          max_tokens: options.maxTokens,
          max_completion_tokens: options.maxCompletionTokens,
          top_p: options.topP ?? 1,
          stream: options.stream ?? false,
          stop: options.stop ?? null,
          ...(options.jsonMode && { response_format: { type: "json_object" } }),
        }) as any;

        const content = response.choices[0]?.message?.content || "";
        if (!content) throw new Error("empty response");

        const tokens = response.usage?.total_tokens || 0;

        if (options.jsonMode) {
          try {
            const parsed = JSON.parse(content);
            parsed.tokens = tokens;
            return parsed;
          } catch (parseError) {
            log.error({ err: parseError, content }, 'JSON parse failed - invalid LLM response');
            throw new Error('Invalid JSON response from LLM');
          }
        }

        return { content: content.trim(), tokens };
      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof Error) {
          const isCapacityError = error.message.includes('over capacity') || 
                                  error.message.includes('503');
          const isRateLimit = error.message.includes('rate limit') || 
                             error.message.includes('429');
          
          if (isCapacityError || isRateLimit) {
            log.warn({ model, err: error }, `Model ${model} unavailable, trying fallback`);
            continue;
          }

          log.error({ model, err: error }, 'Chat completion error');
          
          if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
            throw new Error('LLM timeout - please try again');
          }
          
          throw new Error('LLM chat completion failed');
        }
      }
    }

    log.error({ err: lastError }, 'All models failed');
    throw new Error('LLM service unavailable - all models at capacity');
  }
}
