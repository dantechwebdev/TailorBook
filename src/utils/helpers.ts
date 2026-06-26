import { format, isToday, isPast, isTomorrow, differenceInDays, parseISO } from 'date-fns';
import { AVATAR_COLORS } from '../constants/theme';

// ─── ID Generation ─────────────────────────────────────────────────────────────

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

export function formatDeliveryDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy, h:mm a');
  } catch {
    return dateStr;
  }
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM');
  } catch {
    return dateStr;
  }
}

export function getDeliveryUrgency(dateStr: string): 'overdue' | 'today' | 'soon' | 'normal' {
  try {
    const date = parseISO(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isPast(date) && !isToday(date)) return 'overdue';
    if (isToday(date)) return 'today';

    const daysUntil = differenceInDays(date, today);
    if (daysUntil <= 3) return 'soon';
    return 'normal';
  } catch {
    return 'normal';
  }
}

export function getDaysUntilDelivery(dateStr: string): number {
  try {
    const date = parseISO(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return differenceInDays(date, today);
  } catch {
    return 0;
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function addDaysISO(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// ─── Money Helpers ────────────────────────────────────────────────────────────

export function formatNaira(amount: number): string {
  if (amount === 0) return '₦0';
  return `₦${amount.toLocaleString('en-NG')}`;
}

export function parseNaira(text: string): number {
  const cleaned = text.replace(/[₦,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// ─── Name Helpers ─────────────────────────────────────────────────────────────

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0];
}

// ─── Phone Helpers ────────────────────────────────────────────────────────────

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

export function isValidName(name: string): boolean {
  return name.trim().length >= 2;
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────

export function getOutfitEmoji(outfitType: string): string {
  const map: Record<string, string> = {
    Agbada: '👘',
    Senator: '🥻',
    Suit: '🤵',
    Shirt: '👔',
    Trouser: '👖',
    Gown: '👗',
    Kaftan: '🧥',
    Skirt: '👗',
    Blouse: '👚',
    Other: '🪡',
  };
  return map[outfitType] || '🪡';
}
