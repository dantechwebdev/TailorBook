/**
 * AIOrchestrator
 *
 * This is the "skilled employee" brain. It sits between the FloatingAssistant
 * / TailorStudio UI and the tool layer:
 *
 *   1. Reads the live ContextEngine — knows the screen, active customer/job.
 *   2. Builds a system prompt describing the tailor's situation + which
 *      tools are runnable right now.
 *   3. Asks the LLM (via AIService) to decide: does this request need a
 *      tool, or is it a plain question it can answer from context alone?
 *   4. If a tool call is indicated, executes it via ToolRegistry and folds
 *      the structured result back into a natural-language reply.
 *   5. Returns a single AIOrchestratorResponse the UI can render — either
 *      plain text, or text + tool result data (e.g. generated images,
 *      an invoice block) the UI knows how to display specially.
 *
 * The AI never talks to SQLite, the store, or repositories. It only ever
 * talks to AIService (for language) and ToolRegistry (for action).
 */

import { AIActiveContext, AIMessage, AIToolResult } from '../../types';
import { aiService } from './AIService';
import { toolRegistry, registerBuiltInTools } from './tools/ToolRegistry';
import { contextEngine } from './context/ContextEngine';
import { createLogger } from '../../utils/logger';

const log = createLogger('AIOrchestrator');

// ─── Response Shape ─────────────────────────────────────────────────────────────

export interface AIOrchestratorResponse {
  reply: string;
  toolName?: string;
  toolResult?: AIToolResult;
}

// ─── Tool-call parsing ──────────────────────────────────────────────────────────
// The LLM is asked to respond either with plain conversational text, or with
// a single fenced JSON block naming a tool call. Kept intentionally simple
// (single tool per turn) — this matches how a real employee works: one
// concrete action at a time, not silently chaining five actions unasked.

interface ParsedToolCall {
  tool: string;
  args: Record<string, unknown>;
}

function tryParseToolCall(raw: string): ParsedToolCall | null {
  const match = raw.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ?? raw.match(/(\{[\s\S]*\})/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    if (parsed && typeof parsed.tool === 'string') {
      return { tool: parsed.tool, args: parsed.args ?? {} };
    }
  } catch {
    // Not a tool call — treat the whole response as conversational text.
  }
  return null;
}

// ─── Orchestrator ──────────────────────────────────────────────────────────────

