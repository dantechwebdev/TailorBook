import { create } from 'zustand';
import { Customer, Job, Measurements, AppNotification, JobStatus, TailorSettings, JobReminder, ScratchNote } from '../types';
import * as db from '../utils/database';
import { generateId } from '../utils/helpers';
import { seedDemoDataIfEmpty } from '../utils/seedData';
import {
  scheduleJobReminder,
  cancelJobReminder,
  rescheduleJobReminder,
  startOrExtendRecurringOverdue,
  stopRecurringOverdue,
  reconcileReminders,
  getDefaultReminderMinutes,
  scheduleScratchReminder,
  cancelScratchReminder,
} from '../utils/notifications';

// ─── Store Interface ──────────────────────────────────────────────────────────

interface TailorBookState {
  customers: Customer[];
  jobs: Job[];
  measurements: Measurements[];
  notifications: AppNotification[];
  jobReminders: JobReminder[];

  dueToday: Job[];
  overdueJobs: Job[];
  pendingJobs: Job[];
  recentJobs: Job[];
  readyJobs: Job[];
  pendingWaybills: Job[];
  outstandingBalances: Job[];
  unreadNotificationCount: number;

  settings: TailorSettings;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  refreshJobs: () => Promise<void>;
  refreshCustomers: () => Promise<void>;
  refreshNotifications: () => Promise<void>;

  loadSettings: () => Promise<void>;
  saveSettings: (settings: TailorSettings) => Promise<void>;

  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Customer>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomer: (id: string) => Customer | undefined;

  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Job>;
  updateJob: (job: Job) => Promise<void>;
  updateJobStatus: (jobId: string, status: JobStatus) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  getJob: (id: string) => Job | undefined;
  getJobsByCustomer: (customerId: string) => Job[];

