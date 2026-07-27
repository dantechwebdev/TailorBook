/**
 * ScheduleReminderTool
 *
 * Schedules a custom reminder against the active job. Wraps
 * `useStore.getState().addJobReminder`, which already handles local
 * notification scheduling — this tool doesn't touch notifications directly.
 */

import { AIActiveContext, AIToolDefinition, AIToolResult } from '../../../types';
import { IAITool } from './ToolRegistry';
import { useStore } from '../../../context/store';
import { formatDateTime } from '../../../utils/helpers';

const definition: AIToolDefinition = {
  name: 'ScheduleReminderTool',
  description: 'Schedule a reminder for the active job at a specific date/time.',
  category: 'reminder',
  requiredContext: ['job'],
  supportedScreens: ['JobDetail', 'Notifications'],
  params: {
    label: { type: 'string', description: 'What the reminder is about', required: true },
    isoDateTime: { type: 'string', description: 'ISO date-time string for when to remind', required: true },
  },
};

class ScheduleReminderToolImpl implements IAITool {
  readonly definition = definition;

  canRun(context: AIActiveContext): boolean {
    return !!context.job;
  }

  async execute(args: Record<string, unknown>, context: AIActiveContext): Promise<AIToolResult> {
    const job = context.job;
    if (!job) {
      return { success: false, summary: 'No active job to schedule a reminder for.', error: 'MISSING_CONTEXT' };
    }

    const label = String(args.label ?? '').trim();
    const isoDateTime = String(args.isoDateTime ?? '').trim();

    const when = new Date(isoDateTime);
    if (!label || isNaN(when.getTime())) {
      return { success: false, summary: 'Need a valid label and date/time to schedule that reminder.', error: 'INVALID_PARAM' };
    }
    if (when.getTime() <= Date.now()) {
      return { success: false, summary: "That time has already passed — pick a future date.", error: 'INVALID_PARAM' };
    }

    const { addJobReminder } = useStore.getState();
    await addJobReminder(job.id, when, label);

    return {
      success: true,
      summary: `Reminder set: "${label}" on ${formatDateTime(when.toISOString())}.`,
      data: { label, scheduledAt: when.toISOString() },
    };
  }
}

export const tool = new ScheduleReminderToolImpl();
