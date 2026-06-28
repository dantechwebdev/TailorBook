import React, { useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useStore } from '../../context/store';
import { Colors, Typography, Spacing, Radius, Shadow, JOB_STATUS_CONFIG } from '../../constants/theme';
import { MenuIcon, ClockIcon } from '../../components/common/Icons';
import { StatusBadge, EmptyState } from '../../components/common/UI';
import { formatNaira, getFirstName } from '../../utils/helpers';
import { Job } from '../../types';
import { addDays, format, parseISO, isToday, isTomorrow, differenceInCalendarDays } from 'date-fns';

// ─── Grouping Logic ───────────────────────────────────────────────────────────

interface ScheduleSection {
  title: string;
  subtitle: string;
  data: Job[];
  color: string;
}

function buildScheduleSections(jobs: Job[]): ScheduleSection[] {
  const active = jobs.filter((j) => j.status !== 'Delivered');

  const today: Job[] = [];
  const tomorrow: Job[] = [];
  const thisWeek: Job[] = [];
  const later: Job[] = [];
  const overdue: Job[] = [];

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (const job of active) {
    try {
      const d = parseISO(job.deliveryDate);
      const diff = differenceInCalendarDays(d, now);
      if (diff < 0) overdue.push(job);
      else if (diff === 0) today.push(job);
      else if (diff === 1) tomorrow.push(job);
      else if (diff <= 7) thisWeek.push(job);
      else later.push(job);
    } catch {
      later.push(job);
    }
  }

  const sections: ScheduleSection[] = [];

  if (overdue.length > 0) {
    sections.push({
      title: 'Overdue',
      subtitle: 'These jobs need immediate attention',
      data: overdue,
      color: Colors.overdue,
    });
  }
  if (today.length > 0) {
    sections.push({
      title: 'Today',
      subtitle: format(new Date(), 'EEEE, d MMMM'),
      data: today,
      color: Colors.primary,
    });
  }
  if (tomorrow.length > 0) {
    sections.push({
      title: 'Tomorrow',
      subtitle: format(addDays(new Date(), 1), 'EEEE, d MMMM'),
      data: tomorrow,
      color: Colors.cutting,
    });
  }
  if (thisWeek.length > 0) {
    sections.push({
      title: 'This Week',
      subtitle: 'Due within 7 days',
      data: thisWeek,
      color: Colors.dueSoon,
    });
  }
  if (later.length > 0) {
    sections.push({
      title: 'Later',
      subtitle: 'Due in more than 1 week',
      data: later,
      color: Colors.textTertiary,
    });
  }

  return sections;
}

function getDeliveryLabel(job: Job): string {
  if (job.deliveryType === 'waybill') {
    return `📦 Waybill${job.deliveryAddress ? ' → ' + job.deliveryAddress : ''}`;
  }
  return '🏪 Pickup';
}

// ─── Schedule Screen ──────────────────────────────────────────────────────────

const ScheduleScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { jobs } = useStore();

  const sections = useMemo(() => buildScheduleSections(jobs), [jobs]);
  const totalActive = sections.reduce((sum, s) => sum + s.data.length, 0);

  const goToJob = (jobId: string) => {
    navigation.navigate('JobsStack', {
      screen: 'JobDetail',
      params: { jobId },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={styles.menuBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MenuIcon size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Schedule</Text>
          <Text style={styles.headerSub}>
            {totalActive} active job{totalActive !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {sections.length === 0 ? (
        <EmptyState
          icon={<ClockIcon size={32} color={Colors.primary} />}
          title="All clear!"
          subtitle="No active jobs scheduled. Start a new order to get going."
          action={{
            label: 'Start New Order',
            onPress: () => navigation.navigate('JobsStack', { screen: 'NewOrderFlow', params: {} }),
          }}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: section.color }]} />
              <View>
                <Text style={[styles.sectionTitle, { color: section.color }]}>
                  {section.title}
                </Text>
                <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
              </View>
              <View style={[styles.sectionBadge, { backgroundColor: section.color + '20' }]}>
                <Text style={[styles.sectionBadgeText, { color: section.color }]}>
                  {section.data.length}
                </Text>
              </View>
            </View>
          )}
          renderItem={({ item: job, index, section }) => (
            <TouchableOpacity
              onPress={() => goToJob(job.id)}
              activeOpacity={0.8}
              style={[
                styles.jobCard,
                index === section.data.length - 1 && styles.jobCardLast,
              ]}
            >
              <View style={[styles.jobStatusBar, { backgroundColor: JOB_STATUS_CONFIG[job.status].color }]} />
              <View style={styles.jobCardContent}>
                <View style={styles.jobCardTop}>
                  <Text style={styles.jobCardName} numberOfLines={1}>
                    {getFirstName(job.customerName)}'s {job.outfitType}
                  </Text>
                  <StatusBadge status={job.status} size="sm" />
                </View>
                <View style={styles.jobCardMeta}>
                  <Text style={styles.jobCardDelivery}>{getDeliveryLabel(job)}</Text>
                  {job.balance > 0 && (
                    <Text style={styles.jobCardBalance}>💰 {formatNaira(job.balance)} due</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
          SectionSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ItemSeparatorComponent={() => (
            <View style={styles.itemSeparator} />
          )}
        />
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  menuBtn: { padding: Spacing.xs },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  list: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
  },
  sectionSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  sectionBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  sectionBadgeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },

  jobCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  jobCardLast: { marginBottom: 0 },
  jobStatusBar: { width: 4 },
  jobCardContent: { flex: 1, padding: Spacing.md },
  jobCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  jobCardName: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  jobCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  jobCardDelivery: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  jobCardBalance: {
    fontSize: Typography.xs,
    color: Colors.overdue,
    fontWeight: Typography.semibold,
  },

  itemSeparator: { height: Spacing.sm },
});

export default ScheduleScreen;
