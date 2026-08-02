import { parseISO, differenceInCalendarDays } from 'date-fns';
import { Job, JobReminder } from '../../types';
import { scheduleAt, cancel, cancelByPrefix } from './scheduler';
import { getFirstName } from '../helpers';
import {
  ALL_PRESETS,
  DEFAULT_REMINDER_HOUR,
  OVERDUE_REMINDER_HOUR,
  RECURRING_OVERDUE_WINDOW_DAYS,
  computeReminderDate,
} from './presets';

const reminderIdentifier = (jobId: string, reminderId: string) => `job:${jobId}:reminder:${reminderId}`;
const overduePrefix = (jobId: string) => `job:${jobId}:overdue:`;

// Turns "due in N days" into how a tailor would actually say it out loud.
// This is what separates "Reminder: Senator" from "John's senator outfit is
// due tomorrow" — the same underlying fact, said the way a person would.
function relativeDueText(deliveryDateIso: string): string {
  const days = differenceInCalendarDays(parseISO(deliveryDateIso), new Date());
  if (days < 0) return `was due ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
  if (days === 0) return 'is due today';
  if (days === 1) return 'is due tomorrow';
  return `is due in ${days} days`;
}

function jobReminderContent(job: Job, label: string) {
  const name = getFirstName(job.customerName);
  const due = relativeDueText(job.deliveryDate);
  const body = label
    ? `${name}'s ${job.outfitType.toLowerCase()} ${due} — ${label}`
    : `${name}'s ${job.outfitType.toLowerCase()} ${due}.`;

  return {
    title: `${name}'s ${job.outfitType}`,
    body,
    data: { jobId: job.id, type: 'job_reminder' },
  };
}

export function getDefaultReminderMinutes(): number[] {
  return [24 * 60, 0];
}

export interface ScheduleReminderInput {
  reminderId: string;
  job: Job;
  label: string;
  minutesBeforeDelivery?: number;
  specificDate?: Date;
}

export interface ScheduleReminderResult {
  scheduledAt: Date;
  identifier: string | null;
}

export async function scheduleJobReminder(input: ScheduleReminderInput): Promise<ScheduleReminderResult> {
  const { reminderId, job, label, minutesBeforeDelivery, specificDate } = input;
  const identifier = reminderIdentifier(job.id, reminderId);
  const scheduledAt = specificDate ?? computeReminderDate(parseISO(job.deliveryDate), minutesBeforeDelivery ?? 0);
  const result = await scheduleAt(identifier, jobReminderContent(job, label), scheduledAt);
  return { scheduledAt, identifier: result };
}

export async function cancelJobReminder(reminder: JobReminder): Promise<void> {
  if (reminder.isRecurringOverdue) {
    await cancelByPrefix(overduePrefix(reminder.jobId));
    return;
  }
  await cancel(reminderIdentifier(reminder.jobId, reminder.id));
}

export async function rescheduleJobReminder(
  reminder: JobReminder,
  job: Job
): Promise<ScheduleReminderResult | null> {
  if (reminder.minutesBeforeDelivery === undefined) return null;
  await cancel(reminderIdentifier(job.id, reminder.id));
  return scheduleJobReminder({
    reminderId: reminder.id,
    job,
    label: reminder.label,
    minutesBeforeDelivery: reminder.minutesBeforeDelivery,
  });
}

export async function startOrExtendRecurringOverdue(job: Job): Promise<void> {
  const prefix = overduePrefix(job.id);
  await cancelByPrefix(prefix);
  const deliveryDate = parseISO(job.deliveryDate);
  const now = new Date();
  const firstOverdueDay = new Date(Math.max(deliveryDate.getTime(), now.getTime()));
  firstOverdueDay.setDate(firstOverdueDay.getDate() + 1);
  firstOverdueDay.setHours(OVERDUE_REMINDER_HOUR, 0, 0, 0);
  const dayOffsets = Array.from({ length: RECURRING_OVERDUE_WINDOW_DAYS }, (_, i) => i);
  await Promise.all(
    dayOffsets.map((dayOffset) => {
      const date = new Date(firstOverdueDay);
      date.setDate(date.getDate() + dayOffset);
      return scheduleAt(
        `${prefix}${dayOffset}`,
        {
          title: `${getFirstName(job.customerName)}'s ${job.outfitType} is overdue`,
          body: job.status === 'Ready'
            ? `${getFirstName(job.customerName)} hasn't collected their ${job.outfitType.toLowerCase()} yet. Worth a follow-up message.`
            : `Still in progress and past its delivery date. Update the status once it's ready.`,
          data: { jobId: job.id, type: 'overdue' },
        },
        date
      );
    })
  );
}

export async function stopRecurringOverdue(jobId: string): Promise<void> {
  await cancelByPrefix(overduePrefix(jobId));
}

export async function reconcileReminders(jobs: Job[], reminders: JobReminder[]): Promise<void> {
  const jobsById = new Map(jobs.map((j) => [j.id, j]));
  await Promise.all(
    reminders.map(async (reminder) => {
      const job = jobsById.get(reminder.jobId);
      if (!job || reminder.isRecurringOverdue) return;
      const scheduledAt = new Date(reminder.scheduledAt);
      if (scheduledAt.getTime() <= Date.now()) return;
      await scheduleAt(
        reminderIdentifier(job.id, reminder.id),
        jobReminderContent(job, reminder.label),
        scheduledAt
      );
    })
  );
  const activeRecurringJobIds = new Set(
    reminders.filter((r) => r.isRecurringOverdue).map((r) => r.jobId)
  );
  await Promise.all(
    Array.from(activeRecurringJobIds).map(async (jobId) => {
      const job = jobsById.get(jobId);
      if (job && job.status !== 'Ready' && job.status !== 'Delivered') {
        await startOrExtendRecurringOverdue(job);
      }
    })
  );
}

export { ALL_PRESETS as REMINDER_PRESETS, DEFAULT_REMINDER_HOUR };
