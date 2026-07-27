/**
 * SearchCustomerTool
 *
 * Finds customers by name or phone fragment. Used when the tailor mentions
 * a customer by name in chat and the active context doesn't already have
 * one loaded (e.g. from the Dashboard: "What does Adaeze still owe?").
 */

import { AIActiveContext, AIToolDefinition, AIToolResult } from '../../../types';
import { IAITool } from './ToolRegistry';
import { useStore } from '../../../context/store';

const definition: AIToolDefinition = {
  name: 'SearchCustomerTool',
  description: "Search customers by name or phone number fragment. Use when the tailor mentions a customer who isn't already the active context.",
  category: 'customer',
  requiredContext: [],
  supportedScreens: ['Dashboard', 'CustomerList', 'CustomerDetail', 'JobDetail', 'Notifications'],
  params: {
    query: { type: 'string', description: 'Name or phone fragment to search for', required: true },
  },
};

class SearchCustomerToolImpl implements IAITool {
  readonly definition = definition;

  canRun(): boolean {
    return true; // No context requirement — this tool finds context, it doesn't need it
  }

  async execute(args: Record<string, unknown>): Promise<AIToolResult> {
    const query = String(args.query ?? '').trim().toLowerCase();
    if (!query) {
      return { success: false, summary: 'No search query provided.', error: 'MISSING_PARAM' };
    }

    const { customers } = useStore.getState();
    const matches = customers.filter(
      (c) => c.name.toLowerCase().includes(query) || c.phone.replace(/\D/g, '').includes(query.replace(/\D/g, ''))
    );

    if (matches.length === 0) {
      return { success: true, summary: `No customer found matching "${args.query}".`, data: { matches: [] } };
    }

    return {
      success: true,
      summary: matches.length === 1
        ? `Found ${matches[0].name}.`
        : `Found ${matches.length} customers matching "${args.query}".`,
      data: { matches: matches.slice(0, 5) },
    };
  }
}

export const tool = new SearchCustomerToolImpl();
