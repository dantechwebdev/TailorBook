/**
 * Mock AI Provider
 *
 * Always available. Used in development and when no real provider is configured.
 * Returns plausible, context-aware stub responses so the UI behaves realistically
 * without requiring an API key.
 *
 * This is NOT a placeholder — it is a first-class provider used in testing
 * and as the ultimate fallback to ensure the app never crashes due to AI unavailability.
 */

import { IAIProvider } from '../AIService';
import { AICompletionRequest, AICompletionResponse } from '../../../types';

const MOCK_RESPONSES = [
  'Balance outstanding — consider requesting payment before delivery.',
  'Measurements are missing. Add them now to avoid fitting issues.',
  'Delivery is tomorrow. Confirm the garment is ready.',
  'This customer has an outstanding balance from a previous order.',
  'Tip: logging the deposit now will help track your cash flow.',
  'Consider adding a reference photo to make alterations easier.',
  'This outfit type is your most requested — keep track of common styles.',
];

export class MockAIProvider implements IAIProvider {
  readonly name = 'mock' as const;

  isAvailable(): boolean {
    return true; // Mock is always available
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    // Small artificial delay to simulate network latency in UI testing
    await new Promise((resolve) => setTimeout(resolve, 400));

    // If the last user message contains certain keywords, return contextual stubs
    const lastMessage = request.messages.filter((m) => m.role === 'user').pop();
    const content = lastMessage?.content?.toLowerCase() ?? '';

    let response: string;

    if (content.includes('balance') || content.includes('outstanding')) {
      response = 'Balance outstanding — follow up with the customer before delivery.';
    } else if (content.includes('measurement') || content.includes('no measurement')) {
      response = 'Measurements not recorded. Add them to avoid rework.';
    } else if (content.includes('overdue') || content.includes('late')) {
      response = 'This job is overdue. Prioritize it or contact the customer.';
    } else if (content.includes('revenue') || content.includes('completion')) {
      response = 'Your completion rate is strong this period. Keep the momentum going.';
    } else {
      // Rotate through generic tips based on time to avoid repetition
      const index = Math.floor(Date.now() / 60000) % MOCK_RESPONSES.length;
      response = MOCK_RESPONSES[index];
    }

    return {
      content: response,
      provider: 'mock',
      tokensUsed: 0,
    };
  }
}
