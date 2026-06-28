/**
 * seedDemoData.ts
 * Seeds realistic Nigerian tailor demo data on first launch.
 * Called once from the store initialize() when the DB is empty.
 */

import { generateId, addDaysISO, getTodayISO, getAvatarColor } from './helpers';
import * as db from './database';
import { Customer, Job, Measurements } from '../types';

export async function seedDemoDataIfEmpty(): Promise<void> {
  const existing = await db.getAllCustomers();
  if (existing.length > 0) return; // already seeded

  const now = new Date().toISOString();

  // ─── Customers ────────────────────────────────────────────────────────────

  const customers: Customer[] = [
    {
      id: generateId(),
      name: 'Daniel Johnson',
      phone: '08031234567',
      notes: 'Prefers slim-fit styles. Usually picks up on Fridays.',
      avatar: getAvatarColor('Daniel Johnson'),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: 'Grace Okafor',
      phone: '08159876543',
      notes: 'Prefers flowing gowns. Allergic to synthetic fabrics.',
      avatar: getAvatarColor('Grace Okafor'),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: 'James Nwosu',
      phone: '07065557890',
      notes: '',
      avatar: getAvatarColor('James Nwosu'),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: 'Emeka Adebayo',
      phone: '09021112233',
      notes: 'VIP customer — always on time with payment.',
      avatar: getAvatarColor('Emeka Adebayo'),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: 'Blessing Sunday',
      phone: '08076543210',
      notes: '',
      avatar: getAvatarColor('Blessing Sunday'),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: 'Samuel Ike',
      phone: '08102223344',
      notes: 'Referred by Emeka.',
      avatar: getAvatarColor('Samuel Ike'),
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const c of customers) {
    await db.createCustomer(c);
  }

  // ─── Measurements ─────────────────────────────────────────────────────────

  const danielMeasurement: Measurements = {
    id: generateId(),
    customerId: customers[0].id,
    template: 'agbada',
    label: 'Agbada — Jan 2024',
    data: {
      chest: '42', shoulder: '17', agbadaLength: '58', agbadaSleeve: '26',
      innerwearLength: '32', trouserWaist: '34', hip: '40',
      trouserLength: '42', thigh: '23', ankle: '15',
    },
    createdAt: now,
    updatedAt: now,
  };

  const graceMeasurement: Measurements = {
    id: generateId(),
    customerId: customers[1].id,
    template: 'womens_gown',
    label: "Women's Gown — Feb 2024",
    data: {
      bust: '38', waist: '30', hip: '40', shoulderWidth: '14',
      sleeveLength: '22', gownLength: '52', neckSize: '14', armhole: '16',
    },
    createdAt: now,
    updatedAt: now,
  };

  const jamesMeasurement: Measurements = {
    id: generateId(),
    customerId: customers[2].id,
    template: 'mens_senator',
    label: "Men's Senator — Mar 2024",
    data: {
      chest: '44', shoulder: '18', sleeveLength: '25', topLength: '30',
      trouserWaist: '36', hip: '42', trouserLength: '44', thigh: '24',
      knee: '18', ankle: '15',
    },
    createdAt: now,
    updatedAt: now,
  };

  await db.createMeasurement(danielMeasurement);
  await db.createMeasurement(graceMeasurement);
  await db.createMeasurement(jamesMeasurement);

  // ─── Jobs ─────────────────────────────────────────────────────────────────

  const today = getTodayISO();

  const jobs: Job[] = [
    {
      id: generateId(),
      customerId: customers[0].id,
      customerName: 'Daniel Johnson',
      customerPhone: customers[0].phone,
      outfitType: 'Agbada',
      style: 'Classic Agbada',
      fabric: 'Cashmere',
      deliveryDate: today,
      deliveryType: 'pickup',
      price: 45000,
      deposit: 20000,
      balance: 25000,
      status: 'Sewing',
      measurementId: danielMeasurement.id,
      notes: 'Needs to be ready for a naming ceremony.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      customerId: customers[1].id,
      customerName: 'Grace Okafor',
      customerPhone: customers[1].phone,
      outfitType: 'Gown',
      style: 'Flowing Evening Gown',
      fabric: 'Silk blend',
      deliveryDate: today,
      deliveryType: 'waybill',
      deliveryAddress: 'Abuja',
      price: 38000,
      deposit: 15000,
      balance: 23000,
      status: 'Finishing',
      measurementId: graceMeasurement.id,
      notes: 'Burgundy color with gold trim. Dispatch to Abuja.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      customerId: customers[2].id,
      customerName: 'James Nwosu',
      customerPhone: customers[2].phone,
      outfitType: 'Senator',
      style: 'Classic Senator',
      fabric: 'Ankara',
      deliveryDate: today,
      deliveryType: 'pickup',
      price: 22000,
      deposit: 10000,
      balance: 12000,
      status: 'Cutting',
      measurementId: jamesMeasurement.id,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      customerId: customers[3].id,
      customerName: 'Emeka Adebayo',
      customerPhone: customers[3].phone,
      outfitType: 'Suit',
      style: 'Three-Piece Suit',
      fabric: 'Wool blend',
      deliveryDate: addDaysISO(3),
      deliveryType: 'pickup',
      price: 65000,
      deposit: 30000,
      balance: 35000,
      status: 'Sewing',
      notes: 'Corporate event on the 28th. Must be ready 2 days early.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      customerId: customers[4].id,
      customerName: 'Blessing Sunday',
      customerPhone: customers[4].phone,
      outfitType: 'Gown',
      style: 'Aso-ebi Gown',
      fabric: 'Lace',
      deliveryDate: addDaysISO(7),
      deliveryType: 'waybill',
      deliveryAddress: 'Port Harcourt',
      price: 30000,
      deposit: 12000,
      balance: 18000,
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      customerId: customers[5].id,
      customerName: 'Samuel Ike',
      customerPhone: customers[5].phone,
      outfitType: 'Agbada',
      style: 'Grand Buba',
      fabric: 'Damask',
      deliveryDate: addDaysISO(-2),
      deliveryType: 'pickup',
      price: 55000,
      deposit: 25000,
      balance: 30000,
      status: 'Finishing',
      notes: 'Customer has called twice — prioritise this.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      customerId: customers[3].id,
      customerName: 'Emeka Adebayo',
      customerPhone: customers[3].phone,
      outfitType: 'Kaftan',
      style: 'Embroidered Kaftan',
      fabric: 'Silk',
      deliveryDate: addDaysISO(-5),
      deliveryType: 'pickup',
      price: 28000,
      deposit: 28000,
      balance: 0,
      status: 'Delivered',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      customerId: customers[5].id,
      customerName: 'Samuel Ike',
      customerPhone: customers[5].phone,
      outfitType: 'Suit',
      style: 'Slim-fit Court Suit',
      fabric: 'Linen',
      deliveryDate: addDaysISO(-10),
      deliveryType: 'pickup',
      price: 40000,
      deposit: 40000,
      balance: 0,
      status: 'Delivered',
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const j of jobs) {
    await db.createJob(j);
  }

  // ─── Notifications ────────────────────────────────────────────────────────

  const notifications = [
    {
      id: generateId(),
      type: 'overdue' as const,
      title: "Samuel's Agbada is overdue",
      message: "Samuel Ike's Agbada was due 2 days ago. Prioritise immediately.",
      jobId: jobs[5].id,
      customerId: customers[5].id,
      read: false,
      createdAt: now,
    },
    {
      id: generateId(),
      type: 'due_today' as const,
      title: "3 jobs due today",
      message: "Daniel's Agbada, Grace's Gown, and James's Senator are all due today.",
      jobId: jobs[0].id,
      customerId: customers[0].id,
      read: false,
      createdAt: now,
    },
    {
      id: generateId(),
      type: 'due_soon' as const,
      title: "Grace's gown — waybill to Abuja",
      message: "Grace Okafor's Gown is in finishing. Dispatch to Abuja today.",
      jobId: jobs[1].id,
      customerId: customers[1].id,
      read: false,
      createdAt: now,
    },
    {
      id: generateId(),
      type: 'completed' as const,
      title: "Samuel's suit marked delivered.",
      message: "Samuel Ike's Slim-fit Suit has been delivered. Payment fully collected.",
      jobId: jobs[7].id,
      customerId: customers[5].id,
      read: true,
      createdAt: now,
    },
    {
      id: generateId(),
      type: 'payment' as const,
      title: "Deposit received from Blessing Sunday",
      message: "₦12,000 deposit received for Blessing's Aso-ebi Gown. Waybill to Port Harcourt.",
      jobId: jobs[4].id,
      customerId: customers[4].id,
      read: true,
      createdAt: now,
    },
  ];

  for (const n of notifications) {
    await db.createNotification(n);
  }
}
