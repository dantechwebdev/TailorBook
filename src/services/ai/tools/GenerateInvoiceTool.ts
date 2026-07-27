/**
 * GenerateInvoiceTool
 *
 * Builds a structured invoice for the active job — itemized price, deposit,
 * balance due — formatted for the tailor to review in chat and share
 * directly over WhatsApp. No PDF dependency is introduced; the invoice is
 * a clean, copy-pasteable text block, matching how TailorBook already
 * communicates with customers everywhere else in the app.
 */

import { AIActiveContext, AIToolDefinition, AIToolResult } from '../../../types';
import { IAITool } from './ToolRegistry';
import { useStore } from '../../../context/store';
import { formatNaira, formatDate } from '../../../utils/helpers';

const definition: AIToolDefinition = {
  name: 'GenerateInvoiceTool',
  description: 'Generate an itemized invoice for the active job, ready to share with the customer.',
  category: 'document',
  requiredContext: ['job'],
  supportedScreens: ['JobDetail'],
  params: {},
};

class GenerateInvoiceToolImpl implements IAITool {
  readonly definition = definition;

  canRun(context: AIActiveContext): boolean {
    return !!context.job;
  }

  async execute(_args: Record<string, unknown>, context: AIActiveContext): Promise<AIToolResult> {
    const job = context.job;
    if (!job) {
      return { success: false, summary: 'No active job to invoice.', error: 'MISSING_CONTEXT' };
    }

    const { settings } = useStore.getState();
    const shopName = settings.shopName || settings.tailorName || 'TailorBook';
    const balance = job.balance;

    const lines = [
      `*${shopName}*`,
      settings.phone ? `📞 ${settings.phone}` : null,
      '',
      `*INVOICE*`,
      `Customer: ${job.customerName}`,
      `Item: ${job.outfitType}${job.style ? ` — ${job.style}` : ''}`,
      job.fabric ? `Fabric: ${job.fabric}` : null,
      `Delivery: ${formatDate(job.deliveryDate)}`,
      '',
      `Total Price: ${formatNaira(job.price)}`,
      `Deposit Paid: ${formatNaira(job.deposit)}`,
      `*Balance Due: ${formatNaira(balance)}*`,
      '',
      `Date: ${formatDate(new Date().toISOString())}`,
    ].filter((l): l is string => l !== null);

    const invoiceText = lines.join('\n');

    return {
      success: true,
      summary: balance > 0
        ? `Invoice ready — ${formatNaira(balance)} balance due.`
        : 'Invoice ready — fully paid.',
      data: { invoiceText, job: { id: job.id, customerName: job.customerName, balance } },
    };
  }
}

export const tool = new GenerateInvoiceToolImpl();
