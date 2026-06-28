import { Linking } from 'react-native';
import { Job } from '../types';

// ─── WhatsApp Deep-Link System ────────────────────────────────────────────────
// The app is the BRAIN. WhatsApp is the VOICE.
// All sending is simulated when WhatsApp API is absent.

export type WhatsAppMessageType =
  | 'job_created'
  | 'ready_pickup'
  | 'ready_waybill'
  | 'payment_reminder'
  | 'delivery_complete'
  | 'custom';

function sanitizePhone(phone: string): string {
  // Strip spaces, dashes, brackets; ensure starts with country code
  let p = phone.replace(/[\s\-()]/g, '');
  if (p.startsWith('0')) p = '234' + p.slice(1);
  if (!p.startsWith('+')) p = '+' + p;
  return p.replace(/^\+/, ''); // WhatsApp wants no leading +
}

function buildMessage(type: WhatsAppMessageType, job: Job): string {
  const outfit = job.outfitType;
  const name = job.customerName.split(' ')[0];
  const date = formatDate(job.deliveryDate);

  switch (type) {
    case 'job_created':
      return (
        `Hello ${name}! 👋\n\n` +
        `Your *${outfit}* order has been received.\n` +
        `Expected delivery: *${date}*.\n` +
        `We'll keep you posted on the progress. Thank you! 🪡`
      );

    case 'ready_pickup':
      return (
        `Good day ${name}! 🎉\n\n` +
        `Your *${outfit}* is *ready for pickup*!\n` +
        `Please come in at your convenience.\n` +
        `Balance due: ₦${job.balance.toLocaleString()}\n\n` +
        `See you soon! 👋`
      );

    case 'ready_waybill':
      return (
        `Good day ${name}! 📦\n\n` +
        `Your *${outfit}* is *ready* and will be dispatched to ` +
        `*${job.deliveryAddress || 'your address'}* today.\n` +
        `Balance due: ₦${job.balance.toLocaleString()}\n\n` +
        `We'll send tracking info once it ships. Thank you! 🙏`
      );

    case 'payment_reminder':
      return (
        `Hello ${name},\n\n` +
        `This is a gentle reminder that your balance of ` +
        `*₦${job.balance.toLocaleString()}* is due for your *${outfit}*.\n` +
        `Please make payment at pickup/delivery. Thank you! 🙏`
      );

    case 'delivery_complete':
      return (
        `Hello ${name}! 🌟\n\n` +
        `Your *${outfit}* has been successfully delivered. ` +
        `We hope you love it!\n\n` +
        `Thank you for choosing us. We'd love to see you again soon! 🪡`
      );

    default:
      return `Hello ${name}, regarding your ${outfit} order.`;
  }
}

function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return isoDate;
  }
}

export async function sendWhatsAppMessage(
  phone: string,
  type: WhatsAppMessageType,
  job: Job
): Promise<{ sent: boolean; simulated: boolean }> {
  const message = buildMessage(type, job);
  const clean = sanitizePhone(phone);
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${clean}?text=${encoded}`;

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return { sent: true, simulated: false };
    }
  } catch {}

  // Fallback: silently queue (simulated)
  console.log('[WhatsApp simulated]', { phone: clean, type, message });
  return { sent: false, simulated: true };
}

export function buildWhatsAppUrl(phone: string, type: WhatsAppMessageType, job: Job): string {
  const message = buildMessage(type, job);
  const clean = sanitizePhone(phone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${clean}?text=${encoded}`;
}

export function getNotificationLabel(job: Job): string {
  const name = job.customerName.split(' ')[0];
  const outfit = job.outfitType;
  const today = new Date().toISOString().split('T')[0];
  const dueDate = job.deliveryDate.split('T')[0];

  if (job.status === 'Ready') {
    if (job.deliveryType === 'waybill') {
      return `📦 Waybill ${name} → ${job.deliveryAddress || 'dispatch'} today`;
    }
    return `👋 ${name} Pickup Today`;
  }

  if (dueDate === today) {
    return `🧵 Finish ${name}'s ${outfit} today`;
  }

  if (dueDate < today) {
    return `⚠️ ${name}'s ${outfit} is overdue`;
  }

  if (job.balance > 0) {
    return `💰 Collect balance from ${name}`;
  }

  return `🧵 ${name}'s ${outfit} in progress`;
}
