import { Job, JobReminder } from '../types';
import { ALL_PRESETS, DEFAULT_REMINDER_HOUR } from './notifications/presets';
import type { ScheduleReminderInput, ScheduleReminderResult } from './notifications/reminderEngine';

export const REMINDER_PRESETS = ALL_PRESETS;
export { DEFAULT_REMINDER_HOUR };

export function getDefaultReminderMinutes(): number[] { return [24 * 60, 0]; }
export async function requestNotificationPermissions(): Promise<boolean> { return false; }
export function addNotificationResponseListener(_handler: (jobId: string) => void): { remove: () => void } { return { remove: () => {} }; }
export async function scheduleJobReminder(input: ScheduleReminderInput): Promise<ScheduleReminderResult> { return { scheduledAt: input.specificDate ?? new Date(), identifier: null }; }
export async function cancelJobReminder(_reminder: JobReminder): Promise<void> {}
export async function rescheduleJobReminder(_reminder: JobReminder, _job: Job): Promise<ScheduleReminderResult | null> { return null; }
export async function startOrExtendRecurringOverdue(_job: Job): Promise<void> {}
export async function stopRecurringOverdue(_jobId: string): Promise<void> {}
export async function reconcileReminders(_jobs: Job[], _reminders: JobReminder[]): Promise<void> {}
export async function scheduleScratchReminder(_noteId: string, _scheduledAt: Date, _text: string): Promise<string | null> { return null; }
export async function cancelScratchReminder(_identifier: string): Promise<void> {}
export async function clearBadge(): Promise<void> {}
