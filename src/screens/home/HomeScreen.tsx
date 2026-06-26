import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useStore } from '../../context/store';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import {
  MenuIcon,
  NotificationsIcon,
  UserPlusIcon,
  BriefcasePlusIcon,
  ClockIcon,
  JobsIcon,
  ChevronRightIcon,
} from '../common/Icons';
import { Avatar, StatusBadge, SectionHeader, EmptyState } from '../common/UI';
import {
  getGreeting,
  formatDeliveryDate,
  getFirstName,
  formatNaira,
} from '../../utils/helpers';
import { JOB_STATUS_CONFIG } from '../../constants/theme';
import { Job } from '../../types';

// ─── Home Screen ───────────────────────────────────────────────────────────────

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    customers,
    dueToday,
    overdueJobs,
    pendingJobs,
    recentJobs,
    unreadNotificationCount,
    isLoading,
    initialize,
    refreshJobs,
  } = useStore();

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    initialize();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshJobs();
    setRefreshing(false);
  }, []);

  // Get first customer name for greeting (placeholder)
  const tailorName = 'Chinedu'; // In production: pull from settings

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* ─── Greeting ─── */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingTop}>{getGreeting()},</Text>
          <Text style={styles.greetingName}>{tailorName} 👋</Text>
          <Text style={styles.greetingSubtext}>Let's get some jobs done.</Text>
        </View>

        {/* ─── Quick Action Cards ─── */}
        <View style={styles.actionRow}>
          <QuickActionCard
            icon={<UserPlusIcon size={28} color={Colors.primary} />}
            label="Register New Customer"
            color={Colors.primaryFaint}
            onPress={() => navigation.navigate('CustomersStack', { screen: 'CustomerCreate' })}
          />
          <QuickActionCard
            icon={<BriefcasePlusIcon size={28} color={Colors.accent} />}
            label="Create New Job"
            color="#FFF8EC"
            onPress={() => navigation.navigate('JobsStack', { screen: 'JobCreate' })}
          />
        </View>

        {/* ─── Due Today ─── */}
        <View style={styles.section}>
          <SectionHeader
            title={`Due Today (${dueToday.length})`}
            action={
              dueToday.length > 3
                ? { label: 'View all', onPress: () => navigation.navigate('JobsStack') }
                : undefined
            }
            style={styles.sectionHeader}
          />
          {dueToday.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No deliveries due today 🎉</Text>
            </View>
          ) : (
            <View style={styles.listCard}>
              {dueToday.slice(0, 3).map((job, idx) => (
                <DueTodayItem
                  key={job.id}
                  job={job}
                  last={idx === Math.min(dueToday.length, 3) - 1}
                  onPress={() =>
                    navigation.navigate('JobsStack', { screen: 'JobDetail', params: { jobId: job.id } })
                  }
                />
              ))}
            </View>
          )}
        </View>

        {/* ─── Pending Jobs ─── */}
        <View style={styles.section}>
          <SectionHeader title="Pending Jobs" style={styles.sectionHeader} />
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('JobsStack')}
            style={[styles.statCard, { backgroundColor: '#FFF8EC' }]}
          >
            <BriefcasePlusIcon size={24} color={Colors.accent} />
            <Text style={[styles.statCount, { color: Colors.accent }]}>{pendingJobs.length} jobs</Text>
            <ChevronRightIcon size={18} color={Colors.accent} />
          </TouchableOpacity>
        </View>

        {/* ─── Overdue Jobs ─── */}
        {overdueJobs.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Overdue Jobs" style={styles.sectionHeader} />
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('JobsStack')}
              style={[styles.statCard, { backgroundColor: Colors.overdueLight }]}
            >
              <ClockIcon size={24} color={Colors.overdue} />
              <Text style={[styles.statCount, { color: Colors.overdue }]}>
                {overdueJobs.length} {overdueJobs.length === 1 ? 'job' : 'jobs'}
              </Text>
              <ChevronRightIcon size={18} color={Colors.overdue} />
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Recent Jobs ─── */}
        <View style={[styles.section, { marginBottom: Spacing.xxxl }]}>
          <SectionHeader
            title="Recent Jobs"
            action={{ label: 'View all', onPress: () => navigation.navigate('JobsStack') }}
            style={styles.sectionHeader}
          />
          {recentJobs.length === 0 ? (
            <EmptyState
              icon={<JobsIcon size={32} color={Colors.primary} />}
              title="No jobs yet"
              subtitle="Create your first job to get started"
              action={{
                label: 'Create Job',
                onPress: () => navigation.navigate('JobsStack', { screen: 'JobCreate' }),
              }}
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: Spacing.base }}
            >
              {recentJobs.map((job) => (
                <RecentJobCard
                  key={job.id}
                  job={job}
                  onPress={() =>
                    navigation.navigate('JobsStack', {
                      screen: 'JobDetail',
                      params: { jobId: job.id },
                    })
                  }
                />
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface QuickActionCardProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  onPress: () => void;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ icon, label, color, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.actionCard, { backgroundColor: color }]}>
    <View style={styles.actionCardIcon}>{icon}</View>
    <Text style={styles.actionCardLabel}>{label}</Text>
  </TouchableOpacity>
);

