import { create } from 'zustand';
import { Customer, Job, Measurements, AppNotification, JobStatus } from '../types';
import * as db from '../utils/database';
import { generateId } from '../utils/helpers';
import { seedDemoDataIfEmpty } from '../utils/seedData';

// ─── Store Interface ──────────────────────────────────────────────────────────

interface TailorBookState {
  // Data
  customers: Customer[];
  jobs: Job[];
  measurements: Measurements[];
  notifications: AppNotification[];

  // Derived / cached
  dueToday: Job[];
  overdueJobs: Job[];
  pendingJobs: Job[];
  recentJobs: Job[];
  unreadNotificationCount: number;

  // Loading states
  isLoading: boolean;
  isInitialized: boolean;

  // ─── Actions ───────────────────────────────────────────────────────────────

  initialize: () => Promise<void>;
  refreshJobs: () => Promise<void>;
  refreshCustomers: () => Promise<void>;
  refreshNotifications: () => Promise<void>;

  // Customer actions
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Customer>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomer: (id: string) => Customer | undefined;

  // Job actions
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Job>;
  updateJob: (job: Job) => Promise<void>;
  updateJobStatus: (jobId: string, status: JobStatus) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  getJob: (id: string) => Job | undefined;
  getJobsByCustomer: (customerId: string) => Job[];

  // Measurement actions
  addMeasurement: (m: Omit<Measurements, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Measurements>;
  updateMeasurement: (m: Measurements) => Promise<void>;
  getMeasurementsByCustomer: (customerId: string) => Measurements[];

  // Notification actions
  markNotificationRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
}

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useStore = create<TailorBookState>((set, get) => ({
  customers: [],
  jobs: [],
  measurements: [],
  notifications: [],
  dueToday: [],
  overdueJobs: [],
  pendingJobs: [],
  recentJobs: [],
  unreadNotificationCount: 0,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    set({ isLoading: true });
    try {
      // Initialize DB (creates tables on first run)
      await db.getDatabase();

      // Seed demo data on first launch
      await seedDemoDataIfEmpty();

      const [customers, jobs, notifications] = await Promise.all([
        db.getAllCustomers(),
        db.getAllJobs(),
        db.getAllNotifications(),
      ]);

      // Load all measurements for loaded customers
      const measurementPromises = customers.map((c) =>
        db.getMeasurementsByCustomer(c.id)
      );
      const measurementArrays = await Promise.all(measurementPromises);
      const measurements = measurementArrays.flat();

      const dueToday = await db.getJobsDueToday();
      const overdueJobs = await db.getOverdueJobs();
      const pendingJobs = await db.getPendingJobs();
      const recentJobs = await db.getRecentJobs(10);
      const unreadNotificationCount = await db.getUnreadNotificationCount();

      set({
        customers,
        jobs,
        measurements,
        notifications,
        dueToday,
        overdueJobs,
        pendingJobs,
        recentJobs,
        unreadNotificationCount,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Failed to initialize store:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  refreshJobs: async () => {
    const [jobs, dueToday, overdueJobs, pendingJobs, recentJobs] = await Promise.all([
      db.getAllJobs(),
      db.getJobsDueToday(),
      db.getOverdueJobs(),
      db.getPendingJobs(),
      db.getRecentJobs(10),
    ]);
    set({ jobs, dueToday, overdueJobs, pendingJobs, recentJobs });
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

  // ─── Customer Actions ──────────────────────────────────────────────────────

  addCustomer: async (customerData) => {
    const now = new Date().toISOString();
    const customer: Customer = {
      ...customerData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
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

  // ─── Job Actions ───────────────────────────────────────────────────────────

  addJob: async (jobData) => {
    const now = new Date().toISOString();
    const job: Job = {
      ...jobData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await db.createJob(job);

    // Add an in-app notification
    await get().addNotification({
      type: 'system',
      title: 'New job created',
      message: `${job.outfitType} for ${job.customerName} — due ${job.deliveryDate}`,
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
    if (job && status === 'Ready') {
      await get().addNotification({
        type: 'completed',
        title: 'Job is ready!',
        message: `${job.outfitType} for ${job.customerName} is ready for pickup.`,
        jobId: job.id,
        customerId: job.customerId,
      });
    }

    await get().refreshJobs();
  },

  deleteJob: async (id) => {
    await db.deleteJob(id);
    await get().refreshJobs();
  },

  getJob: (id) => get().jobs.find((j) => j.id === id),
  getJobsByCustomer: (customerId) => get().jobs.filter((j) => j.customerId === customerId),

  // ─── Measurement Actions ───────────────────────────────────────────────────

  addMeasurement: async (measurementData) => {
    const now = new Date().toISOString();
    const measurement: Measurements = {
      ...measurementData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
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

  // ─── Notification Actions ──────────────────────────────────────────────────

  markNotificationRead: async (id) => {
    await db.markNotificationRead(id);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
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
}));
