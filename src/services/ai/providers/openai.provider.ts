/**
 * OpenAI Provider
 *
 * OpenAI GPT integration for TailorBook.
 *
 * TO ACTIVATE:
 *   1. npm install openai
 *   2. Set EXPO_PUBLIC_OPENAI_API_KEY in your .env
 *   3. Set EXPO_PUBLIC_AI_PROVIDER=openai in your .env
 *   4. Uncomment the implementation below
 *
 * Note: OpenAI API calls from a mobile app expose your key in the bundle.
 * For production, route OpenAI calls through TailorBook Cloud (your backend).
 * The interface is the same — only the implementation changes.
 */

import { IAIProvider } from '../AIService';
import { AICompletionRequest, AICompletionResponse } from '../../../../types';

const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const MODEL = 'gpt-4o-mini'; // Fast, cheap, sufficient for short insights

export class OpenAIProvider implements IAIProvider {
  readonly name = 'openai' as const;

  isAvailable(): boolean {
    return API_KEY.length > 0;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key not configured');
    }

    // ── Activate with openai package ─────────────────────────────────────
    // import OpenAI from 'openai';
    //
    // const client = new OpenAI({ apiKey: API_KEY, dangerouslyAllowBrowser: true });
    //
    // const messages = request.messages.map((m) => ({
    //   role: m.role as 'user' | 'assistant' | 'system',
    //   content: m.content,
    // }));
    //
    // const completion = await client.chat.completions.create({
    //   model: MODEL,
    //   messages,
    //   max_tokens: request.maxTokens ?? 200,
    //   temperature: request.temperature ?? 0.5,
    // });
    //
    // return {
    //   content: completion.choices[0]?.message.content ?? '',
    //   provider: 'openai',
    //   tokensUsed: completion.usage?.total_tokens,
    // };

    throw new Error('OpenAI provider: uncomment the implementation above after installing openai');
  }
}
