/**
 * UpdateCustomerTool
 *
 * Updates fields on the customer that is currently the active context.
 * Never asks "which customer" — it operates on whoever the tailor is
 * currently viewing.
 */

import { AIActiveContext, AIToolDefinition, AIToolResult } from '../../../types';
import { IAITool } from './ToolRegistry';
import { useStore } from '../../../context/store';
import { isValidPhone } from '../../../utils/helpers';

const definition: AIToolDefinition = {
  name: 'UpdateCustomerTool',
  description: "Update the active customer's name, phone, or notes.",
  category: 'customer',
  requiredContext: ['customer'],
  supportedScreens: ['CustomerDetail'],
  params: {
    name: { type: 'string', description: 'New name (optional)', required: false },
    phone: { type: 'string', description: 'New phone number (optional)', required: false },
    notes: { type: 'string', description: 'New notes (optional)', required: false },
  },
};

class UpdateCustomerToolImpl implements IAITool {
  readonly definition = definition;

  canRun(context: AIActiveContext): boolean {
    return !!context.customer;
  }

  async execute(args: Record<string, unknown>, context: AIActiveContext): Promise<AIToolResult> {
    if (!context.customer) {
      return { success: false, summary: 'No active customer to update.', error: 'MISSING_CONTEXT' };
    }

    if (typeof args.phone === 'string' && args.phone.trim() && !isValidPhone(args.phone.trim())) {
      return { success: false, summary: "That phone number doesn't look valid.", error: 'INVALID_PHONE' };
    }

    const { updateCustomer } = useStore.getState();
    const updated = {
      ...context.customer,
      name: typeof args.name === 'string' && args.name.trim() ? args.name.trim() : context.customer.name,
      phone: typeof args.phone === 'string' && args.phone.trim() ? args.phone.trim() : context.customer.phone,
      notes: typeof args.notes === 'string' ? args.notes : context.customer.notes,
    };

    await updateCustomer(updated);

    return {
      success: true,
      summary: `Updated ${updated.name}'s details.`,
      data: { customer: updated },
    };
  }
}

export const tool = new UpdateCustomerToolImpl();
