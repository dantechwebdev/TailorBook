import { Job } from '../types';

export async function requestNotificationPermissions(): Promise<boolean> {
  return false;
}

export async function scheduleJobReminders(_job: Job): Promise<void> {}

export async function cancelJobNotifications(_jobId: string): Promise<void> {}

export async function rescheduleAllJobNotifications(_jobs: Job[]): Promise<void> {}

export function addNotificationResponseListener(
  _handler: (jobId: string) => void
): { remove: () => void } {
  return { remove: () => {} };
}
