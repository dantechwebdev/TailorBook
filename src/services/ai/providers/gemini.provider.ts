/**
 * Gemini AI Provider
 *
 * Google Gemini integration for TailorBook.
 *
 * TO ACTIVATE:
 *   1. npm install @google/generative-ai
 *   2. Set EXPO_PUBLIC_GEMINI_API_KEY in your .env
 *   3. Set EXPO_PUBLIC_AI_PROVIDER=gemini in your .env
 *   4. Uncomment the implementation below
 *   5. Zero other changes needed — the rest of the app uses IAIProvider interface
 *
 * Model choice: gemini-1.5-flash (fast, cost-effective, sufficient for short insights)
 * For longer conversations, switch to gemini-1.5-pro via the model config.
 */

import { IAIProvider } from '../AIService';
import { AICompletionRequest, AICompletionResponse } from '../../../../types';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const MODEL = 'gemini-1.5-flash';

export class GeminiProvider implements IAIProvider {
  readonly name = 'gemini' as const;

  // private client: GoogleGenerativeAI | null = null;
  // private model: GenerativeModel | null = null;

  isAvailable(): boolean {
    return API_KEY.length > 0;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key not configured');
    }

    // ── Activate with @google/generative-ai ──────────────────────────────
    // import { GoogleGenerativeAI } from '@google/generative-ai';
    //
    // if (!this.client) {
    //   this.client = new GoogleGenerativeAI(API_KEY);
    //   this.model = this.client.getGenerativeModel({
    //     model: MODEL,
    //     generationConfig: {
    //       maxOutputTokens: request.maxTokens ?? 200,
    //       temperature: request.temperature ?? 0.5,
    //     },
    //   });
    // }
    //
    // // Build the chat history (all messages except the last one)
    // const history = request.messages.slice(0, -1).map((m) => ({
    //   role: m.role === 'assistant' ? 'model' : 'user',
    //   parts: [{ text: m.content }],
    // }));
    //
    // const chat = this.model!.startChat({ history });
    // const lastMessage = request.messages[request.messages.length - 1];
    // const result = await chat.sendMessage(lastMessage.content);
    // const text = result.response.text();
    //
    // return {
    //   content: text,
    //   provider: 'gemini',
    //   tokensUsed: result.response.usageMetadata?.totalTokenCount,
    // };

    throw new Error('Gemini provider: uncomment the implementation above after installing @google/generative-ai');
  }
}
