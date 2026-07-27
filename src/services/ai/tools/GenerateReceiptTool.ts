/**
 * GenerateReceiptTool
 *
 * Builds a payment receipt for the active job — confirms what's been paid
 * to date, distinct from GenerateInvoiceTool which shows what's still owed.
 * Same text-based, WhatsApp-shareable format.
 */

import { AIActiveContext, AIToolDefinition, AIToolResult } from '../../../types';
import { IAITool } from './ToolRegistry';
import { useStore } from '../../../context/store';
import { formatNaira, formatDate } from '../../../utils/helpers';

const definition: AIToolDefinition = {
  name: 'GenerateReceiptTool',
  description: 'Generate a payment receipt confirming what the customer has paid for the active job so far.',
  category: 'document',
  requiredContext: ['job'],
  supportedScreens: ['JobDetail'],
  params: {},
};

class GenerateReceiptToolImpl implements IAITool {
  readonly definition = definition;

  canRun(context: AIActiveContext): boolean {
    return !!context.job;
  }

  async execute(_args: Record<string, unknown>, context: AIActiveContext): Promise<AIToolResult> {
    const job = context.job;
    if (!job) {
      return { success: false, summary: 'No active job to write a receipt for.', error: 'MISSING_CONTEXT' };
    }

    const { settings } = useStore.getState();
    const shopName = settings.shopName || settings.tailorName || 'TailorBook';
    const amountPaid = job.price - job.balance;

    if (amountPaid <= 0) {
      return {
        success: true,
        summary: `No payment recorded yet for ${job.customerName}'s ${job.outfitType}.`,
        data: { hasPayment: false },
      };
    }

    const lines = [
      `*${shopName}*`,
      settings.phone ? `📞 ${settings.phone}` : null,
      '',
      `*RECEIPT*`,
      `Customer: ${job.customerName}`,
      `Item: ${job.outfitType}${job.style ? ` — ${job.style}` : ''}`,
      '',
      `Amount Paid: ${formatNaira(amountPaid)}`,
      job.balance > 0 ? `Remaining Balance: ${formatNaira(job.balance)}` : `*PAID IN FULL*`,
      '',
      `Date: ${formatDate(new Date().toISOString())}`,
    ].filter((l): l is string => l !== null);

    const receiptText = lines.join('\n');

    return {
      success: true,
      summary: job.balance > 0
        ? `Receipt ready for ${formatNaira(amountPaid)} paid — ${formatNaira(job.balance)} remaining.`
        : `Receipt ready — paid in full.`,
      data: { receiptText, amountPaid, hasPayment: true },
    };
  }
}

export const tool = new GenerateReceiptToolImpl();
