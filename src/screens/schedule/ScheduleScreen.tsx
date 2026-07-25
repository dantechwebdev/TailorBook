/**
 * ScheduleScreen — Improvement #10
 * Adds a horizontal week date strip at the top.
 * Tailors can see their full week at a glance: each day shows a dot if jobs are due.
 * Tapping a day filters the list to that day's jobs.
 * The existing SectionList view is preserved below and activated when no day filter is set.
 */
import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, SectionList, TouchableOpacity,
  StyleSheet, FlatList, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useStore } from '../../context/store';
import { Typography, Spacing, Radius, Shadow, getJobStatusConfig } from '../../constants/theme';
import { MenuIcon, ClockIcon } from '../../components/common/Icons';
import { StatusBadge, EmptyState } from '../../components/common/UI';
import { formatNaira, getFirstName } from '../../utils/helpers';
import { Job } from '../../types';
import { addDays, format, parseISO, isSameDay, differenceInCalendarDays, startOfWeek } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';

// ─── Section grouping (unchanged from previous version) ──────────────────────

interface ScheduleSection { title: string; subtitle: string; data: Job[]; color: string; }

function buildScheduleSections(jobs: Job[], C: any): ScheduleSection[] {
  const active = jobs.filter(j => j.status !== 'Delivered');
  const now = new Date(); now.setHours(0,0,0,0);
  const buckets: Record<string, Job[]> = { overdue:[], today:[], tomorrow:[], thisWeek:[], later:[] };

  for (const job of active) {
    try {
      const diff = differenceInCalendarDays(parseISO(job.deliveryDate), now);
      if      (diff < 0)  buckets.overdue.push(job);
      else if (diff === 0) buckets.today.push(job);
      else if (diff === 1) buckets.tomorrow.push(job);
      else if (diff <= 7)  buckets.thisWeek.push(job);
      else                 buckets.later.push(job);
    } catch { buckets.later.push(job); }
  }

  const sections: ScheduleSection[] = [];
  if (buckets.overdue.length)   sections.push({ title: 'Overdue',    subtitle: 'These jobs need immediate attention', data: buckets.overdue,   color: C.overdue  });
  if (buckets.today.length)     sections.push({ title: 'Today',      subtitle: format(new Date(),'EEEE, d MMMM'),     data: buckets.today,     color: C.primary  });
  if (buckets.tomorrow.length)  sections.push({ title: 'Tomorrow',   subtitle: format(addDays(new Date(),1),'EEEE, d MMMM'), data: buckets.tomorrow, color: C.cutting  });
  if (buckets.thisWeek.length)  sections.push({ title: 'This Week',  subtitle: 'Due within 7 days',                   data: buckets.thisWeek,  color: C.dueSoon  });
  if (buckets.later.length)     sections.push({ title: 'Later',      subtitle: 'Due in more than 1 week',             data: buckets.later,     color: C.textTertiary });
  return sections;
}

function getDeliveryLabel(job: Job): string {
  if (job.deliveryType === 'waybill') return `📦 Waybill${job.deliveryAddress ? ' → ' + job.deliveryAddress : ''}`;
  return '🏪 Pickup';
}

// ─── Week Date Strip ──────────────────────────────────────────────────────────

