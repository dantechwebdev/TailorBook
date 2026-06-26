import * as SQLite from 'expo-sqlite';
import { Customer, Job, Measurements, AppNotification } from '../types';

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
      outfitType TEXT NOT NULL,
      style TEXT,
      fabric TEXT,
      deliveryDate TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      deposit REAL NOT NULL DEFAULT 0,
      balance REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Pending',
      measurementId TEXT,
      samplePhotoUri TEXT,
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

    CREATE INDEX IF NOT EXISTS idx_jobs_customerId ON jobs(customerId);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_deliveryDate ON jobs(deliveryDate);
    CREATE INDEX IF NOT EXISTS idx_measurements_customerId ON measurements(customerId);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
  `);
}

// ─── Customer Operations ──────────────────────────────────────────────────────

export async function getAllCustomers(): Promise<Customer[]> {
  const database = await getDatabase();
  const result = await database.getAllAsync<Customer>(
    'SELECT * FROM customers ORDER BY name ASC'
  );
  return result;
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<Customer>(
    'SELECT * FROM customers WHERE id = ?',
    [id]
  );
  return result || null;
}

export async function createCustomer(customer: Customer): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO customers (id, name, phone, notes, avatar, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      customer.id,
      customer.name,
      customer.phone,
      customer.notes || null,
      customer.avatar || null,
      customer.createdAt,
      customer.updatedAt,
    ]
  );
}

export async function updateCustomer(customer: Customer): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE customers SET name = ?, phone = ?, notes = ?, avatar = ?, updatedAt = ?
     WHERE id = ?`,
    [
      customer.name,
      customer.phone,
      customer.notes || null,
      customer.avatar || null,
      customer.updatedAt,
      customer.id,
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
  const result = await database.getAllAsync<Customer>(
    'SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC',
    [pattern, pattern]
  );
  return result;
}

// ─── Job Operations ───────────────────────────────────────────────────────────

export async function getAllJobs(): Promise<Job[]> {
  const database = await getDatabase();
  const result = await database.getAllAsync<Job>(
    'SELECT * FROM jobs ORDER BY deliveryDate ASC'
  );
  return result;
}

export async function getJobsByCustomer(customerId: string): Promise<Job[]> {
  const database = await getDatabase();
  const result = await database.getAllAsync<Job>(
    'SELECT * FROM jobs WHERE customerId = ? ORDER BY createdAt DESC',
    [customerId]
  );
  return result;
}

export async function getJobById(id: string): Promise<Job | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<Job>(
    'SELECT * FROM jobs WHERE id = ?',
    [id]
  );
  return result || null;
}

export async function createJob(job: Job): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO jobs (id, customerId, customerName, outfitType, style, fabric, deliveryDate,
      price, deposit, balance, status, measurementId, samplePhotoUri, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      job.id,
      job.customerId,
      job.customerName,
      job.outfitType,
      job.style || null,
      job.fabric || null,
      job.deliveryDate,
      job.price,
      job.deposit,
      job.balance,
      job.status,
      job.measurementId || null,
      job.samplePhotoUri || null,
      job.notes || null,
      job.createdAt,
      job.updatedAt,
    ]
  );
}

export async function updateJob(job: Job): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE jobs SET customerId = ?, customerName = ?, outfitType = ?, style = ?, fabric = ?,
      deliveryDate = ?, price = ?, deposit = ?, balance = ?, status = ?, measurementId = ?,
      samplePhotoUri = ?, notes = ?, updatedAt = ?
     WHERE id = ?`,
    [
      job.customerId,
      job.customerName,
      job.outfitType,
      job.style || null,
      job.fabric || null,
      job.deliveryDate,
      job.price,
      job.deposit,
      job.balance,
      job.status,
      job.measurementId || null,
      job.samplePhotoUri || null,
      job.notes || null,
      job.updatedAt,
      job.id,
    ]
  );
}

export async function updateJobStatus(id: string, status: string, updatedAt: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE jobs SET status = ?, updatedAt = ? WHERE id = ?',
    [status, updatedAt, id]
  );
}

export async function deleteJob(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM jobs WHERE id = ?', [id]);
}

export async function getJobsDueToday(): Promise<Job[]> {
  const database = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const result = await database.getAllAsync<Job>(
    `SELECT * FROM jobs WHERE DATE(deliveryDate) = ? AND status NOT IN ('Delivered')
     ORDER BY deliveryDate ASC`,
    [today]
  );
  return result;
}

export async function getOverdueJobs(): Promise<Job[]> {
  const database = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const result = await database.getAllAsync<Job>(
    `SELECT * FROM jobs WHERE DATE(deliveryDate) < ? AND status NOT IN ('Delivered', 'Ready')
     ORDER BY deliveryDate ASC`,
    [today]
  );
  return result;
}

export async function getPendingJobs(): Promise<Job[]> {
  const database = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const result = await database.getAllAsync<Job>(
    `SELECT * FROM jobs WHERE status NOT IN ('Delivered') AND DATE(deliveryDate) >= ?
     ORDER BY deliveryDate ASC`,
    [today]
  );
  return result;
}

export async function getRecentJobs(limit = 10): Promise<Job[]> {
  const database = await getDatabase();
  const result = await database.getAllAsync<Job>(
    'SELECT * FROM jobs ORDER BY updatedAt DESC LIMIT ?',
    [limit]
  );
  return result;
}

export async function searchJobs(query: string): Promise<Job[]> {
  const database = await getDatabase();
  const pattern = `%${query}%`;
  const result = await database.getAllAsync<Job>(
    `SELECT * FROM jobs WHERE customerName LIKE ? OR outfitType LIKE ? OR status LIKE ?
     ORDER BY deliveryDate ASC`,
    [pattern, pattern, pattern]
  );
  return result;
}

// ─── Measurements Operations ──────────────────────────────────────────────────

export async function getMeasurementsByCustomer(customerId: string): Promise<Measurements[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM measurements WHERE customerId = ? ORDER BY createdAt DESC',
    [customerId]
  );
  return rows.map((row) => ({ ...row, data: JSON.parse(row.data) }));
}

export async function getMeasurementById(id: string): Promise<Measurements | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<any>(
    'SELECT * FROM measurements WHERE id = ?',
    [id]
  );
  if (!row) return null;
  return { ...row, data: JSON.parse(row.data) };
}

export async function createMeasurement(measurement: Measurements): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO measurements (id, customerId, template, data, label, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      measurement.id,
      measurement.customerId,
      measurement.template,
      JSON.stringify(measurement.data),
      measurement.label || null,
      measurement.createdAt,
      measurement.updatedAt,
    ]
  );
}

export async function updateMeasurement(measurement: Measurements): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE measurements SET template = ?, data = ?, label = ?, updatedAt = ?
     WHERE id = ?`,
    [
      measurement.template,
      JSON.stringify(measurement.data),
      measurement.label || null,
      measurement.updatedAt,
      measurement.id,
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
      notification.id,
      notification.type,
      notification.title,
      notification.message,
      notification.jobId || null,
      notification.customerId || null,
      0,
      notification.createdAt,
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
