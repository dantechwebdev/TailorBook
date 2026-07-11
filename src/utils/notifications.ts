import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Job } from '../types';
import { parseISO, subDays, isAfter } from 'date-fns';

// ─── Notification Channels ────────────────────────────────────────────────────

const CHANNEL_JOB_REMINDERS = 'job-reminders';
const CHANNEL_SCRATCH = 'scratch-reminders';
const CHANNEL_ALERTS = 'delivery-alerts';

// ─── Foreground Handler ───────────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Create Android Channels ─────────────────────────────────────────────────

async function ensureChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Promise.all([
    Notifications.setNotificationChannelAsync(CHANNEL_JOB_REMINDERS, {
      name: 'Job Reminders',
      description: 'Reminders about upcoming and overdue delivery dates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 300, 200, 300],
      lightColor: '#4B3FA0',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    }),
    Notifications.setNotificationChannelAsync(CHANNEL_ALERTS, {
      name: 'Delivery Alerts',
      description: 'High-priority alerts for delivery day and overdue jobs',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: '#E8443A',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
    }),
    Notifications.setNotificationChannelAsync(CHANNEL_SCRATCH, {
      name: 'Scratch Pad Reminders',
      description: 'Reminders set from the Scratch Pad',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200],
      lightColor: '#4B3FA0',
      sound: 'default',
      enableVibrate: true,
      showBadge: false,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    }),
  ]);
}

// ─── Permission Request ───────────────────────────────────────────────────────

export async function requestNotificationPermissions(): Promise<boolean> {
  await ensureChannels();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowProvisional: false,
      allowCriticalAlerts: false,
    },
  });

  return status === 'granted';
}

// ─── Schedule Job Reminders ───────────────────────────────────────────────────

export async function scheduleJobReminders(job: Job): Promise<void> {
  await cancelJobNotifications(job.id);

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  // Skip scheduling for delivered jobs
  if (job.status === 'Delivered') return;

  const deliveryDate = parseISO(job.deliveryDate);
  const now = new Date();

  const reminders = [
    {
      daysBefore: 7,
      title: 'Job due in 7 days',
      body: `${job.customerName}'s ${job.outfitType} is due in one week.`,
      channel: CHANNEL_JOB_REMINDERS,
    },
    {
      daysBefore: 3,
      title: 'Job due in 3 days',
      body: `${job.customerName}'s ${job.outfitType} is due on ${job.deliveryDate}.`,
      channel: CHANNEL_JOB_REMINDERS,
    },
    {
      daysBefore: 1,
      title: 'Job due tomorrow',
      body: `${job.customerName}'s ${job.outfitType} is due tomorrow. Make sure it's ready!`,
      channel: CHANNEL_JOB_REMINDERS,
    },
    {
      daysBefore: 0,
      title: 'Delivery day!',
      body: `${job.customerName}'s ${job.outfitType} is due today.`,
      channel: CHANNEL_ALERTS,
    },
  ];

  await Promise.all(
    reminders.map(async (reminder) => {
      const triggerDate = subDays(deliveryDate, reminder.daysBefore);
      triggerDate.setHours(8, 0, 0, 0);

      if (!isAfter(triggerDate, now)) return;

      try {
        await Notifications.scheduleNotificationAsync({
          identifier: `${job.id}-${reminder.daysBefore}d`,
          content: {
            title: reminder.title,
            body: reminder.body,
            data: {
              jobId: job.id,
              type: reminder.daysBefore === 0 ? 'due_today' : 'due_soon',
            },
            sound: 'default',
            badge: 1,
          },
          trigger: {
            date: triggerDate,
            channelId: reminder.channel,
          } as any,
        });
      } catch {
        // Silently skip notifications that cannot be scheduled
      }
    })
  );
}

// ─── Cancel Job Notifications ─────────────────────────────────────────────────

export async function cancelJobNotifications(jobId: string): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = scheduled.filter((n) => n.identifier.startsWith(jobId));
    await Promise.all(
      toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch {
    // Non-fatal — best-effort cancellation
  }
}

// ─── Reschedule All Job Notifications ────────────────────────────────────────

export async function rescheduleAllJobNotifications(jobs: Job[]): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const active = jobs.filter((j) => j.status !== 'Delivered');
    await Promise.all(active.map((job) => scheduleJobReminders(job)));
  } catch {
    // Non-fatal
  }
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
        channelId: CHANNEL_JOB_REMINDERS,
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
  } catch {
    // Non-fatal
  }
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
        title: 'Scratch Pad Reminder',
        body: text.length > 80 ? text.slice(0, 77) + '…' : text,
        data: { noteId, type: 'scratch' },
        sound: 'default',
      },
      trigger: {
        date: scheduledAt,
        channelId: CHANNEL_SCRATCH,
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
  } catch {
    // Non-fatal
  }
}

// ─── Notification Response Listener ──────────────────────────────────────────

export function addNotificationResponseListener(
  handler: (jobId: string) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const jobId = response.notification.request.content.data?.jobId;
    if (typeof jobId === 'string') handler(jobId);
  });
}

// ─── Badge Management ─────────────────────────────────────────────────────────

export async function clearBadge(): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch {
    // Non-fatal
  }
}
