import * as SQLite from 'expo-sqlite';
import { Customer, Job, Measurements, AppNotification, TailorSettings, JobReminder } from '../types';

// ─── Database Singleton ────────────────────────────────────────────────────────

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('tailorbook.db');
    await initializeDatabase(db);
  }
  return db;
}

// ─── Schema Initialization ────────────────────────────────────────────────────

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      whatsappPhone TEXT,
      notes TEXT,
      avatar TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS measurements (
      id TEXT PRIMARY KEY,
      customerId TEXT NOT NULL,
      template TEXT NOT NULL,
      data TEXT NOT NULL,
      label TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      customerId TEXT NOT NULL,
      customerName TEXT NOT NULL,
      customerPhone TEXT,
      outfitType TEXT NOT NULL,
      style TEXT,
      fabric TEXT,
      deliveryDate TEXT NOT NULL,
      deliveryType TEXT NOT NULL DEFAULT 'pickup',
      deliveryAddress TEXT,
      price REAL NOT NULL DEFAULT 0,
      deposit REAL NOT NULL DEFAULT 0,
      balance REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Pending',
      measurementId TEXT,
      samplePhotoUri TEXT,
      photoUris TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      jobId TEXT,
      customerId TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_customerId ON jobs(customerId);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_deliveryDate ON jobs(deliveryDate);
    CREATE INDEX IF NOT EXISTS idx_measurements_customerId ON measurements(customerId);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

    CREATE TABLE IF NOT EXISTS job_reminders (
      id TEXT PRIMARY KEY,
      jobId TEXT NOT NULL,
      scheduledAt TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT '',
      daysBefore INTEGER,
      repeatEvery INTEGER NOT NULL DEFAULT 0,
      notifIdentifier TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_job_reminders_jobId ON job_reminders(jobId);
  `);

  await runMigrations(database);
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  const migrations = [
    `ALTER TABLE jobs ADD COLUMN deliveryType TEXT NOT NULL DEFAULT 'pickup'`,
    `ALTER TABLE jobs ADD COLUMN deliveryAddress TEXT`,
    `ALTER TABLE jobs ADD COLUMN customerPhone TEXT`,
    `ALTER TABLE customers ADD COLUMN whatsappPhone TEXT`,
    `ALTER TABLE jobs ADD COLUMN photoUris TEXT`,
  ];
  for (const sql of migrations) {
    try { await database.execAsync(sql); } catch (_) {}
  }
}

// ─── Row Parser ───────────────────────────────────────────────────────────────

function parseJobRow(row: any): Job {
  let photoUris: string[] = [];
  if (row.photoUris) {
    try { photoUris = JSON.parse(row.photoUris); } catch (_) {}
  } else if (row.samplePhotoUri) {
    photoUris = [row.samplePhotoUri];
  }
  const { samplePhotoUri: _ignored, ...rest } = row;
  return { ...rest, photoUris };
}

// ─── Settings Operations ──────────────────────────────────────────────────────

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

export async function getSettings(): Promise<TailorSettings> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM settings'
  );
  const map: Record<string, string> = {};
  rows.forEach((r) => { map[r.key] = r.value; });
  return {
    tailorName: map['tailorName'] ?? DEFAULT_SETTINGS.tailorName,
    shopName: map['shopName'] ?? DEFAULT_SETTINGS.shopName,
    phone: map['phone'] ?? DEFAULT_SETTINGS.phone,
    location: map['location'] ?? DEFAULT_SETTINGS.location,
    currency: map['currency'] ?? DEFAULT_SETTINGS.currency,
    workDays: map['workDays'] ?? DEFAULT_SETTINGS.workDays,
    defaultApparel: map['defaultApparel'] ?? DEFAULT_SETTINGS.defaultApparel,
    onboardingComplete: map['onboardingComplete'] ?? DEFAULT_SETTINGS.onboardingComplete,
    profilePhotoUri: map['profilePhotoUri'] ?? '',
  };
}

export async function saveSettings(settings: TailorSettings): Promise<void> {
  const database = await getDatabase();
  for (const [key, value] of Object.entries(settings)) {
    await database.runAsync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [key, String(value)]
    );
  }
}

// ─── Customer Operations ──────────────────────────────────────────────────────

export async function getAllCustomers(): Promise<Customer[]> {
  const database = await getDatabase();
  return database.getAllAsync<Customer>('SELECT * FROM customers ORDER BY name ASC');
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<Customer>(
    'SELECT * FROM customers WHERE id = ?', [id]
  );
  return result || null;
}

export async function createCustomer(customer: Customer): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO customers (id, name, phone, whatsappPhone, notes, avatar, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      customer.id, customer.name, customer.phone,
      customer.whatsappPhone || null, customer.notes || null,
      customer.avatar || null, customer.createdAt, customer.updatedAt,
    ]
  );
}

export async function updateCustomer(customer: Customer): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE customers SET name=?, phone=?, whatsappPhone=?, notes=?, avatar=?, updatedAt=?
     WHERE id=?`,
    [
      customer.name, customer.phone, customer.whatsappPhone || null,
      customer.notes || null, customer.avatar || null,
      customer.updatedAt, customer.id,
    ]
  );
}

