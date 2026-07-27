/**
 * BusinessInsightService
 *
 * Pure, reusable business analytics. This mirrors the exact calculations
 * FinancialsScreen already performs inline (revenue, outstanding balances,
 * period-over-period change, garment breakdown), extracted here so the AI's
 * GenerateBusinessInsightTool can reuse the same verified math instead of
 * re-deriving its own — avoiding duplicate logic per the AI operating layer
 * requirements. FinancialsScreen itself is untouched; this is purely additive.
 */

import { Job, BusinessInsight, BusinessNarrative } from '../../types';

export type InsightPeriod = 'week' | 'month' | 'all';

function isWithinDays(dateStr: string, days: number): boolean {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return new Date(dateStr) >= cutoff;
  } catch {
    return false;
  }
}

function filterByPeriod(jobs: Job[], period: InsightPeriod): Job[] {
  if (period === 'all') return jobs;
  const days = period === 'month' ? 30 : 7;
  return jobs.filter((j) => isWithinDays(j.createdAt, days));
}

function filterPreviousPeriod(jobs: Job[], period: InsightPeriod): Job[] {
  if (period === 'all') return [];
  const days = period === 'month' ? 30 : 7;
  const now = new Date();
  const periodStart = new Date(); periodStart.setDate(now.getDate() - days);
  const prevStart = new Date(); prevStart.setDate(now.getDate() - days * 2);
  return jobs.filter((j) => {
    try {
      const d = new Date(j.createdAt);
      return d >= prevStart && d < periodStart;
    } catch {
      return false;
    }
  });
}

class BusinessInsightServiceImpl {
  compute(jobs: Job[], customerCount: number, period: InsightPeriod): BusinessInsight {
    const filtered = filterByPeriod(jobs, period);
    const previous = filterPreviousPeriod(jobs, period);

    const totalRevenue = filtered.reduce((s, j) => s + (j.price || 0), 0);
    const totalDeposits = filtered.reduce((s, j) => s + ((j.price || 0) - (j.balance || 0)), 0);
    const totalOutstanding = filtered.reduce((s, j) => s + (j.balance || 0), 0);
    const totalJobs = filtered.length;
    const completedJobs = filtered.filter((j) => j.status === 'Delivered').length;
    const overdueJobs = filtered.filter((j) => {
      if (j.status === 'Delivered') return false;
      try { return new Date(j.deliveryDate) < new Date(); } catch { return false; }
    }).length;
    const averageJobValue = totalJobs > 0 ? totalRevenue / totalJobs : 0;
    const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

    const prevRevenue = previous.reduce((s, j) => s + (j.price || 0), 0);
    const revenueChangePct = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : null;

    const garmentMap: Record<string, number> = {};
    filtered.forEach((j) => {
      garmentMap[j.outfitType] = (garmentMap[j.outfitType] || 0) + 1;
    });
    const topOutfitType = Object.entries(garmentMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const newCustomerIds = new Set(filtered.map((j) => j.customerId));

    const narratives = this.buildNarratives({
      totalRevenue, revenueChangePct, overdueJobs, totalOutstanding, topOutfitType, period,
    });

    return {
      period,
      totalRevenue,
      totalDeposits,
      totalOutstanding,
      totalJobs,
      completedJobs,
      overdueJobs,
      totalCustomers: customerCount,
      newCustomers: newCustomerIds.size,
      topOutfitType,
      completionRate,
      averageJobValue,
      narratives,
    };
  }

  private buildNarratives(input: {
    totalRevenue: number;
    revenueChangePct: number | null;
    overdueJobs: number;
    totalOutstanding: number;
    topOutfitType: string | null;
    period: InsightPeriod;
  }): BusinessNarrative[] {
    const narratives: BusinessNarrative[] = [];
    const periodLabel = input.period === 'month' ? 'month' : input.period === 'week' ? 'week' : 'this period';

    if (input.revenueChangePct !== null) {
      narratives.push({
        type: input.revenueChangePct >= 0 ? 'positive' : 'warning',
        message: input.revenueChangePct >= 0
          ? `Revenue is up ${input.revenueChangePct}% vs the previous ${periodLabel}.`
          : `Revenue is down ${Math.abs(input.revenueChangePct)}% vs last ${periodLabel}.`,
      });
    }

    if (input.overdueJobs > 0) {
      narratives.push({
        type: 'warning',
        message: `${input.overdueJobs} job${input.overdueJobs !== 1 ? 's are' : ' is'} overdue.`,
      });
    }

    if (input.totalOutstanding > 0) {
      narratives.push({
        type: 'neutral',
        message: `There's outstanding balance across active jobs — worth a follow-up round.`,
      });
    }

    if (input.topOutfitType) {
      narratives.push({
        type: 'neutral',
        message: `${input.topOutfitType} is the most requested outfit type ${periodLabel}.`,
      });
    }

    if (narratives.length === 0) {
      narratives.push({ type: 'neutral', message: 'No activity recorded for this period yet.' });
    }

    return narratives;
  }
}

export const businessInsightService = new BusinessInsightServiceImpl();
