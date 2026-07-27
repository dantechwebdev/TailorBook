/**
 * EstimateFabricTool
 *
 * Estimates fabric yardage for the active job's outfit type using its
 * measurements (if recorded) or standard yardage tables as a fallback.
 * This is deterministic domain logic — not an LLM guess — so the tailor
 * gets a consistent, defensible number every time.
 *
 * Yardage figures are rough industry-standard baselines for Nigerian/West
 * African tailoring (44"-45" fabric width assumed). They are intentionally
 * conservative estimates meant as a starting point, not a substitute for
 * the tailor's own judgment.
 */

import { AIActiveContext, AIToolDefinition, AIToolResult } from '../../../types';
import { IAITool } from './ToolRegistry';

const definition: AIToolDefinition = {
  name: 'EstimateFabricTool',
  description: "Estimate fabric yardage needed for the active job's outfit type, adjusted by measurements if available.",
  category: 'estimation',
  requiredContext: ['job'],
  supportedScreens: ['JobDetail', 'Measurements'],
  params: {},
};

const BASE_YARDAGE: Record<string, number> = {
  Agbada: 8, Senator: 4.5, Suit: 3.5, Shirt: 2.25, Trouser: 1.75,
  Gown: 5, Kaftan: 3.5, Skirt: 1.5, Blouse: 1.75, Other: 3,
};

class EstimateFabricToolImpl implements IAITool {
  readonly definition = definition;

  canRun(context: AIActiveContext): boolean {
    return !!context.job;
  }

  async execute(_args: Record<string, unknown>, context: AIActiveContext): Promise<AIToolResult> {
    const job = context.job;
    if (!job) {
      return { success: false, summary: 'No active job to estimate fabric for.', error: 'MISSING_CONTEXT' };
    }

    const base = BASE_YARDAGE[job.outfitType] ?? BASE_YARDAGE.Other;
    let adjustment = 1;
    const notes: string[] = [];

    const m = context.measurements?.find((ms) => ms.customerId === job.customerId);
    if (m) {
      const chest = parseFloat(m.data.chest ?? m.data.bust ?? '');
      const hip = parseFloat(m.data.hip ?? '');
      if (!isNaN(chest)) {
        if (chest >= 44) { adjustment += 0.15; notes.push('larger chest/bust measurement'); }
        else if (chest <= 34) { adjustment -= 0.1; notes.push('smaller chest/bust measurement'); }
      }
      if (!isNaN(hip) && hip >= 46) {
        adjustment += 0.1;
        notes.push('larger hip measurement');
      }
    } else {
      notes.push('no measurements on file — using average build baseline');
    }

    const estimatedYards = Math.round(base * adjustment * 4) / 4;

    const summary = notes.length > 0
      ? `~${estimatedYards} yards of fabric for this ${job.outfitType.toLowerCase()} (adjusted for ${notes.join(', ')}).`
      : `~${estimatedYards} yards of fabric for this ${job.outfitType.toLowerCase()}.`;

    return {
      success: true,
      summary,
      data: { estimatedYards, baseYardage: base, adjustmentFactor: adjustment, notes },
    };
  }
}

export const tool = new EstimateFabricToolImpl();