  addMeasurement: (m: Omit<Measurements, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Measurements>;
  updateMeasurement: (m: Measurements) => Promise<void>;
  getMeasurementsByCustomer: (customerId: string) => Measurements[];

  markNotificationRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => Promise<void>;

  // ── Per-job custom reminders ──────────────────────────────────────────────
  addJobReminder: (jobId: string, scheduledAt: Date, label: string, minutesBeforeDelivery?: number) => Promise<void>;
  removeJobReminder: (reminderId: string) => Promise<void>;
  getJobReminders: (jobId: string) => JobReminder[];
  hasRecurringOverdueReminder: (jobId: string) => boolean;
  setRecurringOverdueReminder: (jobId: string, enabled: boolean) => Promise<void>;

  // ── Scratch notes ─────────────────────────────────────────────────────────
  scratchNotes: ScratchNote[];
  addScratchNote: (text: string, reminderAt?: Date) => Promise<void>;
  updateScratchNote: (note: ScratchNote, newReminderAt?: Date | null) => Promise<void>;
  toggleScratchNote: (id: string) => Promise<void>;
  deleteScratchNote: (id: string) => Promise<void>;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: TailorSettings = {
  tailorName: '',
  shopName: '',
  phone: '',
  location: '',
  currency: '₦',
  workDays: '["Mon","Tue","Wed","Thu","Fri","Sat"]',
  defaultApparel: '',
  onboardingComplete: '0',
  profilePhotoUri: '',
};

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useStore = create<TailorBookState>((set, get) => ({
  customers: [],
  jobs: [],
  measurements: [],
  notifications: [],
  jobReminders: [],
  scratchNotes: [],
  dueToday: [],
  overdueJobs: [],
  pendingJobs: [],
  recentJobs: [],
  readyJobs: [],
  pendingWaybills: [],
  outstandingBalances: [],
  unreadNotificationCount: 0,
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    set({ isLoading: true });
    try {
      await db.getDatabase();
      await seedDemoDataIfEmpty();

      const [customers, jobs, notifications, settings, jobReminders, scratchNotes] = await Promise.all([
        db.getAllCustomers(),
        db.getAllJobs(),
        db.getAllNotifications(),
        db.getSettings(),
        db.getAllJobReminders(),
        db.getAllScratchNotes(),
      ]);

      const measurementArrays = await Promise.all(
        customers.map((c) => db.getMeasurementsByCustomer(c.id))
      );
      const measurements = measurementArrays.flat();

      const [
        dueToday, overdueJobs, pendingJobs, recentJobs, readyJobs,
        pendingWaybills, outstandingBalances, unreadNotificationCount,
      ] = await Promise.all([
        db.getJobsDueToday(),
        db.getOverdueJobs(),
        db.getPendingJobs(),
        db.getRecentJobs(10),
        db.getReadyJobs(),
        db.getPendingWaybills(),
        db.getOutstandingBalances(),
        db.getUnreadNotificationCount(),
      ]);

      reconcileReminders(jobs, jobReminders).catch((e) =>
        console.warn('Failed to reconcile notification reminders:', e)
      );

      set({
        customers, jobs, measurements, notifications, jobReminders, scratchNotes,
        dueToday, overdueJobs, pendingJobs, recentJobs, readyJobs,
        pendingWaybills, outstandingBalances,
        unreadNotificationCount, settings,
        isLoading: false, isInitialized: true,
      });
    } catch (error) {
      console.error('Failed to initialize store:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  refreshJobs: async () => {
    const [
      jobs, dueToday, overdueJobs, pendingJobs, recentJobs, readyJobs,
      pendingWaybills, outstandingBalances,
    ] = await Promise.all([
      db.getAllJobs(),
      db.getJobsDueToday(),
      db.getOverdueJobs(),
      db.getPendingJobs(),
      db.getRecentJobs(10),
      db.getReadyJobs(),
      db.getPendingWaybills(),
      db.getOutstandingBalances(),
    ]);
    set({ jobs, dueToday, overdueJobs, pendingJobs, recentJobs, readyJobs, pendingWaybills, outstandingBalances });
  },

  refreshCustomers: async () => {
    const customers = await db.getAllCustomers();
    set({ customers });
  },

  refreshNotifications: async () => {
    const [notifications, unreadNotificationCount] = await Promise.all([
      db.getAllNotifications(),
      db.getUnreadNotificationCount(),
    ]);
    set({ notifications, unreadNotificationCount });
  },

  loadSettings: async () => {
    const settings = await db.getSettings();
    set({ settings });
  },

  saveSettings: async (settings) => {
    await db.saveSettings(settings);
    set({ settings });
  },

  addCustomer: async (customerData) => {
    const now = new Date().toISOString();
    const customer: Customer = { ...customerData, id: generateId(), createdAt: now, updatedAt: now };
    await db.createCustomer(customer);
    set((state) => ({ customers: [...state.customers, customer] }));
    return customer;
  },

  updateCustomer: async (customer) => {
    const updated = { ...customer, updatedAt: new Date().toISOString() };
    await db.updateCustomer(updated);
    set((state) => ({
      customers: state.customers.map((c) => (c.id === customer.id ? updated : c)),
    }));
  },

  deleteCustomer: async (id) => {
    await db.deleteCustomer(id);
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== id),
      jobs: state.jobs.filter((j) => j.customerId !== id),
    }));
    await get().refreshJobs();
  },

  getCustomer: (id) => get().customers.find((c) => c.id === id),

  addJob: async (jobData) => {
    const now = new Date().toISOString();
    const job: Job = { ...jobData, id: generateId(), createdAt: now, updatedAt: now };
    await db.createJob(job);

    await get().addNotification({
      type: 'system',
      title: 'New order created',
      message: `${job.outfitType} for ${job.customerName} — due ${formatDate(job.deliveryDate)}`,
      jobId: job.id,
      customerId: job.customerId,
    });

    set((state) => ({ jobs: [...state.jobs, job] }));

    // Seed default reminders
    const seededReminders = await seedDefaultReminders(job);
    if (seededReminders.length > 0) {
      set((state) => ({ jobReminders: [...state.jobReminders, ...seededReminders] }));
    }

    await get().refreshJobs();
    return job;
  },

  updateJob: async (job) => {
    const previous = get().jobs.find((j) => j.id === job.id);
    const updated = { ...job, updatedAt: new Date().toISOString() };
    await db.updateJob(updated);
    await get().refreshJobs();
    if (previous && previous.deliveryDate !== job.deliveryDate) {
      await rescheduleRemindersForJob(job, get, set);
    }
  },

  updateJobStatus: async (jobId, status) => {
    const now = new Date().toISOString();
    await db.updateJobStatus(jobId, status, now);

    const job = get().jobs.find((j) => j.id === jobId);
    if (job) {
      if (status === 'Ready') {
        const deliveryNote =
          job.deliveryType === 'waybill'
            ? `Ready to dispatch to ${job.deliveryAddress || 'customer'}`
            : 'Ready for pickup';
        await get().addNotification({
          type: 'completed',
          title: `${job.outfitType} is ready!`,
          message: `${job.customerName}'s ${job.outfitType} — ${deliveryNote}`,
          jobId: job.id,
          customerId: job.customerId,
        });
      } else if (status === 'Delivered') {
        await db.deleteNotificationsByJobId(jobId);
        await get().addNotification({
          type: 'system',
          title: 'Order delivered',
          message: `${job.customerName}'s ${job.outfitType} has been delivered.`,
          jobId: job.id,
          customerId: job.customerId,
        });
      }
    }

    if (status === 'Ready' || status === 'Delivered') {
      await stopRecurringOverdueForJob(jobId, get, set);
    }

    await get().refreshJobs();
    await get().refreshNotifications();
  },

  deleteJob: async (id) => {
    // Cancel all reminders for this job
    const reminders = get().jobReminders.filter((r) => r.jobId === id);
    await Promise.all(reminders.map((r) => cancelJobReminder(r)));
    await db.deleteAllJobRemindersForJob(id);
    await db.deleteNotificationsByJobId(id);
    await db.deleteJob(id);
    set((state) => ({ jobReminders: state.jobReminders.filter((r) => r.jobId !== id) }));
    await get().refreshJobs();
    await get().refreshNotifications();
  },

  getJob: (id) => get().jobs.find((j) => j.id === id),
  getJobsByCustomer: (customerId) => get().jobs.filter((j) => j.customerId === customerId),

  addMeasurement: async (measurementData) => {
    const now = new Date().toISOString();
    const measurement: Measurements = { ...measurementData, id: generateId(), createdAt: now, updatedAt: now };
    await db.createMeasurement(measurement);
    set((state) => ({ measurements: [...state.measurements, measurement] }));
    return measurement;
  },

  updateMeasurement: async (measurement) => {
    const updated = { ...measurement, updatedAt: new Date().toISOString() };
    await db.updateMeasurement(updated);
    set((state) => ({
      measurements: state.measurements.map((m) => (m.id === measurement.id ? updated : m)),
    }));
  },

  getMeasurementsByCustomer: (customerId) =>
    get().measurements.filter((m) => m.customerId === customerId),

  markNotificationRead: async (id) => {
    await db.markNotificationRead(id);
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadNotificationCount: Math.max(0, state.unreadNotificationCount - 1),
    }));
  },

  markAllRead: async () => {
    await db.markAllNotificationsRead();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadNotificationCount: 0,
    }));
  },

  addNotification: async (notifData) => {
    const notification: AppNotification = {
      ...notifData,
      id: generateId(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    await db.createNotification(notification);
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadNotificationCount: state.unreadNotificationCount + 1,
    }));
  },

  // ── Reminders ──────────────────────────────────────────────────────────────

  addJobReminder: async (jobId, scheduledAt, label, minutesBeforeDelivery) => {
    const job = get().jobs.find((j) => j.id === jobId);
    if (!job) return;
    const id = generateId();
    const { identifier } = await scheduleJobReminder({
      reminderId: id,
      job,
      label,
      minutesBeforeDelivery,
      specificDate: minutesBeforeDelivery !== undefined ? undefined : scheduledAt,
    });
    const reminder: JobReminder = {
      id, jobId, scheduledAt: scheduledAt.toISOString(), label,
      minutesBeforeDelivery,
      notifIdentifier: identifier || undefined,
      createdAt: new Date().toISOString(),
    };
    await db.addJobReminderRecord(reminder);
    set((state) => ({ jobReminders: [...state.jobReminders, reminder] }));
  },

  removeJobReminder: async (reminderId) => {
    const reminder = get().jobReminders.find((r) => r.id === reminderId);
    if (reminder) {
      await cancelJobReminder(reminder);
    }
    await db.deleteJobReminderRecord(reminderId);
    set((state) => ({ jobReminders: state.jobReminders.filter((r) => r.id !== reminderId) }));
  },

  getJobReminders: (jobId) => get().jobReminders.filter((r) => r.jobId === jobId),

  hasRecurringOverdueReminder: (jobId) => {
    return get().jobReminders.some((r) => r.jobId === jobId && r.isRecurringOverdue);
  },

  setRecurringOverdueReminder: async (jobId, enabled) => {
    if (enabled) {
      const job = get().jobs.find((j) => j.id === jobId);
      if (!job) return;
      await startOrExtendRecurringOverdue(job);
      const existing = get().jobReminders.find((r) => r.jobId === jobId && r.isRecurringOverdue);
      if (!existing) {
        const reminder: JobReminder = {
          id: generateId(), jobId, scheduledAt: job.deliveryDate,
          label: 'Daily reminder while overdue', isRecurringOverdue: true,
          notifIdentifier: `job:${jobId}:overdue:`, createdAt: new Date().toISOString(),
        };
        await db.addJobReminderRecord(reminder);
        set((state) => ({ jobReminders: [...state.jobReminders, reminder] }));
      }
    } else {
      await stopRecurringOverdueForJob(jobId, get, set);
    }
  },

  // ── Scratch notes ─────────────────────────────────────────────────────────

  addScratchNote: async (text, reminderAt) => {
    const now = new Date().toISOString();
    const id = generateId();
    let notifIdentifier: string | undefined;
    if (reminderAt) {
      const identifier = await scheduleScratchReminder(id, reminderAt, text);
      notifIdentifier = identifier ?? undefined;
    }
    const note: ScratchNote = {
      id, text,
      reminderAt: reminderAt?.toISOString(),
      notifIdentifier,
      isDone: false,
      createdAt: now, updatedAt: now,
    };
    await db.createScratchNote(note);
    set((state) => ({ scratchNotes: [note, ...state.scratchNotes] }));
  },

  updateScratchNote: async (note, newReminderAt) => {
    const now = new Date().toISOString();
    let updated = { ...note, updatedAt: now };

    if (newReminderAt !== undefined) {
      if (note.notifIdentifier) await cancelScratchReminder(note.notifIdentifier);
      if (newReminderAt === null) {
        updated = { ...updated, reminderAt: undefined, notifIdentifier: undefined };
      } else {
        const identifier = await scheduleScratchReminder(note.id, newReminderAt, note.text);
        updated = {
          ...updated,
          reminderAt: newReminderAt.toISOString(),
          notifIdentifier: identifier ?? undefined,
        };
      }
    }

    await db.updateScratchNote(updated);
    set((state) => ({
      scratchNotes: state.scratchNotes.map((n) => (n.id === note.id ? updated : n)),
    }));
  },

  toggleScratchNote: async (id) => {
    const note = get().scratchNotes.find((n) => n.id === id);
    if (!note) return;
    const updated = { ...note, isDone: !note.isDone, updatedAt: new Date().toISOString() };
    if (updated.isDone && note.notifIdentifier) {
      await cancelScratchReminder(note.notifIdentifier);
      updated.notifIdentifier = undefined;
      updated.reminderAt = undefined;
    }
    await db.updateScratchNote(updated);
    set((state) => ({
      scratchNotes: state.scratchNotes.map((n) => (n.id === id ? updated : n)),
    }));
  },

  deleteScratchNote: async (id) => {
    const note = get().scratchNotes.find((n) => n.id === id);
    if (note?.notifIdentifier) await cancelScratchReminder(note.notifIdentifier);
    await db.deleteScratchNote(id);
    set((state) => ({ scratchNotes: state.scratchNotes.filter((n) => n.id !== id) }));
  },
}));

function formatDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
  } catch { return isoDate; }
}

// ─── Helper Types ─────────────────────────────────────────────────────────────

type Get = () => TailorBookState;
type Set = (fn: (state: TailorBookState) => Partial<TailorBookState>) => void;

// ─── Helper Functions ─────────────────────────────────────────────────────────

async function seedDefaultReminders(job: Job): Promise<JobReminder[]> {
  const minutesList = getDefaultReminderMinutes();
  const created: JobReminder[] = [];
  for (const minutesBefore of minutesList) {
    const id = generateId();
    const label = minutesBefore === 0 ? 'On delivery day' : minutesBefore === 24 * 60 ? '1 day before delivery' : `${minutesBefore} min before`;
    const { scheduledAt, identifier } = await scheduleJobReminder({
      reminderId: id, job, label, minutesBeforeDelivery: minutesBefore,
    });
    const reminder: JobReminder = {
      id, jobId: job.id, scheduledAt: scheduledAt.toISOString(),
      label, minutesBeforeDelivery: minutesBefore,
      notifIdentifier: identifier || undefined,
      createdAt: new Date().toISOString(),
    };
    await db.addJobReminderRecord(reminder);
    created.push(reminder);
  }
  // Also seed a recurring overdue reminder
  await startOrExtendRecurringOverdue(job);
  const overdueReminder: JobReminder = {
    id: generateId(), jobId: job.id, scheduledAt: job.deliveryDate,
    label: 'Daily reminder while overdue', isRecurringOverdue: true,
    notifIdentifier: `job:${job.id}:overdue:`, createdAt: new Date().toISOString(),
  };
  await db.addJobReminderRecord(overdueReminder);
  created.push(overdueReminder);
  return created;
}

