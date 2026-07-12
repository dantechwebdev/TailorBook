import { Platform } from 'react-native';
import { Job, JobReminder } from '../types';
import { ALL_PRESETS, DEFAULT_REMINDER_HOUR } from './notifications/presets';
import type { ScheduleReminderInput, ScheduleReminderResult } from './notifications/reminderEngine';

export const REMINDER_PRESETS = ALL_PRESETS;
export { DEFAULT_REMINDER_HOUR };

export function getDefaultReminderMinutes(): number[] {
  return [24 * 60, 0];
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const mod = require('./notifications/scheduler');
  return mod.requestNotificationPermissions();
}

export function addNotificationResponseListener(
  handler: (jobId: string) => void
): { remove: () => void } {
  if (Platform.OS === 'web') return { remove: () => {} };
  const mod = require('./notifications/scheduler');
  return mod.addNotificationResponseListener(handler);
}

export async function scheduleJobReminder(
  input: ScheduleReminderInput
): Promise<ScheduleReminderResult> {
  if (Platform.OS === 'web') {
    return { scheduledAt: input.specificDate ?? new Date(), identifier: null };
  }
  const mod = require('./notifications/reminderEngine');
  return mod.scheduleJobReminder(input);
}

export async function cancelJobReminder(reminder: JobReminder): Promise<void> {
  if (Platform.OS === 'web') return;
  const mod = require('./notifications/reminderEngine');
  return mod.cancelJobReminder(reminder);
}

export async function rescheduleJobReminder(
  reminder: JobReminder,
  job: Job
): Promise<ScheduleReminderResult | null> {
  if (Platform.OS === 'web') return null;
  const mod = require('./notifications/reminderEngine');
  return mod.rescheduleJobReminder(reminder, job);
}

export async function startOrExtendRecurringOverdue(job: Job): Promise<void> {
  if (Platform.OS === 'web') return;
  const mod = require('./notifications/reminderEngine');
  return mod.startOrExtendRecurringOverdue(job);
}

export async function stopRecurringOverdue(jobId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  const mod = require('./notifications/reminderEngine');
  return mod.stopRecurringOverdue(jobId);
}

export async function reconcileReminders(
  jobs: Job[],
  reminders: JobReminder[]
): Promise<void> {
  if (Platform.OS === 'web') return;
  const mod = require('./notifications/reminderEngine');
  return mod.reconcileReminders(jobs, reminders);
}

export async function scheduleScratchReminder(
  noteId: string,
  scheduledAt: Date,
  text: string
): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const mod = require('./notifications/scratchReminders');
  return mod.scheduleScratchReminder(noteId, scheduledAt, text);
}

export async function cancelScratchReminder(identifier: string): Promise<void> {
  if (Platform.OS === 'web') return;
  const mod = require('./notifications/scratchReminders');
  return mod.cancelScratchReminder(identifier);
}

export async function clearBadge(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = require('expo-notifications');
    await Notifications.setBadgeCountAsync(0);
  } catch {}
}
