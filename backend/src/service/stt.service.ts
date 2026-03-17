import Groq from "groq-sdk";
import { createLogger } from "../utils/logger.js";

const log = createLogger('STTService');
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface TranscriptionResult {
  text: string;
}

export class STTService {
  async transcribe(
    audioBuffer: Buffer,
    fileName: string = 'audio.webm',
    mimeType: string = 'audio/webm'
  ): Promise<TranscriptionResult> {
    const audioFile = new File(
      [new Uint8Array(audioBuffer)],
      fileName,
      { type: mimeType }
    );

    try {
      const transcription = await groq.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-large-v3-turbo",
        temperature: 0,
        response_format: "json",
        language: "en",
      });

      const text = transcription.text?.trim();
      if (!text) throw new Error("empty transcription");

      return { text };
    } catch (error) {
      if (error instanceof Error) {
        log.error({ err: error }, 'Transcription error');
        if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
          throw new Error('Transcription timeout - please try again');
        }
        if (error.message.includes('rate limit')) {
          throw new Error('Transcription rate limit exceeded');
        }
      }
      throw new Error('Transcription failed');
    }
  }
}
