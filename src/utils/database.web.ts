import { Customer, Job, Measurements, AppNotification, TailorSettings } from '../types';

const STORAGE_KEY = 'tailorbook_db';

interface DB {
  customers: Customer[];
  jobs: Job[];
  measurements: Measurements[];
  notifications: AppNotification[];
  settings: Record<string, string>;
}

function load(): DB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { settings: {}, ...JSON.parse(raw) };
  } catch {}
  return { customers: [], jobs: [], measurements: [], notifications: [], settings: {} };
}

function save(db: DB): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch {}
}

export async function getDatabase(): Promise<any> { return {}; }

// ─── Settings ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: TailorSettings = {
  tailorName: '', shopName: '', phone: '', location: '', currency: '₦',
};

export async function getSettings(): Promise<TailorSettings> {
  const db = load();
  const s = db.settings || {};
  return {
    tailorName: s['tailorName'] ?? DEFAULT_SETTINGS.tailorName,
    shopName: s['shopName'] ?? DEFAULT_SETTINGS.shopName,
    phone: s['phone'] ?? DEFAULT_SETTINGS.phone,
    location: s['location'] ?? DEFAULT_SETTINGS.location,
    currency: s['currency'] ?? DEFAULT_SETTINGS.currency,
  };
}

export async function saveSettings(settings: TailorSettings): Promise<void> {
  const db = load();
  db.settings = settings as any;
  save(db);
}

// ─── Customers ────────────────────────────────────────────────────────────────

export async function getAllCustomers(): Promise<Customer[]> {
  return load().customers.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  return load().customers.find((c) => c.id === id) || null;
}

export async function createCustomer(customer: Customer): Promise<void> {
  const db = load(); db.customers.push(customer); save(db);
}

export async function updateCustomer(customer: Customer): Promise<void> {
  const db = load();
  db.customers = db.customers.map((c) => (c.id === customer.id ? customer : c));
  save(db);
}

export async function deleteCustomer(id: string): Promise<void> {
  const db = load();
  db.customers = db.customers.filter((c) => c.id !== id);
  db.jobs = db.jobs.filter((j) => j.customerId !== id);
  db.measurements = db.measurements.filter((m) => m.customerId !== id);
  save(db);
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  const q = query.toLowerCase();
  return load().customers.filter(
    (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
  );
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export async function getAllJobs(): Promise<Job[]> {
  return load().jobs.sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate));
}

export async function getJobsByCustomer(customerId: string): Promise<Job[]> {
  return load().jobs.filter((j) => j.customerId === customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getJobById(id: string): Promise<Job | null> {
  return load().jobs.find((j) => j.id === id) || null;
}

export async function createJob(job: Job): Promise<void> {
  const db = load(); db.jobs.push(job); save(db);
}

export async function updateJob(job: Job): Promise<void> {
  const db = load();
  db.jobs = db.jobs.map((j) => (j.id === job.id ? job : j));
  save(db);
}

export async function updateJobStatus(id: string, status: string, updatedAt: string): Promise<void> {
  const db = load();
  db.jobs = db.jobs.map((j) => (j.id === id ? { ...j, status: status as any, updatedAt } : j));
  save(db);
}

export async function deleteJob(id: string): Promise<void> {
  const db = load();
  db.jobs = db.jobs.filter((j) => j.id !== id);
  save(db);
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function getJobsDueToday(): Promise<Job[]> {
  const today = todayStr();
  return load().jobs.filter(
    (j) => j.deliveryDate.split('T')[0] === today && j.status !== 'Delivered'
  );
}

export async function getOverdueJobs(): Promise<Job[]> {
  const today = todayStr();
  return load().jobs.filter(
    (j) => j.deliveryDate.split('T')[0] < today && j.status !== 'Delivered' && j.status !== 'Ready'
  );
}

export async function getPendingJobs(): Promise<Job[]> {
  const today = todayStr();
  return load().jobs.filter(
    (j) => j.status !== 'Delivered' && j.deliveryDate.split('T')[0] >= today
  );
}

export async function getReadyJobs(): Promise<Job[]> {
  return load().jobs.filter((j) => j.status === 'Ready');
}

export async function getRecentJobs(limit = 10): Promise<Job[]> {
  return load().jobs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit);
}

export async function searchJobs(query: string): Promise<Job[]> {
  const q = query.toLowerCase();
  return load().jobs.filter(
    (j) =>
      j.customerName.toLowerCase().includes(q) ||
      j.outfitType.toLowerCase().includes(q) ||
      j.status.toLowerCase().includes(q)
  );
}

// ─── Measurements ─────────────────────────────────────────────────────────────

export async function getMeasurementsByCustomer(customerId: string): Promise<Measurements[]> {
  return load().measurements.filter((m) => m.customerId === customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getMeasurementById(id: string): Promise<Measurements | null> {
  return load().measurements.find((m) => m.id === id) || null;
}

export async function createMeasurement(measurement: Measurements): Promise<void> {
  const db = load(); db.measurements.push(measurement); save(db);
}

export async function updateMeasurement(measurement: Measurements): Promise<void> {
  const db = load();
  db.measurements = db.measurements.map((m) => (m.id === measurement.id ? measurement : m));
  save(db);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getAllNotifications(): Promise<AppNotification[]> {
  return load().notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 100);
}

export async function getUnreadNotificationCount(): Promise<number> {
  return load().notifications.filter((n) => !n.read).length;
}

export async function createNotification(notification: AppNotification): Promise<void> {
  const db = load(); db.notifications.unshift(notification); save(db);
}

export async function markNotificationRead(id: string): Promise<void> {
  const db = load();
  db.notifications = db.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  save(db);
}

export async function markAllNotificationsRead(): Promise<void> {
  const db = load();
  db.notifications = db.notifications.map((n) => ({ ...n, read: true }));
  save(db);
}
