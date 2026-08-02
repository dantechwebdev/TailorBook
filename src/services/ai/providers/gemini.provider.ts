/**
 * Gemini AI Provider
 *
 * Google Gemini integration for TailorBook.
 *
 * Model choice: gemini-1.5-flash (fast, cost-effective, sufficient for short insights)
 * For longer conversations, switch to gemini-1.5-pro via the model config.
 *
 * ── Fixed in this pass ──────────────────────────────────────────────────────
 * This provider looked wired but was silently broken:
 *
 *   1. System-role messages were stuffed into Gemini's chat `history` mapped
 *      to role 'user'. Gemini's chat API requires history to strictly
 *      alternate user/model turns. A system message followed by the actual
 *      first user turn produced two consecutive 'user' entries, which the
 *      API rejects. Every real call with a system prompt (i.e. every call
 *      the app actually makes — AIOrchestrator always sends one) threw, was
 *      swallowed by AIService's catch-all fallback, and silently returned a
 *      Mock response. This is the reason the AI "felt fake": it was never
 *      actually reaching Gemini in normal use, and failed with no visible
 *      error anywhere a developer would notice.
 *
 *   2. `generationConfig` (temperature, maxOutputTokens) was baked into the
 *      model on the FIRST call only (`if (!this.client)` guard), then that
 *      model instance was reused forever — every later call silently used
 *      the first request's temperature/token limit regardless of what the
 *      caller actually asked for.
 *
 * Fix: extract system messages into Gemini's proper `systemInstruction`
 * field, and build a fresh model instance per request with that request's
 * own generationConfig. Constructing a GenerativeModel is a cheap local
 * object — the expensive part is the network call, not this.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAIProvider } from '../AIService';
import { AICompletionRequest, AICompletionResponse } from '../../../types';
import { createLogger } from '../../../utils/logger';

const log = createLogger('GeminiProvider');

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const MODEL = 'gemini-1.5-flash';

export class GeminiProvider implements IAIProvider {
  readonly name = 'gemini' as const;

  private client: GoogleGenerativeAI | null = null;

  isAvailable(): boolean {
    return API_KEY.length > 0;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key not configured');
    }

    if (!this.client) {
      this.client = new GoogleGenerativeAI(API_KEY);
    }

    // Gemini has no "system" turn inside chat history — it's a dedicated
    // model-level instruction. Pull every system message out and join them;
    // AIOrchestrator sends exactly one, but this stays correct if that changes.
    const systemMessages = request.messages.filter((m) => m.role === 'system');
    const conversation = request.messages.filter((m) => m.role !== 'system');

    if (conversation.length === 0) {
      throw new Error('Gemini request has no user/assistant messages to respond to');
    }

    const model = this.client.getGenerativeModel({
      model: MODEL,
      systemInstruction: systemMessages.length > 0
        ? systemMessages.map((m) => m.content).join('\n\n')
        : undefined,
      generationConfig: {
        maxOutputTokens: request.maxTokens ?? 200,
        temperature: request.temperature ?? 0.5,
      },
    });

    // History = every turn except the last, alternating user/model, starting
    // with user — which holds here since `conversation` always starts with
    // a user message in this app's call pattern.
    const history = conversation.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMessage = conversation[conversation.length - 1];

    try {
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(lastMessage.content);
      const text = result.response.text();

      return {
        content: text,
        provider: 'gemini',
        tokensUsed: result.response.usageMetadata?.totalTokenCount,
      };
    } catch (err) {
      // Let AIService's fallback handle this (it degrades to Mock so the
      // tailor never sees a crash) — but log with enough detail that a
      // developer can actually diagnose a real outage vs. a code bug,
      // which the previous version made impossible to tell apart.
      log.warn('Gemini request failed', { message: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  }
}