const WeekStrip: React.FC<{
  jobs: Job[];
  selectedDay: Date | null;
  onSelectDay: (d: Date | null) => void;
  C: any;
  styles: any;
}> = ({ jobs, selectedDay, onSelectDay, C, styles }) => {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <View style={styles.strip}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripScroll}>
        {/* "All" button */}
        <TouchableOpacity
          onPress={() => onSelectDay(null)}
          style={[styles.dayCell, !selectedDay && styles.dayCellSelected]}
          activeOpacity={0.8}
        >
          <Text style={[styles.dayLabel, !selectedDay && styles.dayLabelSelected]}>ALL</Text>
          <Text style={[styles.dayNum, !selectedDay && styles.dayNumSelected]}>📋</Text>
        </TouchableOpacity>

        {days.map((day, idx) => {
          const isToday = isSameDay(day, today);
          const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
          const jobsOnDay = jobs.filter(j => {
            try { return j.status !== 'Delivered' && isSameDay(parseISO(j.deliveryDate), day); }
            catch { return false; }
          });
          const hasDot = jobsOnDay.length > 0;
          const hasOverdue = jobsOnDay.some(j => {
            try { return differenceInCalendarDays(parseISO(j.deliveryDate), new Date()) < 0; } catch { return false; }
          });

          return (
            <TouchableOpacity
              key={idx}
              onPress={() => onSelectDay(isSelected ? null : day)}
              style={[styles.dayCell, isSelected && styles.dayCellSelected, isToday && !isSelected && styles.dayCellToday]}
              activeOpacity={0.8}
            >
              <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected, isToday && !isSelected && { color: C.primary }]}>
                {format(day, 'EEE').toUpperCase()}
              </Text>
              <Text style={[styles.dayNum, isSelected && styles.dayNumSelected, isToday && !isSelected && { color: C.primary, fontWeight: Typography.bold }]}>
                {format(day, 'd')}
              </Text>
              {hasDot && (
                <View style={[styles.dayDot, { backgroundColor: hasOverdue ? C.overdue : isSelected ? C.white : C.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ─── Schedule Screen ──────────────────────────────────────────────────────────

const ScheduleScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { jobs } = useStore();
  const { colors: C } = useTheme();
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const styles = useMemo(() => makeStyles(C), [C]);
  const sections = useMemo(() => buildScheduleSections(jobs, C), [jobs, C]);

  // When a day is selected, filter to that day's active jobs
  const filteredForDay = useMemo(() => {
    if (!selectedDay) return null;
    return jobs.filter(j => {
      try { return j.status !== 'Delivered' && isSameDay(parseISO(j.deliveryDate), selectedDay); }
      catch { return false; }
    });
  }, [jobs, selectedDay]);

  const totalActive = sections.reduce((s, sec) => s + sec.data.length, 0);

  const goToJob = useCallback((jobId: string) => {
    navigation.navigate('JobDetail', { jobId });
  }, [navigation]);

  const JobCard: React.FC<{ job: Job }> = useCallback(({ job }) => (
    <TouchableOpacity onPress={() => goToJob(job.id)} activeOpacity={0.8} style={styles.jobCard}>
      <View style={[styles.jobStatusBar, { backgroundColor: getJobStatusConfig(C)[job.status]?.color ?? C.primary }]} />
      <View style={styles.jobCardContent}>
        <View style={styles.jobCardTop}>
          <Text style={styles.jobCardName} numberOfLines={1}>{getFirstName(job.customerName)}'s {job.outfitType}</Text>
          <StatusBadge status={job.status} size="sm" />
        </View>
        <View style={styles.jobCardMeta}>
          <Text style={styles.jobCardDelivery}>{getDeliveryLabel(job)}</Text>
          {job.balance > 0 && <Text style={styles.jobCardBalance}>💰 {formatNaira(job.balance)} due</Text>}
        </View>
      </View>
    </TouchableOpacity>
  ) as any, [goToJob, styles, C]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} hitSlop={{top:8,bottom:8,left:8,right:8}}>
          <MenuIcon size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Schedule</Text>
          <Text style={styles.headerSub}>{totalActive} active job{totalActive !== 1 ? 's' : ''}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Improvement #10 — Week date strip */}
      <WeekStrip jobs={jobs} selectedDay={selectedDay} onSelectDay={setSelectedDay} C={C} styles={styles} />

      {/* Day-filtered view */}
      {filteredForDay !== null ? (
        <FlatList
          data={filteredForDay}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListEmptyComponent={
            <EmptyState
              icon={<ClockIcon size={32} color={C.primary} />}
              title={`Nothing due on ${format(selectedDay!, 'EEEE d MMMM')}`}
              subtitle="Tap ALL to see the full schedule."
            />
          }
          renderItem={({ item }) => <JobCard job={item} />}
        />
      ) : sections.length === 0 ? (
        <EmptyState
          icon={<ClockIcon size={32} color={C.primary} />}
          title="All clear!"
          subtitle="No active jobs scheduled. Create a new order to get started."
          action={{ label: 'New Order', onPress: () => navigation.navigate('JobsStack', { screen: 'NewOrderFlow', params: {} }) }}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: section.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: section.color }]}>{section.title}</Text>
                <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
              </View>
              <View style={[styles.sectionBadge, { backgroundColor: section.color + '20' }]}>
                <Text style={[styles.sectionBadgeText, { color: section.color }]}>{section.data.length}</Text>
              </View>
            </View>
          )}
          renderItem={({ item: job }) => <JobCard job={job} />}
          SectionSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}
    </SafeAreaView>
  );
};

function makeStyles(C: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: C.textPrimary },
    headerSub: { fontSize: Typography.xs, color: C.textSecondary, marginTop: 1 },
    list: { paddingHorizontal: Spacing.base, paddingBottom: 120 },

    // Improvement #10 — Week strip styles
    strip: { borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: Spacing.sm },
    stripScroll: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.sm },
    dayCell: {
      minWidth: 48, alignItems: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm,
      borderRadius: Radius.lg, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface,
    },
    dayCellSelected: { backgroundColor: C.primary, borderColor: C.primary },
    dayCellToday: { borderColor: C.primary },
    dayLabel: { fontSize: 9, fontWeight: Typography.bold, color: C.textTertiary, letterSpacing: 0.5 },
    dayLabelSelected: { color: 'rgba(255,255,255,0.8)' },
    dayNum: { fontSize: Typography.base, fontWeight: Typography.semibold, color: C.textPrimary, marginTop: 2 },
    dayNumSelected: { color: C.white, fontWeight: Typography.bold },
    dayDot: { width: 5, height: 5, borderRadius: 3, marginTop: 3 },

    // Section headers
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
    sectionDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
    sectionTitle: { fontSize: Typography.md, fontWeight: Typography.bold },
    sectionSubtitle: { fontSize: Typography.xs, color: C.textTertiary, marginTop: 1 },
    sectionBadge: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
    sectionBadgeText: { fontSize: Typography.xs, fontWeight: Typography.bold },

    // Job card
    jobCard: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
    jobStatusBar: { width: 4 },
    jobCardContent: { flex: 1, padding: Spacing.md },
    jobCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    jobCardName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: C.textPrimary, flex: 1, marginRight: Spacing.sm },
    jobCardMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flexWrap: 'wrap' },
    jobCardDelivery: { fontSize: Typography.xs, color: C.textSecondary, fontWeight: Typography.medium },
    jobCardBalance: { fontSize: Typography.xs, color: C.overdue, fontWeight: Typography.semibold },
  });
}

export default ScheduleScreen;
