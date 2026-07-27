/**
 * EstimateDeliveryDateTool
 *
 * Suggests a realistic delivery date by looking at how many active jobs are
 * already in the pipeline plus a baseline turnaround per outfit type. This
 * prevents over-promising delivery dates the tailor can't actually hit.
 */

import { AIActiveContext, AIToolDefinition, AIToolResult } from '../../../types';
import { IAITool } from './ToolRegistry';
import { useStore } from '../../../context/store';
import { formatDate } from '../../../utils/helpers';

const definition: AIToolDefinition = {
  name: 'EstimateDeliveryDateTool',
  description: "Suggest a realistic delivery date for the active job based on current workload and the outfit's typical turnaround time.",
  category: 'estimation',
  requiredContext: ['job'],
  supportedScreens: ['JobDetail'],
  params: {},
};

const BASE_TURNAROUND_DAYS: Record<string, number> = {
  Agbada: 7, Senator: 4, Suit: 6, Shirt: 2, Trouser: 2,
  Gown: 6, Kaftan: 4, Skirt: 2, Blouse: 2, Other: 4,
};

class EstimateDeliveryDateToolImpl implements IAITool {
  readonly definition = definition;

  canRun(context: AIActiveContext): boolean {
    return !!context.job;
  }

  async execute(_args: Record<string, unknown>, context: AIActiveContext): Promise<AIToolResult> {
    const job = context.job;
    if (!job) {
      return { success: false, summary: 'No active job to estimate delivery for.', error: 'MISSING_CONTEXT' };
    }

    const { jobs } = useStore.getState();
    const activePipeline = jobs.filter((j) => j.status !== 'Delivered' && j.id !== job.id).length;

    const base = BASE_TURNAROUND_DAYS[job.outfitType] ?? BASE_TURNAROUND_DAYS.Other;
    const queueDelay = Math.floor(activePipeline / 3);
    const totalDays = base + queueDelay;

    const suggested = new Date();
    suggested.setDate(suggested.getDate() + totalDays);
    const suggestedIso = suggested.toISOString();

    const queueNote = queueDelay > 0
      ? ` (${activePipeline} other active jobs are adding about ${queueDelay} day${queueDelay !== 1 ? 's' : ''} of queue time)`
      : '';

    return {
      success: true,
      summary: `A realistic delivery date is around ${formatDate(suggestedIso)} — ${totalDays} days out${queueNote}.`,
      data: { suggestedDate: suggestedIso, baseDays: base, queueDelayDays: queueDelay, activePipelineCount: activePipeline },
    };
  }
}

export const tool = new EstimateDeliveryDateToolImpl();
