/**
 * GenerateBusinessInsightTool
 *
 * Surfaces revenue, profit, and outstanding-balance insight for the tailor's
 * business. Delegates all computation to BusinessInsightService — this tool
 * only adapts the result into a conversational summary for the AI to relay.
 */

import { AIActiveContext, AIToolDefinition, AIToolResult } from '../../../types';
import { IAITool } from './ToolRegistry';
import { useStore } from '../../../context/store';
import { businessInsightService, InsightPeriod } from '../BusinessInsightService';
import { formatNaira } from '../../../utils/helpers';

const definition: AIToolDefinition = {
  name: 'GenerateBusinessInsightTool',
  description: 'Generate revenue, profit, and outstanding-balance insight for the business over a given period.',
  category: 'insight',
  requiredContext: [],
  supportedScreens: ['Dashboard', 'BusinessInsights'],
  params: {
    period: {
      type: 'string',
      description: 'Time window to analyze',
      required: false,
      enumValues: ['week', 'month', 'all'],
    },
  },
};

class GenerateBusinessInsightToolImpl implements IAITool {
  readonly definition = definition;

  canRun(): boolean {
    return true;
  }

  async execute(args: Record<string, unknown>): Promise<AIToolResult> {
    const period = (['week', 'month', 'all'].includes(String(args.period)) ? args.period : 'month') as InsightPeriod;

    const { jobs, customers } = useStore.getState();
    const insight = businessInsightService.compute(jobs, customers.length, period);

    const summaryParts = [
      `Revenue: ${formatNaira(insight.totalRevenue)} across ${insight.totalJobs} job${insight.totalJobs !== 1 ? 's' : ''}`,
      insight.totalOutstanding > 0 ? `Outstanding: ${formatNaira(insight.totalOutstanding)}` : null,
      `${insight.completionRate}% completion rate`,
    ].filter((p): p is string => p !== null);

    const narrativeText = insight.narratives.map((n) => n.message).join(' ');

    return {
      success: true,
      summary: `${summaryParts.join(' · ')}. ${narrativeText}`,
      data: { insight },
    };
  }
}

export const tool = new GenerateBusinessInsightToolImpl();
