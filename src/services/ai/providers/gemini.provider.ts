/**
 * Gemini AI Provider
 *
 * Google Gemini integration for TailorBook.
 *
 * Model choice: gemini-1.5-flash (fast, cost-effective, sufficient for short insights)
 * For longer conversations, switch to gemini-1.5-pro via the model config.
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { IAIProvider } from '../AIService';
import { AICompletionRequest, AICompletionResponse } from '../../../types';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const MODEL = 'gemini-1.5-flash';

export class GeminiProvider implements IAIProvider {
  readonly name = 'gemini' as const;

  private client: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;

  isAvailable(): boolean {
    return API_KEY.length > 0;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key not configured');
    }

    if (!this.client) {
      this.client = new GoogleGenerativeAI(API_KEY);
      this.model = this.client.getGenerativeModel({
        model: MODEL,
        generationConfig: {
          maxOutputTokens: request.maxTokens ?? 200,
          temperature: request.temperature ?? 0.5,
        },
      });
    }

    // Build the chat history (all messages except the last one)
    const history = request.messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const chat = this.model!.startChat({ history });
    const lastMessage = request.messages[request.messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const text = result.response.text();

    return {
      content: text,
      provider: 'gemini',
      tokensUsed: result.response.usageMetadata?.totalTokenCount,
    };
  }
}