class AIOrchestrator {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await aiService.initialize();
    await registerBuiltInTools();
    this.initialized = true;
    log.info('AIOrchestrator initialized');
  }

  /**
   * Main entry point. `history` is the visible chat transcript; the active
   * context is read fresh from ContextEngine on every call so it's always
   * current even if the tailor navigated between messages.
   */
  async handleMessage(history: AIMessage[]): Promise<AIOrchestratorResponse> {
    if (!this.initialized) await this.initialize();

    const context = contextEngine.getActive();
    const systemPrompt = this.buildSystemPrompt(context);

    const completion = await aiService.complete({
      messages: [
        { role: 'system', content: systemPrompt, timestamp: new Date().toISOString() },
        ...history,
      ],
      maxTokens: 300,
      temperature: 0.5,
    });

    const toolCall = tryParseToolCall(completion.content);
    if (!toolCall) {
      return { reply: completion.content.trim() };
    }

    const toolResult = await toolRegistry.execute(toolCall.tool, toolCall.args, context);

    const phrasing = await aiService.complete({
      messages: [
        { role: 'system', content: PHRASING_SYSTEM_PROMPT, timestamp: new Date().toISOString() },
        {
          role: 'user',
          content: `Tool "${toolCall.tool}" ran with result: ${JSON.stringify({ success: toolResult.success, summary: toolResult.summary })}. Reply to the tailor in one short, natural sentence confirming this.`,
          timestamp: new Date().toISOString(),
        },
      ],
      maxTokens: 80,
      temperature: 0.4,
    });

    return {
      reply: phrasing.content.trim() || toolResult.summary,
      toolName: toolCall.tool,
      toolResult,
    };
  }

  /**
   * Directly execute a named tool, bypassing LLM tool-selection. Used by
   * screen-adaptive quick-action buttons — deterministic, no round-trip
   * needed to decide which tool to run since the UI already knows.
   */
  async runTool(toolName: string, args: Record<string, unknown> = {}): Promise<AIOrchestratorResponse> {
    if (!this.initialized) await this.initialize();

    const context = contextEngine.getActive();
    const toolResult = await toolRegistry.execute(toolName, args, context);

    return {
      reply: toolResult.summary,
      toolName,
      toolResult,
    };
  }

  /** Screen-adaptive quick actions — what the tool registry offers right now. */
  getQuickActionsForScreen(): { toolName: string; label: string }[] {
    const context = contextEngine.getActive();
    return toolRegistry
      .getForScreen(context.screen)
      .filter((t) => t.canRun(context))
      .map((t) => ({ toolName: t.definition.name, label: QUICK_ACTION_LABELS[t.definition.name] ?? t.definition.name }));
  }

  private buildSystemPrompt(context: AIActiveContext): string {
    const manifest = toolRegistry.buildManifest(context);

    const contextLines: string[] = [`Screen: ${context.screen}`];
    if (context.customer) {
      contextLines.push(`Active customer: ${context.customer.name} (${context.customer.phone})`);
    }
    if (context.job) {
      contextLines.push(
        `Active job: ${context.job.customerName}'s ${context.job.outfitType}, status ${context.job.status}, ` +
        `delivery ${context.job.deliveryDate}, balance ${context.job.balance}`
      );
    }
    if (context.measurements?.length) {
      contextLines.push(`Measurements on file: ${context.measurements.length} set(s)`);
    }
    if (context.recentActions?.length) {
      contextLines.push(`Recent actions: ${context.recentActions.join('; ')}`);
    }

    return [
      SYSTEM_IDENTITY,
      '',
      'CURRENT CONTEXT:',
      contextLines.join('\n'),
      '',
      'AVAILABLE TOOLS (only in this context):',
      manifest,
      '',
      TOOL_CALL_INSTRUCTIONS,
    ].join('\n');
  }
}

// ─── Prompts ────────────────────────────────────────────────────────────────────

const SYSTEM_IDENTITY = `You are the TailorBook Assistant — an intelligent employee working inside a tailoring business app, not a generic chatbot.

You already know the tailor's active screen, customer, and job from the context below. NEVER ask which customer or job the tailor means if one is already active — use it directly.

Speak briefly and practically, like a competent shop assistant. Use ₦ for currency.`;

const TOOL_CALL_INSTRUCTIONS = `If the tailor's request requires an action (estimating, generating a document, sending a message, saving a note, generating a design), respond with ONLY a JSON object naming the tool and its arguments, wrapped in a \`\`\`json code block:
{"tool": "ToolName", "args": {"param": "value"}}

If the request is just a question you can answer directly from the context above, respond with plain conversational text instead — do not invent a tool call for simple questions.`;

const PHRASING_SYSTEM_PROMPT = `You relay the outcome of an action just taken inside TailorBook to the tailor. Be brief, natural, and confident — one sentence. Never contradict the given result.`;

const QUICK_ACTION_LABELS: Record<string, string> = {
  EstimateFabricTool: 'Estimate fabric',
  EstimatePriceTool: 'Estimate price',
  EstimateDeliveryDateTool: 'Suggest delivery date',
  GenerateInvoiceTool: 'Generate invoice',
  GenerateReceiptTool: 'Generate receipt',
  GenerateBusinessInsightTool: 'Business insight',
  ValidateMeasurementsTool: 'Validate measurements',
  GenerateDesignPreviewTool: 'Generate design concept',
  ScheduleReminderTool: 'Schedule reminder',
  SendWhatsAppTool: 'Send WhatsApp',
};

export const aiOrchestrator = new AIOrchestrator();
