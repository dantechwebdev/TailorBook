import { ReminderPreset } from '../../types';

export const REMINDER_PRESETS: ReminderPreset[] = [
  { key: '30m', label: '30 minutes before', minutesBefore: 30 },
  { key: '1h', label: '1 hour before', minutesBefore: 60 },
  { key: '3h', label: '3 hours before', minutesBefore: 3 * 60 },
  { key: '6h', label: '6 hours before', minutesBefore: 6 * 60 },
  { key: '12h', label: '12 hours before', minutesBefore: 12 * 60 },
  { key: '1d', label: '1 day before', minutesBefore: 24 * 60 },
  { key: '2d', label: '2 days before', minutesBefore: 2 * 24 * 60 },
  { key: '3d', label: '3 days before', minutesBefore: 3 * 24 * 60 },
  { key: '1w', label: '1 week before', minutesBefore: 7 * 24 * 60 },
];

export const DEFAULT_REMINDER_PRESET_KEYS = ['1d', '0'] as const;

export const DUE_TODAY_PRESET: ReminderPreset = {
  key: '0',
  label: 'On delivery day',
  minutesBefore: 0,
};

export const ALL_PRESETS: ReminderPreset[] = [DUE_TODAY_PRESET, ...REMINDER_PRESETS];

export const DEFAULT_REMINDER_HOUR = 8;
export const OVERDUE_REMINDER_HOUR = 9;
export const RECURRING_OVERDUE_WINDOW_DAYS = 14;

export function computeReminderDate(deliveryDate: Date, minutesBefore: number): Date {
  if (minutesBefore === 0) {
    const d = new Date(deliveryDate);
    d.setHours(DEFAULT_REMINDER_HOUR, 0, 0, 0);
    return d;
  }
  if (minutesBefore >= 24 * 60) {
    const d = new Date(deliveryDate.getTime() - minutesBefore * 60 * 1000);
    d.setHours(DEFAULT_REMINDER_HOUR, 0, 0, 0);
    return d;
  }
  return new Date(deliveryDate.getTime() - minutesBefore * 60 * 1000);
}
