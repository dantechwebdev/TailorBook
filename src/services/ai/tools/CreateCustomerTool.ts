/**
 * CreateCustomerTool
 *
 * Registers a new customer. Useful when a tailor describes a new customer
 * conversationally ("Add a new customer, Chidi, 08012345678") instead of
 * navigating to the Create Customer form.
 */

import { AIActiveContext, AIToolDefinition, AIToolResult } from '../../../types';
import { IAITool } from './ToolRegistry';
import { useStore } from '../../../context/store';
import { isValidPhone, isValidName } from '../../../utils/helpers';

const definition: AIToolDefinition = {
  name: 'CreateCustomerTool',
  description: 'Create a new customer record with name and phone number.',
  category: 'customer',
  requiredContext: [],
  supportedScreens: ['Dashboard', 'CustomerList'],
  params: {
    name: { type: 'string', description: 'Full name of the customer', required: true },
    phone: { type: 'string', description: 'Phone number', required: true },
    notes: { type: 'string', description: 'Optional notes about the customer', required: false },
  },
};

class CreateCustomerToolImpl implements IAITool {
  readonly definition = definition;

  canRun(): boolean {
    return true;
  }

  async execute(args: Record<string, unknown>): Promise<AIToolResult> {
    const name = String(args.name ?? '').trim();
    const phone = String(args.phone ?? '').trim();

    if (!isValidName(name)) {
      return { success: false, summary: 'That name looks incomplete — need at least a first and last name.', error: 'INVALID_NAME' };
    }
    if (!isValidPhone(phone)) {
      return { success: false, summary: "That phone number doesn't look valid.", error: 'INVALID_PHONE' };
    }

    const { addCustomer } = useStore.getState();
    const customer = await addCustomer({
      name,
      phone,
      notes: typeof args.notes === 'string' ? args.notes : undefined,
    });

    return {
      success: true,
      summary: `Added ${customer.name} to your customer book.`,
      data: { customer },
    };
  }
}

export const tool = new CreateCustomerToolImpl();
