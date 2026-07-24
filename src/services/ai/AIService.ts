/**
 * AIService
 *
 * Provider-agnostic AI foundation for TailorBook.
 * Screens and components call this service directly — they never know
 * which AI provider is running underneath. Switching providers requires
 * only a config change.
 *
 * Philosophy:
 *   - AI assists the tailor. It never commands.
 *   - AI is silent unless it has something useful to say.
 *   - Every suggestion must be dismissible with one tap.
 *   - AI never makes changes — it proposes, the tailor decides.
 *
 * To activate a real provider:
 *   1. Install the provider package (see individual provider files)
 *   2. Set EXPO_PUBLIC_AI_PROVIDER in your .env
 *   3. Set the relevant API key
 *   4. The rest of the app requires zero changes.
 */

import { AICompletionRequest, AICompletionResponse, AIProvider, AIMessage } from '../../../types';
import { createLogger } from '../../logger';

const log = createLogger('AIService');

// ─── Provider Interface ───────────────────────────────────────────────────────
// Every AI provider must implement this contract.

export interface IAIProvider {
  readonly name: AIProvider;
  isAvailable(): boolean;
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;
}

// ─── Provider Registry ────────────────────────────────────────────────────────
// Providers register themselves here. The service picks the first available one.

class AIProviderRegistry {
  private providers: Map<AIProvider, IAIProvider> = new Map();
  private preferredProvider: AIProvider = 'mock';

  register(provider: IAIProvider): void {
    this.providers.set(provider.name, provider);
    log.debug(`Registered AI provider: ${provider.name}`);
  }

  setPreferred(name: AIProvider): void {
    this.preferredProvider = name;
  }

  getActive(): IAIProvider {
    // Try preferred first
    const preferred = this.providers.get(this.preferredProvider);
    if (preferred?.isAvailable()) return preferred;

    // Fall through to first available real provider
    for (const [, provider] of this.providers) {
      if (provider.name !== 'mock' && provider.isAvailable()) return provider;
    }

    // Always fall back to mock — never crash
    const mock = this.providers.get('mock');
    if (mock) return mock;

    throw new Error('No AI provider registered. Did you call AIService.initialize()?');
  }

  getAll(): IAIProvider[] {
    return Array.from(this.providers.values());
  }
}

export const aiProviderRegistry = new AIProviderRegistry();

// ─── AI Service ───────────────────────────────────────────────────────────────

class AIService {
  private initialized = false;

  // ─── Initialize ────────────────────────────────────────────────────────

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Register providers in priority order
    const { MockAIProvider } = await import('./providers/mock.provider');
    aiProviderRegistry.register(new MockAIProvider());

    // Conditionally register real providers based on environment
    // They self-report availability based on whether their API key exists
    try {
      const { GeminiProvider } = await import('./providers/gemini.provider');
      aiProviderRegistry.register(new GeminiProvider());
    } catch {
      // Package not installed — skip silently
    }

    try {
      const { OpenAIProvider } = await import('./providers/openai.provider');
      aiProviderRegistry.register(new OpenAIProvider());
    } catch {
      // Package not installed — skip silently
    }

    // Set preferred from environment
    const envProvider = process.env.EXPO_PUBLIC_AI_PROVIDER as AIProvider | undefined;
    if (envProvider) aiProviderRegistry.setPreferred(envProvider);

