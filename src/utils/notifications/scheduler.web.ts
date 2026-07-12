import { Platform } from 'react-native';

export const JOB_REMINDERS_CHANNEL_ID = 'job-reminders';

export function ensureAndroidChannel(): Promise<void> {
  return Promise.resolve();
}

export async function requestNotificationPermissions(): Promise<boolean> {
  return false;
}

export async function scheduleAt(
  _identifier: string,
  _content: { title: string; body: string; data?: Record<string, unknown> },
  _date: Date
): Promise<string | null> {
  return null;
}

export async function cancel(_identifier: string): Promise<void> {}

export async function cancelByPrefix(_prefix: string): Promise<void> {}

export async function getAllScheduled(): Promise<never[]> {
  return [];
}

export function addNotificationResponseListener(
  _handler: (jobId: string) => void
): { remove: () => void } {
  return { remove: () => {} };
}
