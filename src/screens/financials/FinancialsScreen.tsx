import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useStore } from '../../context/store';
import { Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { MenuIcon, ReportsIcon, ChevronRightIcon } from '../../components/common/Icons';
import { formatNaira } from '../../utils/helpers';
import { Job } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import FloatingAssistant from '../../components/ai/FloatingAssistant';
import { useEntrance, useCountUp } from '../../utils/animations';

type Period = 'all' | 'month' | 'week';

function isWithin(dateStr: string, days: number): boolean {
  try {
    const d = new Date(dateStr);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return d >= cutoff;
  } catch {
    return false;
  }
}

const FinancialsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { jobs, customers } = useStore();
  const { colors: Colors } = useTheme();
  const [period, setPeriod] = useState<Period>('all');

  // ── Animations ──────────────────────────────────────────────────────────
  const headerAnim = useEntrance(0, 6);
  const statsAnim  = useEntrance(120, 8);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
    },
    headerTitle: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
    },
    periodRow: {
      flexDirection: 'row',
      marginHorizontal: Spacing.base,
      marginBottom: Spacing.base,
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      padding: 3,
      ...Shadow.sm,
    },
    periodTab: {
      flex: 1,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.md,
      alignItems: 'center',
    },
    periodTabActive: {
      backgroundColor: Colors.primary,
    },
    periodTabText: {
      fontSize: Typography.sm,
      color: Colors.textSecondary,
      fontWeight: Typography.medium,
    },
    periodTabTextActive: {
      color: Colors.white,
      fontWeight: Typography.semibold,
    },
    scroll: {
      paddingHorizontal: Spacing.base,
      paddingBottom: Spacing.xxxl,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    section: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      fontSize: Typography.sm,
      fontWeight: Typography.semibold,
      color: Colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: Spacing.md,
    },
    emptyCard: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.xl,
      padding: Spacing.xl,
      alignItems: 'center',
      gap: Spacing.sm,
      ...Shadow.sm,
    },
    emptyIcon: { fontSize: 28 },
    emptyText: {
      fontSize: Typography.base,
      fontWeight: Typography.semibold,
      color: Colors.textPrimary,
    },
    emptySubText: {
      fontSize: Typography.sm,
      color: Colors.textSecondary,
      textAlign: 'center',
    },
    rowCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      gap: Spacing.md,
      ...Shadow.sm,
    },
    rowAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.overdueLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowAvatarText: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: Colors.overdue,
    },
    rowInfo: { flex: 1 },
    rowName: {
      fontSize: Typography.base,
      fontWeight: Typography.semibold,
      color: Colors.textPrimary,
      marginBottom: 2,
    },
    rowSub: {
      fontSize: Typography.xs,
      color: Colors.textSecondary,
    },
    rowRight: {
      alignItems: 'flex-end',
      gap: 4,
    },
    rowAmount: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: Colors.overdue,
    },
    barCard: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.xl,
      padding: Spacing.base,
      gap: Spacing.md,
      ...Shadow.sm,
    },
    barRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    barLabel: {
      width: 70,
      fontSize: Typography.sm,
      color: Colors.textSecondary,
      fontWeight: Typography.medium,
    },
    barTrack: {
      flex: 1,
      height: 8,
      backgroundColor: Colors.border,
      borderRadius: Radius.full,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      backgroundColor: Colors.primary,
      borderRadius: Radius.full,
    },
    barMeta: {
      width: 90,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    barValue: {
      fontSize: Typography.xs,
      color: Colors.textPrimary,
      fontWeight: Typography.semibold,
    },
    barPct: {
      fontSize: Typography.xs,
      color: Colors.textTertiary,
      width: 28,
      textAlign: 'right',
    },
    rateCard: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.xl,
      padding: Spacing.base,
      gap: Spacing.md,
      ...Shadow.sm,
    },
    rateTrack: {
      height: 14,
      backgroundColor: Colors.overdueLight,
      borderRadius: Radius.full,
      overflow: 'hidden',
    },
    rateFill: {
      height: '100%',
      backgroundColor: Colors.ready,
      borderRadius: Radius.full,
    },
    rateLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    rateLabel: {
      fontSize: Typography.xs,
      color: Colors.textSecondary,
      fontWeight: Typography.medium,
    },
    rateLegend: {
      gap: Spacing.sm,
    },
    rateLegendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    rateDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    rateLegendText: {
      fontSize: Typography.sm,
      color: Colors.textSecondary,
      fontWeight: Typography.medium,
    },
    statCard: {
      flex: 1,
      borderRadius: Radius.xl,
      padding: Spacing.base,
      minHeight: 100,
      justifyContent: 'space-between',
      ...Shadow.sm,
    },
    statLabel: {
      fontSize: Typography.xs,
      fontWeight: Typography.semibold,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: Spacing.xs,
    },
    statValue: {
      fontSize: Typography.xl,
      fontWeight: Typography.extrabold,
      marginBottom: 2,
    },
    statSub: {
      fontSize: Typography.xs,
      color: Colors.textTertiary,
      fontWeight: Typography.medium,
    },
    // Improvement #7
    insightCard: {
      backgroundColor: Colors.primaryFaint,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      marginBottom: Spacing.md,
      borderLeftWidth: 3,
      borderLeftColor: Colors.primary,
    },
    insightText: {
      fontSize: Typography.sm,
      color: Colors.primary,
      fontWeight: Typography.medium,
      lineHeight: 20,
    },
  }), [Colors]);

  const filteredJobs = useMemo<Job[]>(() => {
    if (period === 'all') return jobs;
    if (period === 'month') return jobs.filter((j) => isWithin(j.createdAt, 30));
    return jobs.filter((j) => isWithin(j.createdAt, 7));
  }, [jobs, period]);

  // Improvement #7 — previous period jobs for comparison
  const previousJobs = useMemo<Job[]>(() => {
    if (period === 'all') return [];
    const days = period === 'month' ? 30 : 7;
    return jobs.filter((j) => {
      try {
        const d = new Date(j.createdAt);
        const now = new Date();
        const periodStart = new Date(); periodStart.setDate(now.getDate() - days);
        const prevStart   = new Date(); prevStart.setDate(now.getDate() - days * 2);
        return d >= prevStart && d < periodStart;
      } catch { return false; }
    });
  }, [jobs, period]);

  const stats = useMemo(() => {
    const totalRevenue    = filteredJobs.reduce((s, j) => s + (j.price || 0), 0);
    const totalCollected  = filteredJobs.reduce((s, j) => s + (j.price || 0) - (j.balance || 0), 0);
    const totalOutstanding= filteredJobs.reduce((s, j) => s + (j.balance || 0), 0);
    const jobCount        = filteredJobs.length;
    const deliveredCount  = filteredJobs.filter((j) => j.status === 'Delivered').length;
    const avgJobValue     = jobCount > 0 ? totalRevenue / jobCount : 0;

    // Improvement #7 — compute change vs previous period
    const prevRevenue     = previousJobs.reduce((s, j) => s + (j.price || 0), 0);
    const revenueChange   = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : null;
    const prevJobCount    = previousJobs.length;
    const jobCountChange  = prevJobCount > 0 ? Math.round(((jobCount - prevJobCount) / prevJobCount) * 100) : null;

    return {
      totalRevenue, totalCollected, totalOutstanding,
      jobCount, deliveredCount, avgJobValue,
      revenueChange, jobCountChange, prevRevenue,
    };
  }, [filteredJobs, previousJobs]);

  // ── Customers with outstanding balances ─────────────────────────────────────
  const customerBalances = useMemo(() => {
    const map: Record<string, { name: string; customerId: string; balance: number; jobCount: number }> = {};
    filteredJobs
      .filter((j) => j.balance > 0)
      .forEach((j) => {
        if (!map[j.customerId]) {
          map[j.customerId] = { name: j.customerName, customerId: j.customerId, balance: 0, jobCount: 0 };
        }
        map[j.customerId].balance += j.balance;
        map[j.customerId].jobCount += 1;
      });
    return Object.values(map).sort((a, b) => b.balance - a.balance);
  }, [filteredJobs]);

  // ── Revenue by garment type ──────────────────────────────────────────────────
  const garmentBreakdown = useMemo(() => {
    const map: Record<string, { type: string; revenue: number; count: number }> = {};
    filteredJobs.forEach((j) => {
      const t = j.outfitType || 'Other';
      if (!map[t]) map[t] = { type: t, revenue: 0, count: 0 };
      map[t].revenue += j.price || 0;
      map[t].count += 1;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [filteredJobs]);

  const maxGarmentRevenue = garmentBreakdown[0]?.revenue || 1;

  const PERIODS: { key: Period; label: string }[] = [
    { key: 'all', label: 'All time' },
    { key: 'month', label: 'This month' },
    { key: 'week', label: 'This week' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ─── Header — fades in on mount ─── */}
      <Animated.View style={headerAnim.style}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MenuIcon size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Financials</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* ─── Period Tabs ─── */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              onPress={() => setPeriod(p.key)}
              style={[styles.periodTab, period === p.key && styles.periodTabActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.periodTabText, period === p.key && styles.periodTabTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ─── Improvement #7: Period comparison — sentence not number ─── */}
        {period !== 'all' && (
          <View style={styles.insightCard}>
            {(() => {
              const periodLabel = period === 'month' ? 'month' : 'week';
              let sentence = '';
              if (stats.revenueChange !== null) {
                sentence = stats.revenueChange >= 0
                  ? `📈 Revenue is up ${stats.revenueChange}% vs the previous ${periodLabel}.`
                  : `📉 Revenue is down ${Math.abs(stats.revenueChange)}% vs last ${periodLabel}.`;
              } else if (stats.totalRevenue > 0) {
                sentence = `${stats.jobCount} job${stats.jobCount !== 1 ? 's' : ''} recorded this ${periodLabel}.`;
              } else {
                sentence = `No jobs recorded yet this ${periodLabel}.`;
              }
              if (customerBalances.length > 0) {
                sentence += ` ${customerBalances.length} customer${customerBalances.length !== 1 ? 's' : ''} still owe a balance.`;
              }
              return <Text style={styles.insightText}>{sentence}</Text>;
            })()}
          </View>
        )}

        {/* ─── Top Stats — entrance + count-up on figures ─── */}
        <Animated.View style={statsAnim.style}>
        <View style={styles.statsGrid}>
          <AnimatedStatCard
            label="Total Revenue"
            value={stats.totalRevenue}
            sub={`${stats.jobCount} job${stats.jobCount !== 1 ? 's' : ''}`}
            bg={Colors.primaryFaint}
            color={Colors.primary}
            styles={styles}
          />
          <AnimatedStatCard
            label="Collected"
            value={stats.totalCollected}
            sub={`${stats.deliveredCount} delivered`}
            bg={Colors.readyLight}
            color={Colors.ready}
            styles={styles}
          />
        </View>
        <View style={styles.statsGrid}>
          <AnimatedStatCard
            label="Outstanding"
            value={stats.totalOutstanding}
            sub={`${customerBalances.length} customer${customerBalances.length !== 1 ? 's' : ''}`}
            bg={stats.totalOutstanding > 0 ? Colors.overdueLight : Colors.readyLight}
            color={stats.totalOutstanding > 0 ? Colors.overdue : Colors.ready}
            styles={styles}
          />
          <AnimatedStatCard
            label="Avg. Job Value"
            value={stats.avgJobValue}
            sub="per job"
            bg={Colors.accentLight}
            color={Colors.accent}
            styles={styles}
          />
        </View>
        </Animated.View>

        {/* ─── Outstanding by Customer ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outstanding Balances</Text>
          {customerBalances.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyText}>All balances cleared</Text>
              <Text style={styles.emptySubText}>No outstanding payments for this period</Text>
            </View>
          ) : (
            customerBalances.map((c) => (
              <TouchableOpacity
                key={c.customerId}
                style={styles.rowCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('CustomersStack', {
                  screen: 'CustomerDetail',
                  params: { customerId: c.customerId },
                })}
              >
                <View style={styles.rowAvatar}>
                  <Text style={styles.rowAvatarText}>
                    {c.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{c.name}</Text>
                  <Text style={styles.rowSub}>
                    {c.jobCount} job{c.jobCount !== 1 ? 's' : ''} with balance
                  </Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowAmount}>{formatNaira(c.balance)}</Text>
                  <ChevronRightIcon size={13} color={Colors.textTertiary} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ─── Revenue by Garment ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue by Garment</Text>
          {garmentBreakdown.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No jobs in this period</Text>
            </View>
          ) : (
            <View style={styles.barCard}>
              {garmentBreakdown.map((g) => {
                const pct = stats.totalRevenue > 0 ? g.revenue / stats.totalRevenue : 0;
                const barPct = maxGarmentRevenue > 0 ? g.revenue / maxGarmentRevenue : 0;
                return (
                  <View key={g.type} style={styles.barRow}>
                    <Text style={styles.barLabel} numberOfLines={1}>
                      {g.type}
                    </Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${barPct * 100}%` as any }]} />
                    </View>
                    <View style={styles.barMeta}>
                      <Text style={styles.barValue}>{formatNaira(g.revenue)}</Text>
                      <Text style={styles.barPct}>{Math.round(pct * 100)}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ─── Collection Rate ─── */}
        {stats.totalRevenue > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Collection Rate</Text>
            <View style={styles.rateCard}>
              <View style={styles.rateTrack}>
                <View
                  style={[
                    styles.rateFill,
                    {
                      width: `${Math.round((stats.totalCollected / stats.totalRevenue) * 100)}%` as any,
                    },
                  ]}
                />
              </View>
              <View style={styles.rateLabels}>
                <Text style={styles.rateLabel}>
                  {Math.round((stats.totalCollected / stats.totalRevenue) * 100)}% collected
                </Text>
                <Text style={styles.rateLabel}>
                  {Math.round((stats.totalOutstanding / stats.totalRevenue) * 100)}% pending
                </Text>
              </View>
              <View style={styles.rateLegend}>
                <View style={styles.rateLegendItem}>
                  <View style={[styles.rateDot, { backgroundColor: Colors.ready }]} />
                  <Text style={styles.rateLegendText}>{formatNaira(stats.totalCollected)} collected</Text>
                </View>
                <View style={styles.rateLegendItem}>
                  <View style={[styles.rateDot, { backgroundColor: Colors.overdue }]} />
                  <Text style={styles.rateLegendText}>{formatNaira(stats.totalOutstanding)} outstanding</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ─── Floating AI Assistant ─── */}
      <FloatingAssistant
        screen="BusinessInsights"
        context={{ screen: 'BusinessInsights', data: { period: period } }}
      />

    </SafeAreaView>
  );
};

// ─── AnimatedStatCard ─────────────────────────────────────────────────────────
// Calls useCountUp at component level (hooks rule) — each card counts up
// independently on mount, so all four values animate simultaneously.

const AnimatedStatCard: React.FC<{
  label: string;
  value: number;
  sub: string;
  bg: string;
  color: string;
  styles: any;
}> = ({ label, value, sub, bg, color, styles }) => {
  const countedValue = useCountUp(value, 550, 160);
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
      <Text
        style={[styles.statValue, { color }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        ₦{countedValue}
      </Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
};

export default FinancialsScreen;
