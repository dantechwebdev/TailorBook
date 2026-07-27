/**
 * EstimatePriceTool
 *
 * Suggests a price for a job by looking at what this tailor has actually
 * charged for similar outfit types in the past — real historical data,
 * not a generic guess. Falls back to a sensible message when there's no
 * history yet for that outfit type.
 */

import { AIActiveContext, AIToolDefinition, AIToolResult } from '../../../types';
import { IAITool } from './ToolRegistry';
import { useStore } from '../../../context/store';
import { formatNaira } from '../../../utils/helpers';

const definition: AIToolDefinition = {
  name: 'EstimatePriceTool',
  description: "Suggest a price for the active job based on this tailor's pricing history for similar outfit types.",
  category: 'estimation',
  requiredContext: ['job'],
  supportedScreens: ['JobDetail'],
  params: {},
};

class EstimatePriceToolImpl implements IAITool {
  readonly definition = definition;

  canRun(context: AIActiveContext): boolean {
    return !!context.job;
  }

  async execute(_args: Record<string, unknown>, context: AIActiveContext): Promise<AIToolResult> {
    const job = context.job;
    if (!job) {
      return { success: false, summary: 'No active job to estimate a price for.', error: 'MISSING_CONTEXT' };
    }

    const { jobs } = useStore.getState();
    const comparable = jobs.filter(
      (j) => j.outfitType === job.outfitType && j.id !== job.id && j.price > 0
    );

    if (comparable.length === 0) {
      return {
        success: true,
        summary: `No pricing history yet for ${job.outfitType}. Once you've priced a few, I can suggest a range.`,
        data: { hasHistory: false },
      };
    }

    const prices = comparable.map((j) => j.price).sort((a, b) => a - b);
    const min = prices[0];
    const max = prices[prices.length - 1];
    const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);

    return {
      success: true,
      summary: `Based on ${comparable.length} past ${job.outfitType} job${comparable.length !== 1 ? 's' : ''}, you typically charge ${formatNaira(min)}–${formatNaira(max)} (average ${formatNaira(avg)}).`,
      data: { min, max, average: avg, sampleSize: comparable.length, hasHistory: true },
    };
  }
}

export const tool = new EstimatePriceToolImpl();
