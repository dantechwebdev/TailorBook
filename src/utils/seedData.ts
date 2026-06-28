/**
 * seedDemoData.ts
 * Seeds realistic Nigerian tailor demo data on first launch.
 * Seeding is disabled — app ships clean so tailors enter their own data.
 */

import { Customer, Job, Measurements } from '../types';

export async function seedDemoDataIfEmpty(): Promise<void> {
  // Seeding disabled — production app starts clean.
  return;
}