export async function deleteCustomer(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM customers WHERE id = ?', [id]);
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  const database = await getDatabase();
  const pattern = `%${query}%`;
  return database.getAllAsync<Customer>(
    'SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC',
    [pattern, pattern]
  );
}

// ─── Job Operations ───────────────────────────────────────────────────────────

export async function getAllJobs(): Promise<Job[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>('SELECT * FROM jobs ORDER BY deliveryDate ASC');
  return rows.map(parseJobRow);
}

export async function getJobsByCustomer(customerId: string): Promise<Job[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM jobs WHERE customerId = ? ORDER BY createdAt DESC', [customerId]
  );
  return rows.map(parseJobRow);
}

export async function getJobById(id: string): Promise<Job | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<any>('SELECT * FROM jobs WHERE id = ?', [id]);
  return row ? parseJobRow(row) : null;
}

export async function createJob(job: Job): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO jobs (id, customerId, customerName, customerPhone, outfitType, style, fabric,
      deliveryDate, deliveryType, deliveryAddress, price, deposit, balance, status,
      measurementId, photoUris, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      job.id, job.customerId, job.customerName, job.customerPhone || null,
      job.outfitType, job.style || null, job.fabric || null,
      job.deliveryDate, job.deliveryType || 'pickup', job.deliveryAddress || null,
      job.price, job.deposit, job.balance, job.status,
      job.measurementId || null,
      job.photoUris?.length ? JSON.stringify(job.photoUris) : null,
      job.notes || null, job.createdAt, job.updatedAt,
    ]
  );
}

export async function updateJob(job: Job): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE jobs SET customerId=?, customerName=?, customerPhone=?, outfitType=?, style=?,
      fabric=?, deliveryDate=?, deliveryType=?, deliveryAddress=?, price=?, deposit=?,
      balance=?, status=?, measurementId=?, photoUris=?, notes=?, updatedAt=?
     WHERE id=?`,
    [
      job.customerId, job.customerName, job.customerPhone || null,
      job.outfitType, job.style || null, job.fabric || null,
      job.deliveryDate, job.deliveryType || 'pickup', job.deliveryAddress || null,
      job.price, job.deposit, job.balance, job.status,
      job.measurementId || null,
      job.photoUris?.length ? JSON.stringify(job.photoUris) : null,
      job.notes || null, job.updatedAt, job.id,
    ]
  );
}

export async function updateJobStatus(id: string, status: string, updatedAt: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE jobs SET status = ?, updatedAt = ? WHERE id = ?', [status, updatedAt, id]
  );
}

export async function deleteJob(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM jobs WHERE id = ?', [id]);
}

export async function getJobsDueToday(): Promise<Job[]> {
  const database = await getDatabase();
  const today = getTodayLocal();
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM jobs WHERE DATE(deliveryDate) = ? AND status NOT IN ('Delivered')
     ORDER BY deliveryDate ASC`,
    [today]
  );
  return rows.map(parseJobRow);
}

export async function getOverdueJobs(): Promise<Job[]> {
  const database = await getDatabase();
  const today = getTodayLocal();
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM jobs WHERE DATE(deliveryDate) < ? AND status NOT IN ('Delivered', 'Ready')
     ORDER BY deliveryDate ASC`,
    [today]
  );
  return rows.map(parseJobRow);
}

export async function getPendingJobs(): Promise<Job[]> {
  const database = await getDatabase();
  const today = getTodayLocal();
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM jobs WHERE status NOT IN ('Delivered') AND DATE(deliveryDate) >= ?
     ORDER BY deliveryDate ASC`,
    [today]
  );
  return rows.map(parseJobRow);
}

