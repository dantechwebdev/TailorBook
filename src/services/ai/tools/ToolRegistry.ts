/**
 * ToolRegistry
 *
 * The AI must never directly access SQLite, APIs, UI components, or app
 * state. Every capability it can exercise is expressed as a Tool that this
 * registry holds. The AI chooses which tool(s) to call; the tool performs
 * the actual work by calling the Zustand store (`useStore.getState()`) or a
 * repository/service — never the reverse.
 *
 * Adding a new capability to the assistant should only ever require writing
 * one new file that implements `IAITool` and registering it here. No other
 * file in the AI layer should need to change.
 */

import { AIActiveContext, AIToolDefinition, AIToolResult } from '../../../types';
import { createLogger } from '../../../utils/logger';

const log = createLogger('ToolRegistry');

// ─── Tool Interface ────────────────────────────────────────────────────────────

export interface IAITool {
  readonly definition: AIToolDefinition;
  /**
   * Whether this tool can run given the current active context.
   * Checks `definition.requiredContext` against what's actually present.
   */
  canRun(context: AIActiveContext): boolean;
  /**
   * Perform the work. `args` are whatever parameters the AI extracted from
   * the tailor's message, validated loosely against `definition.params`.
   */
  execute(args: Record<string, unknown>, context: AIActiveContext): Promise<AIToolResult>;
}

// ─── Registry ──────────────────────────────────────────────────────────────────

class ToolRegistry {
  private tools = new Map<string, IAITool>();

  register(tool: IAITool): void {
    this.tools.set(tool.definition.name, tool);
    log.debug(`Registered tool: ${tool.definition.name}`);
  }

  get(name: string): IAITool | undefined {
    return this.tools.get(name);
  }

  getAll(): IAITool[] {
    return Array.from(this.tools.values());
  }

  /** Tools whose requiredContext is satisfied by the given active context. */
  getRunnable(context: AIActiveContext): IAITool[] {
    return this.getAll().filter((t) => t.canRun(context));
  }

  /** Tools explicitly relevant to a given screen — used for quick actions. */
  getForScreen(screen: AIActiveContext['screen']): IAITool[] {
    return this.getAll().filter((t) => t.definition.supportedScreens.includes(screen));
  }

  /**
   * Produces a compact tool manifest for the LLM's system prompt — name,
   * description, and params only. Kept short so it doesn't dominate the
   * token budget on every turn.
   */
  buildManifest(context: AIActiveContext): string {
    const runnable = this.getRunnable(context);
    if (runnable.length === 0) return 'No tools are available in this context.';

    return runnable
      .map((t) => {
        const params = Object.entries(t.definition.params)
          .map(([key, p]) => `${key}${p.required ? '' : '?'}: ${p.type}`)
          .join(', ');
        return `- ${t.definition.name}(${params}) — ${t.definition.description}`;
      })
      .join('\n');
  }

  async execute(
    toolName: string,
    args: Record<string, unknown>,
    context: AIActiveContext
  ): Promise<AIToolResult> {
    const tool = this.get(toolName);
    if (!tool) {
      return { success: false, summary: `Unknown tool: ${toolName}`, error: 'TOOL_NOT_FOUND' };
    }
    if (!tool.canRun(context)) {
      return {
        success: false,
        summary: `${toolName} needs ${tool.definition.requiredContext.join(', ')} in context, which isn't available right now.`,
        error: 'MISSING_CONTEXT',
      };
    }
    try {
      log.debug(`Executing tool: ${toolName}`, args);
      return await tool.execute(args, context);
    } catch (err) {
      log.warn(`Tool ${toolName} threw`, err);
      return {
        success: false,
        summary: `${toolName} failed unexpectedly.`,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

export const toolRegistry = new ToolRegistry();

// ─── Registration ──────────────────────────────────────────────────────────────
// Lazily registers every built-in tool. Called once by AIOrchestrator.initialize().
// Kept as dynamic imports (mirroring AIService's provider loading pattern) so a
// tool with an optional dependency can fail to load without breaking the others.

let registered = false;

export async function registerBuiltInTools(): Promise<void> {
  if (registered) return;
  registered = true;

  const modules = await Promise.all([
    import('./SearchCustomerTool'),
    import('./CreateCustomerTool'),
    import('./UpdateCustomerTool'),
    import('./EstimateFabricTool'),
    import('./EstimatePriceTool'),
    import('./EstimateDeliveryDateTool'),
    import('./GenerateInvoiceTool'),
    import('./GenerateReceiptTool'),
    import('./GenerateBusinessInsightTool'),
    import('./ScheduleReminderTool'),
    import('./SendWhatsAppTool'),
    import('./AttachImageToJobTool'),
    import('./SaveJobNoteTool'),
    import('./GenerateDesignPreviewTool'),
    import('./ValidateMeasurementsTool'),
  ]);

  for (const mod of modules) {
    // Each tool module exports its singleton instance as `tool`.
    toolRegistry.register((mod as { tool: IAITool }).tool);
  }

  log.info(`${toolRegistry.getAll().length} AI tools registered`);
}
