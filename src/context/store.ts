import { create } from 'zustand';
import { Customer, Job, Measurements, AppNotification, JobStatus, TailorSettings, JobReminder, ScratchNote } from '../types';
import * as db from '../utils/database';
import { generateId } from '../utils/helpers';
import { seedDemoDataIfEmpty } from '../utils/seedData';
import { scheduleCustomJobReminder, cancelCustomJobReminder, scheduleScratchReminder, cancelScratchReminder } from '../utils/notifications';

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
  addJobReminder: (jobId: string, scheduledAt: Date, label: string, daysBefore?: number) => Promise<void>;
  removeJobReminder: (reminderId: string) => Promise<void>;
  getJobReminders: (jobId: string) => JobReminder[];

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

    await get().refreshJobs();
    return job;
  },

  updateJob: async (job) => {
    const updated = { ...job, updatedAt: new Date().toISOString() };
    await db.updateJob(updated);
    await get().refreshJobs();
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

    await get().refreshJobs();
    await get().refreshNotifications();
  },

  deleteJob: async (id) => {
    // Cancel all custom reminders for this job
    const reminders = get().jobReminders.filter((r) => r.jobId === id);
    await Promise.all(
      reminders
        .filter((r) => r.notifIdentifier)
        .map((r) => cancelCustomJobReminder(r.notifIdentifier!))
    );
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

  addJobReminder: async (jobId, scheduledAt, label, daysBefore) => {
    const job = get().jobs.find((j) => j.id === jobId);
    const now = new Date().toISOString();
    const id = generateId();

    const notifTitle = `Reminder: ${job?.outfitType || 'Job'}`;
    const notifBody = job
      ? `${job.customerName}'s ${job.outfitType}${label ? ' — ' + label : ''}`
      : label || 'Custom reminder';

    const identifier = await scheduleCustomJobReminder(id, jobId, scheduledAt, notifTitle, notifBody);

    const reminder: JobReminder = {
      id,
      jobId,
      scheduledAt: scheduledAt.toISOString(),
      label: label || '',
      daysBefore,
      repeatEvery: 0,
      notifIdentifier: identifier || undefined,
      createdAt: now,
    };

    await db.addJobReminderRecord(reminder);
    set((state) => ({ jobReminders: [...state.jobReminders, reminder] }));
  },

  removeJobReminder: async (reminderId) => {
    const reminder = get().jobReminders.find((r) => r.id === reminderId);
    if (reminder?.notifIdentifier) {
      await cancelCustomJobReminder(reminder.notifIdentifier);
    }
    await db.deleteJobReminderRecord(reminderId);
    set((state) => ({ jobReminders: state.jobReminders.filter((r) => r.id !== reminderId) }));
  },

  getJobReminders: (jobId) => get().jobReminders.filter((r) => r.jobId === jobId),

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