export async function getReadyJobs(): Promise<Job[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM jobs WHERE status = 'Ready' ORDER BY deliveryDate ASC`
  );
  return rows.map(parseJobRow);
}

export async function getRecentJobs(limit = 10): Promise<Job[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM jobs ORDER BY updatedAt DESC LIMIT ?', [limit]
  );
  return rows.map(parseJobRow);
}

export async function getPendingWaybills(): Promise<Job[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM jobs WHERE deliveryType = 'waybill' AND status = 'Ready'
     ORDER BY deliveryDate ASC`
  );
  return rows.map(parseJobRow);
}

export async function getOutstandingBalances(): Promise<Job[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM jobs WHERE status = 'Delivered' AND balance > 0
     ORDER BY updatedAt DESC`
  );
  return rows.map(parseJobRow);
}

export async function searchJobs(query: string): Promise<Job[]> {
  const database = await getDatabase();
  const pattern = `%${query}%`;
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM jobs WHERE customerName LIKE ? OR outfitType LIKE ? OR status LIKE ?
     ORDER BY deliveryDate ASC`,
    [pattern, pattern, pattern]
  );
  return rows.map(parseJobRow);
}

// ─── Measurements Operations ──────────────────────────────────────────────────

export async function getMeasurementsByCustomer(customerId: string): Promise<Measurements[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM measurements WHERE customerId = ? ORDER BY createdAt DESC', [customerId]
  );
  return rows.map((row) => ({
    ...row,
    data: (() => { try { return JSON.parse(row.data); } catch { return {}; } })(),
  }));
}

export async function getMeasurementById(id: string): Promise<Measurements | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<any>(
    'SELECT * FROM measurements WHERE id = ?', [id]
  );
  if (!row) return null;
  return { ...row, data: (() => { try { return JSON.parse(row.data); } catch { return {}; } })() };
}

export async function createMeasurement(measurement: Measurements): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO measurements (id, customerId, template, data, label, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      measurement.id, measurement.customerId, measurement.template,
      JSON.stringify(measurement.data), measurement.label || null,
      measurement.createdAt, measurement.updatedAt,
    ]
  );
}

export async function updateMeasurement(measurement: Measurements): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE measurements SET template=?, data=?, label=?, updatedAt=? WHERE id=?`,
    [
      measurement.template, JSON.stringify(measurement.data),
      measurement.label || null, measurement.updatedAt, measurement.id,
    ]
  );
}

// ─── Notification Operations ──────────────────────────────────────────────────

export async function getAllNotifications(): Promise<AppNotification[]> {
  const database = await getDatabase();
  const result = await database.getAllAsync<any>(
    'SELECT * FROM notifications ORDER BY createdAt DESC LIMIT 100'
  );
  return result.map((r) => ({ ...r, read: r.read === 1 }));
}

export async function getUnreadNotificationCount(): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM notifications WHERE read = 0'
  );
  return result?.count || 0;
}

export async function createNotification(notification: AppNotification): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO notifications (id, type, title, message, jobId, customerId, read, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      notification.id, notification.type, notification.title, notification.message,
      notification.jobId || null, notification.customerId || null,
      0, notification.createdAt,
    ]
  );
}

export async function markNotificationRead(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE notifications SET read = 1 WHERE id = ?', [id]);
}

export async function markAllNotificationsRead(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE notifications SET read = 1');
}

export async function deleteNotificationsByJobId(jobId: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    "DELETE FROM notifications WHERE jobId = ? AND type != 'system'",
    [jobId]
  );
}

// ─── Job Reminder Operations ──────────────────────────────────────────────────

export async function getAllJobReminders(): Promise<JobReminder[]> {
  const database = await getDatabase();
  return database.getAllAsync<JobReminder>('SELECT * FROM job_reminders ORDER BY scheduledAt ASC');
}

export async function getJobRemindersByJob(jobId: string): Promise<JobReminder[]> {
  const database = await getDatabase();
  return database.getAllAsync<JobReminder>(
    'SELECT * FROM job_reminders WHERE jobId = ? ORDER BY scheduledAt ASC', [jobId]
  );
}

export async function addJobReminderRecord(reminder: JobReminder): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO job_reminders (id, jobId, scheduledAt, label, daysBefore, repeatEvery, notifIdentifier, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      reminder.id, reminder.jobId, reminder.scheduledAt,
      reminder.label || '', reminder.daysBefore ?? null,
      reminder.repeatEvery ?? 0, reminder.notifIdentifier || null,
      reminder.createdAt,
    ]
  );
}

export async function deleteJobReminderRecord(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM job_reminders WHERE id = ?', [id]);
}

export async function deleteAllJobRemindersForJob(jobId: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM job_reminders WHERE jobId = ?', [jobId]);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