async function rescheduleRemindersForJob(job: Job, get: Get, set: Set): Promise<void> {
  const reminders = get().jobReminders.filter((r) => r.jobId === job.id);
  const updates = new Map<string, JobReminder>();
  for (const reminder of reminders) {
    if (reminder.isRecurringOverdue) {
      await startOrExtendRecurringOverdue(job);
      continue;
    }
    const result = await rescheduleJobReminder(reminder, job);
    if (!result) continue;
    const updated: JobReminder = {
      ...reminder,
      scheduledAt: result.scheduledAt.toISOString(),
      notifIdentifier: result.identifier || undefined,
    };
    await db.deleteJobReminderRecord(reminder.id);
    await db.addJobReminderRecord(updated);
    updates.set(reminder.id, updated);
  }
  if (updates.size > 0) {
    set((state) => ({ jobReminders: state.jobReminders.map((r) => updates.get(r.id) ?? r) }));
  }
}

async function stopRecurringOverdueForJob(jobId: string, get: Get, set: Set): Promise<void> {
  const reminder = get().jobReminders.find((r) => r.jobId === jobId && r.isRecurringOverdue);
  if (!reminder) return;
  await stopRecurringOverdue(jobId);
  await db.deleteJobReminderRecord(reminder.id);
  set((state) => ({ jobReminders: state.jobReminders.filter((r) => r.id !== reminder.id) }));
}
