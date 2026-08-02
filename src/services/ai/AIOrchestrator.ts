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
import { useStore } from '../../context/store';
import { differenceInCalendarDays, parseISO, isSameDay } from 'date-fns';

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

    const snapshotLines = this.buildBusinessSnapshot(context);

    return [
      SYSTEM_IDENTITY,
      '',
      'CURRENT CONTEXT:',
      contextLines.join('\n'),
      snapshotLines.length > 0 ? '\nBUSINESS SNAPSHOT (use only if genuinely relevant to what the tailor asked — never volunteer all of this unprompted):' : '',
      snapshotLines.join('\n'),
      '',
      'AVAILABLE TOOLS (only in this context):',
      manifest,
      '',
      TOOL_CALL_INSTRUCTIONS,
    ].filter(Boolean).join('\n');
  }

  /**
   * Business-wide facts the AI should be aware of on every turn, regardless
   * of which single job/customer is on screen — this is what lets it notice
   * "tomorrow already has six deliveries" or "this customer has an
   * outstanding balance" without the tailor having to ask. Kept to genuinely
   * useful, cheaply-computed facts; not a full data dump (the system prompt
   * instructs the model to mention these only when relevant, not recite them
   * every turn — a psychic assistant notices things, it doesn't narrate a
   * spreadsheet).
   */
  private buildBusinessSnapshot(context: AIActiveContext): string[] {
    const { jobs, customers } = useStore.getState();
    const lines: string[] = [];
    const today = new Date();

    const active = jobs.filter((j) => j.status !== 'Delivered');
    const overdue = active.filter((j) => {
      try { return parseISO(j.deliveryDate) < today; } catch { return false; }
    });
    const dueToday = active.filter((j) => {
      try { return isSameDay(parseISO(j.deliveryDate), today); } catch { return false; }
    });
    const dueTomorrow = active.filter((j) => {
      try { return differenceInCalendarDays(parseISO(j.deliveryDate), today) === 1; } catch { return false; }
    });

    if (overdue.length > 0) lines.push(`${overdue.length} job(s) are overdue right now.`);
    if (dueToday.length > 0) lines.push(`${dueToday.length} deliver${dueToday.length === 1 ? 'y is' : 'ies are'} due today.`);
    if (dueTomorrow.length > 0) lines.push(`${dueTomorrow.length} deliver${dueTomorrow.length === 1 ? 'y is' : 'ies are'} due tomorrow.`);

    // If a specific customer is the active context, surface THEIR history —
    // this is the "this customer has outstanding payment" / "you've made
    // three similar jobs this week" kind of specific, non-generic awareness.
    if (context.customer) {
      const customerJobs = jobs.filter((j) => j.customerId === context.customer!.id);
      const outstanding = customerJobs.reduce((sum, j) => sum + (j.status !== 'Delivered' ? j.balance : 0), 0);
      if (outstanding > 0) {
        lines.push(`${context.customer.name} has an outstanding balance of ₦${outstanding.toLocaleString()} across their active job(s).`);
      }
      const recentSimilar = customerJobs.filter((j) => {
        try { return differenceInCalendarDays(today, parseISO(j.createdAt)) <= 30; } catch { return false; }
      });
      if (recentSimilar.length >= 3) {
        lines.push(`${context.customer.name} has ordered ${recentSimilar.length} jobs in the last 30 days — a repeat customer worth noting.`);
      }
    }

    // Same idea for whichever job is active: is it promised for a day that's
    // already overloaded?
    if (context.job && context.job.status !== 'Delivered') {
      try {
        const sameDay = active.filter((j) => isSameDay(parseISO(j.deliveryDate), parseISO(context.job!.deliveryDate)));
        if (sameDay.length >= 4) {
          lines.push(`This job's delivery date already has ${sameDay.length} other jobs promised the same day — a busy day to add to.`);
        }
      } catch {}
    }

    if (customers.length === 0) {
      lines.push('No customers registered yet.');
    }

    return lines;
  }
}

// ─── Prompts ────────────────────────────────────────────────────────────────────

const SYSTEM_IDENTITY = `You are the TailorBook Assistant — a master tailor's shop assistant working inside a tailoring business app, not a generic chatbot.

You already know the tailor's active screen, customer, and job from the context below. NEVER ask which customer or job the tailor means if one is already active — use it directly.

You also have a business snapshot (overdue jobs, today/tomorrow's delivery load, the active customer's payment history). When something in it is genuinely relevant to what the tailor just asked, mention it specifically and briefly — "Grace still owes ₦15,000 on this" beats a generic "let me check the balance." Never recite the whole snapshot unprompted; notice one relevant thing, don't narrate a report.

Speak briefly and practically, like a competent shop assistant who's paying attention. Use ₦ for currency. Never invent a number, date, or customer detail that isn't in the context you were given.`;

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
