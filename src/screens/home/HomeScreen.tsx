import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useStore } from '../../context/store';
import { Colors, Typography, Spacing, Radius, Shadow, JOB_STATUS_CONFIG } from '../../constants/theme';
import {
  MenuIcon,
  NotificationsIcon,
  ChevronRightIcon,
  JobsIcon,
} from '../../components/common/Icons';
import { Avatar, StatusBadge } from '../../components/common/UI';
import { getFirstName, formatNaira } from '../../utils/helpers';
import { Job } from '../../types';

// ─── Task derivation ─────────────────────────────────────────────────────────

interface Task {
  id: string;
  label: string;
  subLabel?: string;
  urgency: 'critical' | 'warning' | 'action' | 'info';
  job: Job;
}

function buildTodayTasks(
  overdueJobs: Job[],
  dueToday: Job[],
  readyJobs: Job[]
): Task[] {
  const tasks: Task[] = [];
  const seen = new Set<string>();

  // 1. Overdue — most urgent
  for (const job of overdueJobs) {
    if (seen.has(job.id)) continue;
    seen.add(job.id);
    tasks.push({
      id: job.id,
      label: `${getFirstName(job.customerName)}'s ${job.outfitType} is overdue`,
      subLabel: 'Resolve immediately',
      urgency: 'critical',
      job,
    });
  }

  // 2. Due today — in progress
  for (const job of dueToday) {
    if (seen.has(job.id)) continue;
    seen.add(job.id);

    if (job.status === 'Ready') {
      if (job.deliveryType === 'waybill') {
        tasks.push({
          id: job.id,
          label: `Dispatch ${getFirstName(job.customerName)}'s ${job.outfitType}`,
          subLabel: `Waybill → ${job.deliveryAddress || 'destination'}`,
          urgency: 'action',
          job,
        });
      } else {
        tasks.push({
          id: job.id,
          label: `${getFirstName(job.customerName)} Pickup Today`,
          subLabel: `${job.outfitType} is ready`,
          urgency: 'action',
          job,
        });
      }
    } else {
      tasks.push({
        id: job.id,
        label: `Finish ${getFirstName(job.customerName)}'s ${job.outfitType}`,
        subLabel: `Due today · ${job.status}`,
        urgency: 'warning',
        job,
      });
    }
  }

  // 3. Ready jobs not in today's due list
  for (const job of readyJobs) {
    if (seen.has(job.id)) continue;
    seen.add(job.id);

    if (job.deliveryType === 'waybill') {
      tasks.push({
        id: job.id,
        label: `Dispatch ${getFirstName(job.customerName)}'s ${job.outfitType}`,
        subLabel: `Waybill ready to send`,
        urgency: 'action',
        job,
      });
    } else {
      tasks.push({
        id: job.id,
        label: `Notify ${getFirstName(job.customerName)} — ready for pickup`,
        subLabel: `${job.outfitType} · ${job.balance > 0 ? formatNaira(job.balance) + ' balance' : 'Fully paid'}`,
        urgency: 'action',
        job,
      });
    }
  }

  // 4. Balance collection reminders (ready with outstanding balance — deduplicated)
  for (const job of readyJobs) {
    if (job.balance > 0) {
      const balId = `bal_${job.id}`;
      if (seen.has(balId)) continue;
      seen.add(balId);
      tasks.push({
        id: balId,
        label: `Collect ${formatNaira(job.balance)} from ${getFirstName(job.customerName)}`,
        subLabel: `Balance on ${job.outfitType}`,
        urgency: 'info',
        job,
      });
    }
  }

  return tasks;
}

