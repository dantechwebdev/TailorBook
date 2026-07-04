import { Job } from '../types';

export async function requestNotificationPermissions(): Promise<boolean> {
  return false;
}

export async function scheduleJobReminders(_job: Job): Promise<void> {}

export async function cancelJobNotifications(_jobId: string): Promise<void> {}

export async function rescheduleAllJobNotifications(_jobs: Job[]): Promise<void> {}

export async function scheduleCustomJobReminder(
  _reminderId: string,
  _jobId: string,
  _scheduledAt: Date,
  _title: string,
  _body: string
): Promise<string | null> {
  return null;
}

export async function cancelCustomJobReminder(_identifier: string): Promise<void> {}

export async function scheduleScratchReminder(
  _id: string,
  _reminderAt: Date,
  _text: string
): Promise<string | null> {
  return null;
}

export async function cancelScratchReminder(_identifier: string): Promise<void> {}

export function addNotificationResponseListener(
  _handler: (jobId: string) => void
): { remove: () => void } {
  return { remove: () => {} };
}
