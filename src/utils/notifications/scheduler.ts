import { Platform } from 'react-native';

let Notifications: typeof import('expo-notifications') | null = null;

if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
  } catch {}
}

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export const JOB_REMINDERS_CHANNEL_ID = 'job-reminders';

let channelReady: Promise<void> | null = null;

export function ensureAndroidChannel(): Promise<void> {
  if (!Notifications || Platform.OS !== 'android') return Promise.resolve();
  if (!channelReady) {
    channelReady = Notifications.setNotificationChannelAsync(JOB_REMINDERS_CHANNEL_ID, {
      name: 'Job Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3470A2',
      description: 'Reminders about upcoming and overdue jobs',
    }).then(() => undefined);
  }
  return channelReady;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Notifications) return false;
  await ensureAndroidChannel();
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleAt(
  identifier: string,
  content: { title: string; body: string; data?: Record<string, unknown> },
  date: Date
): Promise<string | null> {
  if (!Notifications) return null;
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;
  if (date.getTime() <= Date.now()) return null;
  try {
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: content.title,
        body: content.body,
        data: content.data ?? {},
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        channelId: JOB_REMINDERS_CHANNEL_ID,
      },
    });
    return identifier;
  } catch (e) {
    console.warn('notifications: failed to schedule "' + identifier + '"', e);
    return null;
  }
}

export async function cancel(identifier: string): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {}
}

export async function cancelByPrefix(prefix: string): Promise<void> {
  if (!Notifications) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const matches = scheduled.filter((n) => n.identifier.startsWith(prefix));
  await Promise.all(matches.map((n) => cancel(n.identifier)));
}

export async function getAllScheduled(): Promise<any[]> {
  if (!Notifications) return [];
  return Notifications.getAllScheduledNotificationsAsync();
}

export function addNotificationResponseListener(
  handler: (jobId: string) => void
): { remove: () => void } {
  if (!Notifications) return { remove: () => {} };
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const jobId = response.notification.request.content.data?.jobId;
    if (jobId) handler(jobId as string);
  });
}
