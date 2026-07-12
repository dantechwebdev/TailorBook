import { scheduleAt, cancel } from './scheduler';

const scratchIdentifier = (noteId: string) => `scratch:${noteId}`;

export async function scheduleScratchReminder(
  noteId: string,
  scheduledAt: Date,
  text: string
): Promise<string | null> {
  return scheduleAt(
    scratchIdentifier(noteId),
    {
      title: '📝 Scratch Pad Reminder',
      body: text.length > 80 ? text.slice(0, 77) + '…' : text,
      data: { noteId, type: 'scratch' },
    },
    scheduledAt
  );
}

export async function cancelScratchReminder(identifier: string): Promise<void> {
  await cancel(identifier);
}
