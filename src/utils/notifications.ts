import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Job } from '../types';
import { parseISO, subDays, isAfter } from 'date-fns';

// ─── Configure Handler ────────────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Permission Request ───────────────────────────────────────────────────────

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('job-reminders', {
      name: 'Job Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4B3FA0',
      description: 'Reminders about upcoming and overdue jobs',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Schedule Job Reminders ───────────────────────────────────────────────────

export async function scheduleJobReminders(job: Job): Promise<void> {
  // Cancel any existing notifications for this job first
  await cancelJobNotifications(job.id);

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const deliveryDate = parseISO(job.deliveryDate);
  const now = new Date();

  const reminders = [
    {
      daysBefore: 7,
      title: '📅 Job due in 7 days',
      body: `${job.customerName}'s ${job.outfitType} is due in one week.`,
    },
    {
      daysBefore: 3,
      title: '⏰ Job due in 3 days',
      body: `${job.customerName}'s ${job.outfitType} is due on ${job.deliveryDate}.`,
    },
    {
      daysBefore: 1,
      title: '🔔 Job due tomorrow!',
      body: `${job.customerName}'s ${job.outfitType} is due tomorrow. Make sure it's ready!`,
    },
    {
      daysBefore: 0,
      title: '🚨 Delivery day!',
      body: `${job.customerName}'s ${job.outfitType} is due today.`,
    },
  ];

  for (const reminder of reminders) {
    const triggerDate = subDays(deliveryDate, reminder.daysBefore);
    triggerDate.setHours(8, 0, 0, 0); // 8:00 AM

    // Only schedule if date is in the future
    if (isAfter(triggerDate, now)) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${job.id}-${reminder.daysBefore}d`,
        content: {
          title: reminder.title,
          body: reminder.body,
          data: { jobId: job.id, type: reminder.daysBefore === 0 ? 'due_today' : 'due_soon' },
          sound: 'default',
        },
        trigger: {
          date: triggerDate,
          channelId: 'job-reminders',
        },
      });
    }
  }
}

// ─── Cancel Job Notifications ─────────────────────────────────────────────────

export async function cancelJobNotifications(jobId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const jobNotifs = scheduled.filter((n) => n.identifier.startsWith(jobId));
  await Promise.all(jobNotifs.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

// ─── Reschedule All ───────────────────────────────────────────────────────────

export async function rescheduleAllJobNotifications(jobs: Job[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const pending = jobs.filter((j) => j.status !== 'Delivered');
  await Promise.all(pending.map((job) => scheduleJobReminders(job)));
}

// ─── Custom Job Reminders ─────────────────────────────────────────────────────

export async function scheduleCustomJobReminder(
  reminderId: string,
  jobId: string,
  scheduledAt: Date,
  title: string,
  body: string
): Promise<string | null> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  const now = new Date();
  if (scheduledAt <= now) return null;

  const identifier = `${jobId}-custom-${reminderId}`;
  try {
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title,
        body,
        data: { jobId, type: 'custom' },
        sound: 'default',
      },
      trigger: {
        date: scheduledAt,
        channelId: 'job-reminders',
      } as any,
    });
    return identifier;
  } catch {
    return null;
  }
}

export async function cancelCustomJobReminder(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {}
}

// ─── Scratch Note Reminders ───────────────────────────────────────────────────

export async function scheduleScratchReminder(
  noteId: string,
  scheduledAt: Date,
  text: string
): Promise<string | null> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  const now = new Date();
  if (scheduledAt <= now) return null;

  const identifier = `scratch-${noteId}`;
  try {
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: '📝 Scratch Pad Reminder',
        body: text.length > 80 ? text.slice(0, 77) + '…' : text,
        data: { noteId, type: 'scratch' },
        sound: 'default',
      },
      trigger: {
        date: scheduledAt,
        channelId: 'job-reminders',
      } as any,
    });
    return identifier;
  } catch {
    return null;
  }
}

export async function cancelScratchReminder(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {}
}

// ─── Listen for Tap ──────────────────────────────────────────────────────────

export function addNotificationResponseListener(
  handler: (jobId: string) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const jobId = response.notification.request.content.data?.jobId;
    if (jobId) handler(jobId as string);
  });
}
