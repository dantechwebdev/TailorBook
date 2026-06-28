import { Linking } from 'react-native';
import { Job } from '../types';

// ─── WhatsApp Deep-Link System ────────────────────────────────────────────────
// The app is the BRAIN. WhatsApp is the VOICE.

export type WhatsAppMessageType =
  | 'job_created'
  | 'ready_pickup'
  | 'ready_waybill'
  | 'payment_reminder'
  | 'delivery_complete'
  | 'custom';

export function sanitizePhone(phone: string): string {
  let p = phone.replace(/[\s\-()]/g, '');
  if (p.startsWith('0')) p = '234' + p.slice(1);
  if (!p.startsWith('+')) p = '+' + p;
  return p.replace(/^\+/, '');
}

function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return isoDate;
  }
}

export function buildMessageText(
  type: WhatsAppMessageType,
  job: Job,
  currency = '₦'
): string {
  const outfit = job.outfitType;
  const name = job.customerName.split(' ')[0];
  const date = formatDate(job.deliveryDate);
  const balance = `${currency}${job.balance.toLocaleString()}`;

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
        (job.balance > 0 ? `Balance due: *${balance}*\n\n` : '\n') +
        `See you soon! 👋`
      );

    case 'ready_waybill':
      return (
        `Good day ${name}! 📦\n\n` +
        `Your *${outfit}* is *ready* and will be dispatched to ` +
        `*${job.deliveryAddress || 'your address'}* today.\n` +
        (job.balance > 0 ? `Balance due: *${balance}*\n\n` : '\n') +
        `We'll send tracking info once it ships. Thank you! 🙏`
      );

    case 'payment_reminder':
      return (
        `Hello ${name},\n\n` +
        `This is a gentle reminder that your balance of ` +
        `*${balance}* is due for your *${outfit}*.\n` +
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

export function buildWhatsAppUrl(
  phone: string,
  type: WhatsAppMessageType,
  job: Job,
  currency = '₦'
): string {
  const message = buildMessageText(type, job, currency);
  const clean = sanitizePhone(phone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${clean}?text=${encoded}`;
}

export function buildDirectChatUrl(phone: string): string {
  const clean = sanitizePhone(phone);
  return `https://wa.me/${clean}`;
}

export async function sendWhatsAppMessage(
  phone: string,
  type: WhatsAppMessageType,
  job: Job,
  currency = '₦'
): Promise<{ sent: boolean; simulated: boolean }> {
  const url = buildWhatsAppUrl(phone, type, job, currency);
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return { sent: true, simulated: false };
    }
  } catch {}
  console.log('[WhatsApp simulated]', { phone, type });
  return { sent: false, simulated: true };
}

export function getMessageTypeLabel(type: WhatsAppMessageType, deliveryType?: string): string {
  switch (type) {
    case 'job_created': return 'Order confirmation';
    case 'ready_pickup': return 'Ready for pickup';
    case 'ready_waybill': return 'Ready to dispatch';
    case 'payment_reminder': return 'Payment reminder';
    case 'delivery_complete': return 'Delivery complete';
    default: return 'Message';
  }
}

export function getNotificationLabel(job: Job): string {
  const name = job.customerName.split(' ')[0];
  const outfit = job.outfitType;
  const today = new Date().toISOString().split('T')[0];
  const dueDate = job.deliveryDate.split('T')[0];

  if (job.status === 'Ready') {
    if (job.deliveryType === 'waybill') {
      return `Dispatch ${name}'s ${outfit} → ${job.deliveryAddress || 'destination'} today`;
    }
    return `${name} Pickup Today — ${outfit} is ready`;
  }

  if (dueDate === today) return `Finish ${name}'s ${outfit} today`;
  if (dueDate < today) return `${name}'s ${outfit} is overdue`;
  if (job.balance > 0) return `Collect balance from ${name}`;

  return `${name}'s ${outfit} in progress`;
}
