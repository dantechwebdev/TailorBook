/**
 * SendWhatsAppTool
 *
 * Sends a pre-built WhatsApp message to the active job's customer, reusing
 * the exact message templates the rest of the app already uses (job created,
 * ready for pickup/dispatch, payment reminder, delivery complete). The AI
 * decides WHICH message type fits the request; this tool does the sending.
 */

import { AIActiveContext, AIToolDefinition, AIToolResult } from '../../../types';
import { IAITool } from './ToolRegistry';
import { sendWhatsAppMessage, WhatsAppMessageType, getMessageTypeLabel } from '../../../utils/whatsapp';
import { useStore } from '../../../context/store';

const definition: AIToolDefinition = {
  name: 'SendWhatsAppTool',
  description: "Send a WhatsApp message to the active job's customer. Choose messageType based on what the tailor wants to communicate.",
  category: 'communication',
  requiredContext: ['job'],
  supportedScreens: ['JobDetail'],
  params: {
    messageType: {
      type: 'string',
      description: 'Which template to send',
      required: true,
      enumValues: ['job_created', 'ready_pickup', 'ready_waybill', 'payment_reminder', 'delivery_complete'],
    },
  },
};

class SendWhatsAppToolImpl implements IAITool {
  readonly definition = definition;

  canRun(context: AIActiveContext): boolean {
    return !!context.job;
  }

  async execute(args: Record<string, unknown>, context: AIActiveContext): Promise<AIToolResult> {
    const job = context.job;
    if (!job) {
      return { success: false, summary: 'No active job to message about.', error: 'MISSING_CONTEXT' };
    }

    const phone = job.customerPhone;
    if (!phone) {
      return { success: false, summary: `${job.customerName} has no phone number on file.`, error: 'MISSING_PHONE' };
    }

    const messageType = String(args.messageType ?? '') as WhatsAppMessageType;
    const validTypes = definition.params.messageType.enumValues ?? [];
    if (!validTypes.includes(messageType)) {
      return { success: false, summary: `Unrecognized message type "${args.messageType}".`, error: 'INVALID_PARAM' };
    }

    const { settings } = useStore.getState();
    const result = await sendWhatsAppMessage(phone, messageType, job, settings.currency);
    const label = getMessageTypeLabel(messageType, job.deliveryType);

    return {
      success: result.sent || result.simulated,
      summary: result.sent
        ? `Opened WhatsApp with the "${label}" message for ${job.customerName}.`
        : `Couldn't open WhatsApp directly, but the "${label}" message is ready to send.`,
      data: { messageType, sent: result.sent },
    };
  }
}

export const tool = new SendWhatsAppToolImpl();