// ─── Home Screen ─────────────────────────────────────────────────────────────

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    dueToday,
    overdueJobs,
    pendingJobs,
    readyJobs,
    recentJobs,
    unreadNotificationCount,
    settings,
    isLoading,
    initialize,
    refreshJobs,
    loadSettings,
  } = useStore();

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    initialize();
    loadSettings();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshJobs();
    setRefreshing(false);
  }, []);

  const tasks = useMemo(
    () => buildTodayTasks(overdueJobs, dueToday, readyJobs),
    [overdueJobs, dueToday, readyJobs]
  );

  const tailorName = settings?.tailorName || 'Tailor';
  const today = new Date().toLocaleDateString('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const goToJob = (jobId: string) =>
    navigation.navigate('JobsStack', { screen: 'JobDetail', params: { jobId } });

  const startNewOrder = () =>
    navigation.navigate('JobsStack', { screen: 'NewOrderFlow', params: {} });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ─── Top Bar ─── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={styles.iconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MenuIcon size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={styles.topBarDate}>{today}</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('NotificationsScreen')}
          style={styles.iconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <NotificationsIcon size={22} color={Colors.textPrimary} />
          {unreadNotificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* ─── Greeting ─── */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingName}>
            {tailorName.split(' ')[0]} 👋
          </Text>
          <Text style={styles.greetingSubtext}>
            {tasks.length === 0
              ? "You're all caught up. Great work!"
              : `You have ${tasks.length} thing${tasks.length === 1 ? '' : 's'} to handle today.`}
          </Text>
        </View>

        {/* ─── Primary CTA ─── */}
        <TouchableOpacity
          onPress={startNewOrder}
          activeOpacity={0.88}
          style={styles.newOrderBtn}
        >
          <Text style={styles.newOrderPlus}>+</Text>
          <Text style={styles.newOrderLabel}>Start New Order</Text>
        </TouchableOpacity>

        {/* ─── Today's Tasks ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Today's Tasks</Text>
            {tasks.length > 0 && (
              <View style={styles.taskCountBadge}>
                <Text style={styles.taskCountText}>{tasks.length}</Text>
              </View>
            )}
          </View>

          {tasks.length === 0 ? (
            <View style={styles.emptyTaskCard}>
              <Text style={styles.emptyTaskEmoji}>🎉</Text>
              <Text style={styles.emptyTaskTitle}>Nothing urgent today</Text>
              <Text style={styles.emptyTaskSubtext}>
                All jobs are on track. Start a new order when ready.
              </Text>
            </View>
          ) : (
            <View style={styles.taskList}>
              {tasks.map((task, idx) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isLast={idx === tasks.length - 1}
                  onPress={() => goToJob(task.job.id)}
                />
              ))}
            </View>
          )}
        </View>

        {/* ─── Active Jobs Summary ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workbench</Text>
          <View style={styles.summaryRow}>
            <SummaryTile
              count={pendingJobs.length}
              label="In Progress"
              color={Colors.primary}
              bgColor={Colors.primaryFaint}
              onPress={() => navigation.navigate('JobsStack', { screen: 'JobList' })}
            />
            <SummaryTile
              count={readyJobs.length}
              label="Ready"
              color={Colors.ready}
              bgColor={Colors.readyLight}
              onPress={() => navigation.navigate('JobsStack', { screen: 'JobList' })}
            />
            <SummaryTile
              count={overdueJobs.length}
              label="Overdue"
              color={Colors.overdue}
              bgColor={Colors.overdueLight}
              onPress={() => navigation.navigate('JobsStack', { screen: 'JobList' })}
            />
          </View>
        </View>

        {/* ─── Recent Activity ─── */}
        {recentJobs.length > 0 && (
          <View style={[styles.section, { marginBottom: Spacing.xxxl }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Jobs</Text>
              <TouchableOpacity onPress={() => navigation.navigate('JobsStack')}>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentList}>
              {recentJobs.slice(0, 4).map((job, idx) => (
                <RecentJobRow
                  key={job.id}
                  job={job}
                  isLast={idx === Math.min(recentJobs.length, 4) - 1}
                  onPress={() => goToJob(job.id)}
                />
              ))}
            </View>
          </View>
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── TaskCard ─────────────────────────────────────────────────────────────────

const URGENCY_CONFIG = {
  critical: { border: Colors.overdue, bg: Colors.overdueLight, dot: Colors.overdue },
  warning: { border: Colors.dueSoon, bg: Colors.dueSoonLight, dot: Colors.dueSoon },
  action: { border: Colors.ready, bg: Colors.readyLight, dot: Colors.ready },
  info: { border: Colors.primary, bg: Colors.primaryFaint, dot: Colors.primary },
};

const TaskCard: React.FC<{ task: Task; isLast: boolean; onPress: () => void }> = ({
  task,
  isLast,
  onPress,
}) => {
  const cfg = URGENCY_CONFIG[task.urgency];
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.taskCard,
        { borderLeftColor: cfg.border },
        !isLast && styles.taskCardBorder,
      ]}
    >
      <View style={[styles.taskDot, { backgroundColor: cfg.dot }]} />
      <View style={styles.taskContent}>
        <Text style={styles.taskLabel}>{task.label}</Text>
        {task.subLabel && (
          <Text style={styles.taskSubLabel}>{task.subLabel}</Text>
        )}
      </View>
      <ChevronRightIcon size={16} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
};

// ─── SummaryTile ──────────────────────────────────────────────────────────────

const SummaryTile: React.FC<{
  count: number;
  label: string;
  color: string;
  bgColor: string;
  onPress: () => void;
}> = ({ count, label, color, bgColor, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    style={[styles.summaryTile, { backgroundColor: bgColor }]}
  >
    <Text style={[styles.summaryCount, { color }]}>{count}</Text>
    <Text style={[styles.summaryLabel, { color }]}>{label}</Text>
  </TouchableOpacity>
);

// ─── RecentJobRow ─────────────────────────────────────────────────────────────

const RecentJobRow: React.FC<{ job: Job; isLast: boolean; onPress: () => void }> = ({
  job,
  isLast,
  onPress,
}) => {
  const config = JOB_STATUS_CONFIG[job.status];
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.recentRow, !isLast && styles.recentRowBorder]}
    >
      <Avatar name={job.customerName} size={38} />
      <View style={styles.recentContent}>
        <Text style={styles.recentName} numberOfLines={1}>
          {getFirstName(job.customerName)}'s {job.outfitType}
        </Text>
        <StatusBadge status={job.status} size="sm" />
      </View>
      <ChevronRightIcon size={16} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  topBarCenter: { flex: 1, alignItems: 'center' },
  topBarDate: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  iconBtn: { position: 'relative', padding: Spacing.xs },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.overdue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  badgeText: { color: Colors.white, fontSize: 10, fontWeight: Typography.bold },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xxl },

  // Greeting
  greetingBlock: { paddingTop: Spacing.sm, marginBottom: Spacing.xl },
  greetingName: {
    fontSize: Typography.xxl,
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  greetingSubtext: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // New Order Button
  newOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
    ...Shadow.md,
  },
  newOrderPlus: {
    fontSize: 28,
    fontWeight: Typography.bold,
    color: Colors.white,
    lineHeight: 30,
    marginTop: -2,
  },
  newOrderLabel: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.white,
    letterSpacing: 0.2,
  },

  // Section
  section: { marginBottom: Spacing.xxl },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  viewAllText: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.medium,
  },
  taskCountBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  taskCountText: { color: Colors.white, fontSize: 11, fontWeight: Typography.bold },

  // Task List
  taskList: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingLeft: Spacing.base,
    borderLeftWidth: 3,
    gap: Spacing.md,
    backgroundColor: Colors.surface,
  },
  taskCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  taskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  taskContent: { flex: 1 },
  taskLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  taskSubLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Empty Tasks
  emptyTaskCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadow.sm,
  },
  emptyTaskEmoji: { fontSize: 32, marginBottom: Spacing.md },
  emptyTaskTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptyTaskSubtext: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Summary tiles
  summaryRow: { flexDirection: 'row', gap: Spacing.md },
  summaryTile: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    ...Shadow.sm,
  },
  summaryCount: {
    fontSize: Typography.xxl,
    fontWeight: Typography.extrabold,
    lineHeight: 32,
  },
  summaryLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    marginTop: 2,
    textAlign: 'center',
  },

  // Recent
  recentList: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  recentRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  recentContent: { flex: 1, gap: 4 },
  recentName: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
});

export default HomeScreen;