    this.initialized = true;
    log.info(`AI service initialized. Active provider: ${aiProviderRegistry.getActive().name}`);
  }

  // ─── Core Completion ───────────────────────────────────────────────────

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.initialized) await this.initialize();

    const provider = aiProviderRegistry.getActive();
    log.debug(`AI request via ${provider.name}`, { messageCount: request.messages.length });

    try {
      return await provider.complete(request);
    } catch (err) {
      log.warn('AI completion failed', err);
      // Fall back to mock on provider error — never surface a crash to the user
      const { MockAIProvider } = await import('./providers/mock.provider');
      const mock = new MockAIProvider();
      return mock.complete(request);
    }
  }

  // ─── Context-aware Helpers ─────────────────────────────────────────────
  // These pre-build the prompt with TailorBook context so screens
  // can call a single method without knowing about prompt engineering.

  async getJobInsight(jobContext: {
    outfitType: string;
    status: string;
    customerName: string;
    deliveryDate: string;
    daysUntilDue: number;
    price: number;
    balance: number;
    hasPhoto: boolean;
    hasMeasurements: boolean;
  }): Promise<string | null> {
    if (!this.initialized) await this.initialize();

    // Only generate insight if there's something useful to say
    const hasUrgentInfo =
      jobContext.daysUntilDue <= 1 ||
      jobContext.balance > 0 ||
      !jobContext.hasMeasurements;

    if (!hasUrgentInfo) return null;

    const messages: AIMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT, timestamp: new Date().toISOString() },
      {
        role: 'user',
        content: buildJobInsightPrompt(jobContext),
        timestamp: new Date().toISOString(),
      },
    ];

    const response = await this.complete({ messages, maxTokens: 80, temperature: 0.4 });
    return response.content.trim() || null;
  }

  async getCustomerInsight(customerContext: {
    name: string;
    totalJobs: number;
    activeJobs: number;
    outstandingBalance: number;
    lastOrderDate: string | null;
    topOutfitType: string | null;
  }): Promise<string | null> {
    if (!this.initialized) await this.initialize();

    // Only surface insight when there's something actionable
    if (customerContext.activeJobs === 0 && customerContext.outstandingBalance === 0) return null;

    const messages: AIMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT, timestamp: new Date().toISOString() },
      {
        role: 'user',
        content: buildCustomerInsightPrompt(customerContext),
        timestamp: new Date().toISOString(),
      },
    ];

    const response = await this.complete({ messages, maxTokens: 80, temperature: 0.4 });
    return response.content.trim() || null;
  }

  async getBusinessInsight(businessContext: {
    totalRevenue: number;
    totalOutstanding: number;
    overdueCount: number;
    completionRate: number;
    topOutfitType: string | null;
    period: string;
  }): Promise<string | null> {
    if (!this.initialized) await this.initialize();

    const messages: AIMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT, timestamp: new Date().toISOString() },
      {
        role: 'user',
        content: buildBusinessInsightPrompt(businessContext),
        timestamp: new Date().toISOString(),
      },
    ];

    const response = await this.complete({ messages, maxTokens: 100, temperature: 0.5 });
    return response.content.trim() || null;
  }

  // ─── Chat (for the floating assistant) ────────────────────────────────

  async chat(
    messages: AIMessage[],
    screenContext: string
  ): Promise<AICompletionResponse> {
    if (!this.initialized) await this.initialize();

    const systemMessage: AIMessage = {
      role: 'system',
      content: `${SYSTEM_PROMPT}\n\nThe tailor is currently on: ${screenContext}`,
      timestamp: new Date().toISOString(),
    };

    return this.complete({
      messages: [systemMessage, ...messages],
      maxTokens: 200,
      temperature: 0.6,
    });
  }

  get activeProviderName(): AIProvider {
    if (!this.initialized) return 'mock';
    return aiProviderRegistry.getActive().name;
  }

  get isRealAIAvailable(): boolean {
    if (!this.initialized) return false;
    const active = aiProviderRegistry.getActive();
    return active.name !== 'mock';
  }
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a calm, intelligent workshop assistant for TailorBook — a business tool used by tailors and fashion designers in Nigeria and Africa.

Your role:
- Give brief, actionable suggestions (1–2 sentences maximum)
- Speak like a knowledgeable colleague, not a corporate assistant
- Use Nigerian currency (₦) when mentioning money
- Never lecture. Never repeat what the tailor already knows.
- If you have nothing useful to add, say nothing (return empty string)
- Focus on what the tailor should DO next, not what they already know

Tone: calm, practical, direct, helpful.`;

// ─── Prompt Builders ──────────────────────────────────────────────────────────

function buildJobInsightPrompt(ctx: {
  outfitType: string;
  status: string;
  customerName: string;
  deliveryDate: string;
  daysUntilDue: number;
  price: number;
  balance: number;
  hasPhoto: boolean;
  hasMeasurements: boolean;
}): string {
  const parts: string[] = [
    `Job: ${ctx.customerName}'s ${ctx.outfitType}`,
    `Status: ${ctx.status}`,
    `Delivery: ${ctx.deliveryDate} (${ctx.daysUntilDue} days from now)`,
    `Balance: ₦${ctx.balance.toLocaleString()} outstanding`,
  ];

  if (!ctx.hasMeasurements) parts.push('No measurements recorded');
  if (!ctx.hasPhoto) parts.push('No reference photo');

  parts.push('\nGive one brief, actionable suggestion for the tailor. If everything looks fine, say nothing (empty response).');
  return parts.join('\n');
}

function buildCustomerInsightPrompt(ctx: {
  name: string;
  totalJobs: number;
  activeJobs: number;
  outstandingBalance: number;
  lastOrderDate: string | null;
  topOutfitType: string | null;
}): string {
  return [
    `Customer: ${ctx.name}`,
    `Total jobs: ${ctx.totalJobs}, Active: ${ctx.activeJobs}`,
    `Outstanding balance: ₦${ctx.outstandingBalance.toLocaleString()}`,
    ctx.lastOrderDate ? `Last order: ${ctx.lastOrderDate}` : 'No previous orders',
    ctx.topOutfitType ? `Most ordered: ${ctx.topOutfitType}` : '',
    '\nGive one brief suggestion about this customer relationship. Focus only on what needs attention.',
  ].filter(Boolean).join('\n');
}

function buildBusinessInsightPrompt(ctx: {
  totalRevenue: number;
  totalOutstanding: number;
  overdueCount: number;
  completionRate: number;
  topOutfitType: string | null;
  period: string;
}): string {
  return [
    `Period: ${ctx.period}`,
    `Revenue: ₦${ctx.totalRevenue.toLocaleString()}`,
    `Outstanding: ₦${ctx.totalOutstanding.toLocaleString()}`,
    `Overdue jobs: ${ctx.overdueCount}`,
    `Completion rate: ${ctx.completionRate}%`,
    ctx.topOutfitType ? `Top seller: ${ctx.topOutfitType}` : '',
    '\nGive one sentence of business insight. Be specific and actionable. No generic advice.',
  ].filter(Boolean).join('\n');
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const aiService = new AIService();
