import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useStore } from '../../context/store';
import { Colors, Typography, Spacing, Radius, Shadow, JOB_STATUS_CONFIG } from '../../constants/theme';
import {
  MenuIcon,
  NotificationsIcon,
  ChevronRightIcon,
} from '../../components/common/Icons';
import { getFirstName, formatNaira } from '../../utils/helpers';
import { Job } from '../../types';

const CARD_WIDTH = Dimensions.get('window').width * 0.68;
const CARD_HEIGHT = CARD_WIDTH * 1.2;

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

  return tasks;
}

// ─── Home Screen ─────────────────────────────────────────────────────────────

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    dueToday,
    overdueJobs,
    readyJobs,
    recentJobs,
    pendingWaybills,
    outstandingBalances,
    unreadNotificationCount,
    settings,
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

        {/* ─── Recent Jobs ─── */}
        {recentJobs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Jobs</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('JobsStack', { screen: 'JobList' })}
              >
                <Text style={styles.viewAllText}>See all →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentJobsScroll}
              snapToInterval={CARD_WIDTH + Spacing.md}
              decelerationRate="fast"
              pagingEnabled={false}
            >
              {recentJobs.map((job) => (
                <RecentJobCard
                  key={job.id}
                  job={job}
                  onPress={() => goToJob(job.id)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ─── Awaiting Dispatch ─── */}
        {pendingWaybills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>📦 Awaiting Dispatch</Text>
              <View style={styles.taskCountBadge}>
                <Text style={styles.taskCountText}>{pendingWaybills.length}</Text>
              </View>
            </View>
            <View style={styles.taskList}>
              {pendingWaybills.map((job, idx) => (
                <TouchableOpacity
                  key={job.id}
                  onPress={() => goToJob(job.id)}
                  activeOpacity={0.8}
                  style={[
                    styles.compactRow,
                    idx < pendingWaybills.length - 1 && styles.compactRowBorder,
                  ]}
                >
                  <View style={[styles.compactDot, { backgroundColor: Colors.ready }]} />
                  <View style={styles.compactInfo}>
                    <Text style={styles.compactLabel}>
                      {getFirstName(job.customerName)}'s {job.outfitType}
                    </Text>
                    <Text style={styles.compactSub}>
                      → {job.deliveryAddress || 'destination'}
                    </Text>
                  </View>
                  <ChevronRightIcon size={14} color={Colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ─── Outstanding Balances ─── */}
        {outstandingBalances.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>💰 Outstanding Balances</Text>
              <Text style={styles.balanceTotalText}>
                {formatNaira(
                  outstandingBalances.reduce((sum, j) => sum + j.balance, 0)
                )}
              </Text>
            </View>
            <View style={styles.taskList}>
              {outstandingBalances.map((job, idx) => (
                <TouchableOpacity
                  key={job.id}
                  onPress={() => goToJob(job.id)}
                  activeOpacity={0.8}
                  style={[
                    styles.compactRow,
                    idx < outstandingBalances.length - 1 && styles.compactRowBorder,
                  ]}
                >
                  <View style={[styles.compactDot, { backgroundColor: Colors.overdue }]} />
                  <View style={styles.compactInfo}>
                    <Text style={styles.compactLabel}>
                      {getFirstName(job.customerName)}'s {job.outfitType}
                    </Text>
                    <Text style={styles.compactSub}>Delivered · balance owed</Text>
                  </View>
                  <Text style={styles.balanceAmount}>{formatNaira(job.balance)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ─── Quick Links ─── */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => navigation.navigate('CustomersStack')}
            activeOpacity={0.85}
          >
            <Text style={styles.quickBtnLabel}>Customers</Text>
            <Text style={styles.quickBtnSub}>Memory system</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => navigation.navigate('JobsStack', { screen: 'JobList' })}
            activeOpacity={0.85}
          >
            <Text style={styles.quickBtnLabel}>All Jobs</Text>
            <Text style={styles.quickBtnSub}>Workbench</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => navigation.navigate('AccountScreen')}
            activeOpacity={0.85}
          >
            <Text style={styles.quickBtnLabel}>Settings</Text>
            <Text style={styles.quickBtnSub}>Your profile</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── RecentJobCard ─────────────────────────────────────────────────────────────

const OUTFIT_EMOJI: Record<string, string> = {
  Agbada: '🥻', Senator: '👘', Suit: '🤵', Gown: '👗',
  Kaftan: '🧥', Shirt: '👔', Trouser: '👖', Blouse: '👚',
  Skirt: '🪡', Other: '✂️',
};

const STATUS_BG: Record<string, string> = {
  Pending: '#E8F4FD', Cutting: '#FFF3CD', Sewing: '#E8F8E8',
  Finishing: '#FFF0E8', Ready: '#E8F8E8', Delivered: '#F0F0F0',
};

const RecentJobCard: React.FC<{ job: Job; onPress: () => void }> = ({ job, onPress }) => {
  const photos = useMemo(() => {
    if (!job.photoUris?.length) return [];
    if (job.photoUris.length === 1) return job.photoUris;
    return [...job.photoUris].sort(() => Math.random() - 0.5);
  }, []);

  const [photoIdx, setPhotoIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (photos.length <= 1) return;
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
      setPhotoIdx((prev) => (prev + 1) % photos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [photos.length]);

  const cfg = JOB_STATUS_CONFIG[job.status as keyof typeof JOB_STATUS_CONFIG];
  const bgColor = STATUS_BG[job.status] || Colors.surface;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={[styles.recentCard, { width: CARD_WIDTH }]}
    >
      {/* ─── Photo / Fallback ─── */}
      <View style={[styles.recentCardMedia, { backgroundColor: bgColor }]}>
        {photos.length > 0 ? (
          <Animated.Image
            source={{ uri: photos[photoIdx] }}
            style={[styles.recentCardImage, { opacity: fadeAnim }]}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.recentCardEmoji}>
            {OUTFIT_EMOJI[job.outfitType] || '✂️'}
          </Text>
        )}
        {/* Status badge */}
        <View style={[styles.recentStatusBadge, { backgroundColor: cfg?.color || Colors.primary }]}>
          <Text style={styles.recentStatusText}>{job.status}</Text>
        </View>
        {/* Photo count */}
        {photos.length > 1 && (
          <View style={styles.photoCountBadge}>
            <Text style={styles.photoCountText}>📷 {photos.length}</Text>
          </View>
        )}
      </View>

      {/* ─── Info ─── */}
      <View style={styles.recentCardInfo}>
        <Text style={styles.recentCardName} numberOfLines={1}>
          {getFirstName(job.customerName)}
        </Text>
        <Text style={styles.recentCardType}>{job.outfitType}</Text>
        {job.balance > 0 && (
          <Text style={styles.recentCardBalance}>
            {formatNaira(job.balance)} balance
          </Text>
        )}
      </View>
    </TouchableOpacity>
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
    top: 0, right: 0,
    minWidth: 18, height: 18,
    borderRadius: 9,
    backgroundColor: Colors.overdue,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2, borderColor: Colors.background,
  },
  badgeText: { color: Colors.white, fontSize: 10, fontWeight: Typography.bold },
  scroll: { paddingBottom: Spacing.xxl },

  greetingBlock: {
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
  },
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

  newOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.xxl,
    marginHorizontal: Spacing.base,
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

  section: { marginBottom: Spacing.xxl },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.base,
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
    minWidth: 22, height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  taskCountText: { color: Colors.white, fontSize: 11, fontWeight: Typography.bold },

  taskList: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginHorizontal: Spacing.base,
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
  taskDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
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

  emptyTaskCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginHorizontal: Spacing.base,
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

  // Recent Jobs
  recentJobsScroll: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
    paddingRight: Spacing.base + CARD_WIDTH * 0.3,
  },
  recentCard: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    ...Shadow.md,
  },
  recentCardMedia: {
    width: '100%',
    height: CARD_HEIGHT * 0.7,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  recentCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0, left: 0,
  },
  recentCardEmoji: { fontSize: 64 },
  recentStatusBadge: {
    position: 'absolute',
    top: 10, left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  recentStatusText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  photoCountText: { fontSize: Typography.xs, color: Colors.white },
  recentCardInfo: {
    padding: Spacing.md,
  },
  recentCardName: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  recentCardType: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  recentCardBalance: {
    fontSize: Typography.xs,
    color: Colors.overdue,
    fontWeight: Typography.semibold,
    marginTop: 4,
  },

  // Compact rows (dispatch, balances)
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    gap: Spacing.md,
  },
  compactRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  compactDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  compactInfo: { flex: 1 },
  compactLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  compactSub: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  balanceAmount: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.overdue,
  },
  balanceTotalText: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.overdue,
  },

  quickRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.base,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
    ...Shadow.sm,
  },
  quickBtnLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  quickBtnSub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default HomeScreen;