interface DueTodayItemProps {
  job: Job;
  last: boolean;
  onPress: () => void;
}

const DueTodayItem: React.FC<DueTodayItemProps> = ({ job, last, onPress }) => {
  const config = JOB_STATUS_CONFIG[job.status];
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.dueTodayItem, !last && styles.dueTodayItemBorder]}
    >
      <Avatar name={job.customerName} size={40} />
      <View style={styles.dueTodayContent}>
        <Text style={styles.dueTodayName}>{job.customerName}'s {job.outfitType}</Text>
        <Text style={styles.dueTodayTime}>Due today by 6:00 PM</Text>
      </View>
      <StatusBadge status={job.status} size="sm" />
      <ChevronRightIcon size={16} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
};

interface RecentJobCardProps {
  job: Job;
  onPress: () => void;
}

const OUTFIT_PLACEHOLDERS: Record<string, string> = {
  Agbada: '🫱',
  Senator: '👘',
  Suit: '🤵',
  Shirt: '👔',
  Trouser: '👖',
  Gown: '👗',
  Kaftan: '🧥',
  Skirt: '👗',
  Blouse: '👚',
  Other: '🪡',
};

const RecentJobCard: React.FC<RecentJobCardProps> = ({ job, onPress }) => {
  const config = JOB_STATUS_CONFIG[job.status];
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.recentCard}>
      {job.samplePhotoUri ? (
        <Image source={{ uri: job.samplePhotoUri }} style={styles.recentCardPhoto} />
      ) : (
        <View style={[styles.recentCardPhoto, styles.recentCardPlaceholder]}>
          <Text style={{ fontSize: 32 }}>{OUTFIT_PLACEHOLDERS[job.outfitType] || '🪡'}</Text>
        </View>
      )}
      <View style={styles.recentCardInfo}>
        <Text style={styles.recentCardName} numberOfLines={1}>
          {getFirstName(job.customerName)}'s {job.outfitType}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <View style={[styles.statusDot, { backgroundColor: config.color }]} />
          <Text style={[styles.recentCardStatus, { color: config.color }]}>{job.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  iconBtn: {
    position: 'relative',
    padding: Spacing.xs,
  },
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
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: Typography.bold,
  },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  greetingBlock: {
    marginBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  greetingTop: {
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    fontWeight: Typography.regular,
    lineHeight: 30,
  },
  greetingName: {
    fontSize: Typography.xxl,
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
    lineHeight: 36,
  },
  greetingSubtext: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    ...Shadow.sm,
  },
  actionCardIcon: {
    marginBottom: Spacing.sm,
  },
  actionCardLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 18,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  listCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    alignItems: 'center',
    ...Shadow.sm,
  },
  emptyCardText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  dueTodayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  dueTodayItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dueTodayContent: {
    flex: 1,
  },
  dueTodayName: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  dueTodayTime: {
    fontSize: Typography.xs,
    color: Colors.overdue,
    fontWeight: Typography.medium,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: Radius.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  statCount: {
    flex: 1,
    fontSize: Typography.md,
    fontWeight: Typography.bold,
  },
  recentCard: {
    width: 130,
    marginRight: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  recentCardPhoto: {
    width: '100%',
    height: 110,
    resizeMode: 'cover',
  },
  recentCardPlaceholder: {
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentCardInfo: {
    padding: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  recentCardName: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  recentCardStatus: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
  },
});

export default HomeScreen;
