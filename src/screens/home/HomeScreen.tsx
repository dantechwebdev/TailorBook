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
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  AgbadaIcon, BlouseIcon, GownIcon, KaftanIcon, OtherIcon,
  SenatorIcon, ShirtIcon, SkirtIcon, SuitIcon, TrouserIcon,
  IconProps,
} from '../../../assets/icons/custom';
import { useStore } from '../../context/store';
import { Typography, Spacing, Radius, Shadow, getJobStatusConfig } from '../../constants/theme';
import { MenuIcon, NotificationsIcon, ChevronRightIcon } from '../../components/common/Icons';
import { getFirstName, formatNaira } from '../../utils/helpers';
import { Job } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import FloatingAssistant from '../../components/ai/FloatingAssistant';
import CloudStatusCard from '../../components/home/CloudStatusCard';
import { useAuth } from '../../context/AuthContext';
import {
  useEntrance, useSpringScale, useBellShake, useFloatLoop, useShimmerPress, useFadeIn,
} from '../../utils/animations';

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
    dueToday, overdueJobs, readyJobs, recentJobs,
    pendingWaybills, outstandingBalances, unreadNotificationCount,
    settings, initialize, refreshJobs, loadSettings,
  } = useStore();
  const { colors: Colors, isDark } = useTheme();
  const { authState, syncState, syncNow } = useAuth();

  // ── Entrance animations ──────────────────────────────────────────────────
  const greetingAnim  = useEntrance(0,   8);   // greeting block fades + rises first
  const cloudAnim     = useEntrance(80,  6);   // cloud card follows
  const tasksAnim     = useEntrance(160, 6);   // tasks section last
  const recentAnim    = useFadeIn(240, 300);   // recent jobs fade in softly
  const fabSpring     = useSpringScale(0.78, 1, 300); // FAB springs in
  const bell          = useBellShake(unreadNotificationCount > 0); // bell shakes once

  const styles = useMemo(() => StyleSheet.create({
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
    greetingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    greetingText: { flex: 1, marginRight: Spacing.md },
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
    greetingPhoto: {
      width: 52, height: 52, borderRadius: 26,
      borderWidth: 2,
      borderColor: Colors.primary + '30',
    },
    greetingAvatarPlaceholder: {
      width: 52, height: 52,
      alignItems: 'center', justifyContent: 'center',
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
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
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
    },

    recentJobsScroll: {
      paddingLeft: Spacing.base,
      paddingRight: Spacing.sm,
      gap: Spacing.md,
    },
    recentCard: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.xl,
      overflow: 'hidden',
      ...Shadow.md,
    },
    recentCardMedia: {
      height: CARD_WIDTH * 0.72,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    recentCardImage: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    },
    recentStatusBadge: {
      position: 'absolute', top: Spacing.sm, right: Spacing.sm,
      paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: Radius.full,
    },
    recentStatusText: { color: Colors.white, fontSize: 11, fontWeight: Typography.bold },
    photoCountBadge: {
      position: 'absolute', bottom: Spacing.sm, right: Spacing.sm,
      flexDirection: 'row', alignItems: 'center', gap: 3,
      backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: Radius.full,
      paddingHorizontal: 7, paddingVertical: 3,
    },
    photoCountText: { color: Colors.white, fontSize: 11, fontWeight: Typography.bold },
    recentCardInfo: { padding: Spacing.md },
    recentCardName: {
      fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary,
    },
    recentCardType: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
    recentCardBalance: {
      fontSize: Typography.xs, color: Colors.overdue, fontWeight: Typography.semibold, marginTop: 4,
    },

    compactRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingRight: Spacing.md,
    },
    compactRowMain: {
      flex: 1, flexDirection: 'row', alignItems: 'center',
      padding: Spacing.md, gap: Spacing.md,
    },
    compactRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    compactDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
    compactInfo: { flex: 1 },
    compactLabel: { fontSize: Typography.base, fontWeight: Typography.medium, color: Colors.textPrimary },
    compactSub: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
    balanceTotalText: {
      fontSize: Typography.sm, color: Colors.overdue, fontWeight: Typography.bold,
    },
    balanceAmount: {
      fontSize: Typography.sm, color: Colors.overdue, fontWeight: Typography.bold,
    },
    balanceWaBtn: {
      width: 36, height: 36, borderRadius: 18,
      // WhatsApp-tinted pill — adapts light/dark, brand green (#25D366) stays fixed
      backgroundColor: isDark ? '#123321' : '#E8FFF1',
      alignItems: 'center', justifyContent: 'center',
      marginLeft: Spacing.sm,
    },

    // Improvement #6 — WhatsApp Digest: branded green pill icon, stronger identity.
    // Background/border/text tints adapt per theme; #25D366 is the fixed WhatsApp brand color.
    digestCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#0F2A1C' : '#F0FFF7',
      borderWidth: 1.5,
      borderColor: '#25D36640',
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      marginHorizontal: Spacing.base,
      marginBottom: Spacing.xl,
      gap: Spacing.md,
      // Subtle green shadow — brand color, theme-independent
      shadowColor: '#25D366',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 3,
    },
    digestIconWrap: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: '#25D366', // fixed WhatsApp brand green
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    digestLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    digestTitle: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: isDark ? '#6FE39B' : '#1a7a3f',
    },
    digestSub: {
      fontSize: Typography.xs,
      color: isDark ? '#6FE39B99' : '#1a7a3f99',
      marginTop: 2,
      lineHeight: 16,
    },

    quickRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.base,
      marginBottom: Spacing.xl,
    },
    quickBtn: {
      flex: 1,
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      alignItems: 'center',
      ...Shadow.sm,
    },
    quickBtnEmoji: { fontSize: 20, marginBottom: 4 },  // #14
    quickBtnLabel: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
      marginBottom: 2,
    },
    quickBtnSub: { fontSize: Typography.xs, color: Colors.textTertiary },

    // Improvement #5 — persistent floating action button
    fab: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.primary,
      borderRadius: Radius.full,
      paddingVertical: 14,
      paddingHorizontal: Spacing.xl,
      gap: Spacing.sm,
      shadowColor: Colors.primaryDark,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 10,
    },
    fabWrap: {
      position: 'absolute',
      bottom: 80,
      alignSelf: 'center',
    },
    fabPlus: {
      fontSize: 22,
      fontWeight: Typography.extrabold,
      color: Colors.white,
      lineHeight: 24,
    },
    fabLabel: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: Colors.white,
      letterSpacing: 0.3,
    },
  }), [Colors, isDark]);

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

  const tailorFirstName = (settings?.tailorName || 'Tailor').split(' ')[0];
  const photoUri = settings?.profilePhotoUri || '';
  const today = new Date().toLocaleDateString('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const goToJob = (jobId: string) =>
    navigation.navigate('JobsStack', { screen: 'JobDetail', params: { jobId } });

  const handleSendDigest = useCallback(() => {
    const phone = settings?.phone || '';
    if (!phone) {
      Alert.alert('Phone not set', 'Add your phone number in Account settings to send yourself the daily digest.');
      return;
    }
    const currency = settings?.currency || '₦';
    const dateStr = new Date().toLocaleDateString('en-NG', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
    const msPerDay = 1000 * 60 * 60 * 24;
    const lines: string[] = [];
    lines.push(`📋 *TailorBook Daily Digest — ${dateStr}*\n`);

    if (overdueJobs.length > 0) {
      lines.push(`🚨 *OVERDUE (${overdueJobs.length}):*`);
      overdueJobs.forEach((j) => {
        const days = Math.max(0, Math.floor((Date.now() - new Date(j.deliveryDate).getTime()) / msPerDay));
        lines.push(`• ${j.customerName}'s ${j.outfitType} — ${days}d late`);
      });
      lines.push('');
    }

    if (dueToday.length > 0) {
      lines.push(`📅 *DUE TODAY (${dueToday.length}):*`);
      dueToday.forEach((j) => lines.push(`• ${j.customerName}'s ${j.outfitType} [${j.status}]`));
      lines.push('');
    }

    if (readyJobs.length > 0) {
      lines.push(`✅ *READY TO NOTIFY (${readyJobs.length}):*`);
      readyJobs.forEach((j) =>
        lines.push(`• ${j.customerName}'s ${j.outfitType} (${j.deliveryType === 'waybill' ? 'waybill' : 'pickup'})`)
      );
      lines.push('');
    }

    if (outstandingBalances.length > 0) {
      const total = outstandingBalances.reduce((sum, j) => sum + j.balance, 0);
      lines.push(`💰 *OUTSTANDING BALANCES (${outstandingBalances.length}):*`);
      outstandingBalances.forEach((j) =>
        lines.push(`• ${j.customerName} — ${currency}${j.balance.toLocaleString()}`)
      );
      lines.push(`Total owed: *${currency}${total.toLocaleString()}*`);
      lines.push('');
    }

    if (
      overdueJobs.length === 0 &&
      dueToday.length === 0 &&
      readyJobs.length === 0 &&
      outstandingBalances.length === 0
    ) {
      lines.push('🎉 All clear! No pending items today.');
      lines.push('');
    }

    lines.push('_Sent from TailorBook_');
    const text = lines.join('\n');
    const clean = phone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${clean}?text=${encodeURIComponent(text)}`).catch(() =>
      Alert.alert('Error', 'Could not open WhatsApp. Make sure it is installed.')
    );
  }, [overdueJobs, dueToday, readyJobs, outstandingBalances, settings]);

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
          <Animated.View style={bell.style}>
            <NotificationsIcon size={22} color={Colors.textPrimary} />
          </Animated.View>
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
        {/* ─── Greeting — fades + slides up on mount ─── */}
        <Animated.View style={[styles.greetingBlock, greetingAnim.style]}>
          <View style={styles.greetingRow}>
            <View style={styles.greetingText}>
              <Text style={styles.greetingName}>
                Hi, {tailorFirstName}
              </Text>
              <Text style={styles.greetingSubtext}>
                {tasks.length === 0
                  ? "You're all caught up. Great work!"
                  : `${tasks.length} thing${tasks.length === 1 ? '' : 's'} to handle today.`}
              </Text>
            </View>
            {photoUri ? (
              <TouchableOpacity
                onPress={() => navigation.navigate('AccountScreen')}
                activeOpacity={0.85}
              >
                <Image
                  source={{ uri: photoUri }}
                  style={styles.greetingPhoto}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => navigation.navigate('AccountScreen')}
                style={styles.greetingAvatarPlaceholder}
                activeOpacity={0.85}
              >
                <Ionicons name="person-circle-outline" size={44} color={Colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* ─── Cloud Status Card — follows greeting ─── */}
        <Animated.View style={cloudAnim.style}>
        <CloudStatusCard
          authState={authState}
          syncState={syncState}
          onSignIn={() => navigation.navigate('SignIn')}
          onSignUp={() => navigation.navigate('SignUp')}
          onManageCloud={() => navigation.navigate('AccountScreen')}
          onSyncNow={syncNow}
        />
        </Animated.View>

        {/* ─── Today's Tasks — staggered below cloud ─── */}
        <Animated.View style={tasksAnim.style}>
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
            <EmptyTaskCard Colors={Colors} styles={styles} onNewOrder={startNewOrder} />
          ) : (
            <View style={styles.taskList}>
              {tasks.map((task, idx) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isLast={idx === tasks.length - 1}
                  onPress={() => goToJob(task.job.id)}
                  styles={styles}
                  Colors={Colors}
                />
              ))}
            </View>
          )}
        </View>
        </Animated.View>

        {/* ─── Recent Jobs — fades in after tasks ─── */}
        {recentJobs.length > 0 && (
          <Animated.View style={[styles.section, recentAnim.style]}>
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
                  styles={styles}
                  Colors={Colors}
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* ─── Awaiting Dispatch ─── */}
        {pendingWaybills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="cube-outline" size={18} color={Colors.textPrimary} />
                <Text style={styles.sectionTitle}>Awaiting Dispatch</Text>
              </View>
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
                    styles.compactRowMain,
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
              <View style={styles.sectionTitleRow}>
                <Ionicons name="wallet-outline" size={18} color={Colors.textPrimary} />
                <Text style={styles.sectionTitle}>Outstanding Balances</Text>
              </View>
              <Text style={styles.balanceTotalText}>
                {formatNaira(
                  outstandingBalances.reduce((sum, j) => sum + j.balance, 0)
                )}
              </Text>
            </View>
            <View style={styles.taskList}>
              {outstandingBalances.map((job, idx) => {
                const phone = job.customerPhone || '';
                const canWhatsApp = !!phone;
                const handleBalanceWhatsApp = () => {
                  if (!canWhatsApp) { goToJob(job.id); return; }
                  const clean = phone.replace(/[\s\-()]/g, '').replace(/^0/, '234').replace(/^\+/, '');
                  const name = getFirstName(job.customerName);
                  const msg = encodeURIComponent(
                    `Hello ${name},\n\nThis is a gentle reminder that your balance of *${formatNaira(job.balance)}* is due for your *${job.outfitType}*.\nPlease make payment at your earliest convenience. Thank you! 🙏`
                  );
                  Linking.openURL(`https://wa.me/${clean}?text=${msg}`).catch(() => goToJob(job.id));
                };
                return (
                  <View
                    key={job.id}
                    style={[
                      styles.compactRow,
                      idx < outstandingBalances.length - 1 && styles.compactRowBorder,
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => goToJob(job.id)}
                      activeOpacity={0.8}
                      style={styles.compactRowMain}
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
                    <TouchableOpacity
                      onPress={handleBalanceWhatsApp}
                      style={styles.balanceWaBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── Improvement #6: WhatsApp Digest — stronger branding ─── */}
        <TouchableOpacity
          onPress={handleSendDigest}
          activeOpacity={0.85}
          style={styles.digestCard}
        >
          <View style={styles.digestIconWrap}>
            <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.digestTitle}>Send Daily Digest</Text>
            <Text style={styles.digestSub}>
              {(() => {
                const total =
                  overdueJobs.length +
                  dueToday.length +
                  readyJobs.length +
                  outstandingBalances.length;
                return total > 0
                  ? `${total} item${total > 1 ? 's' : ''} — WhatsApp today's summary to yourself`
                  : 'All clear today — send a status update to yourself';
              })()}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#25D366" />
        </TouchableOpacity>

        {/* ─── Quick Links — Improvement #14: add ScratchPad ─── */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => navigation.navigate('CustomersStack')}
            activeOpacity={0.85}
          >
            <Text style={styles.quickBtnEmoji}>👥</Text>
            <Text style={styles.quickBtnLabel}>Customers</Text>
            <Text style={styles.quickBtnSub}>Browse all</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => navigation.navigate('JobsStack', { screen: 'JobList' })}
            activeOpacity={0.85}
          >
            <Text style={styles.quickBtnEmoji}>💼</Text>
            <Text style={styles.quickBtnLabel}>All Jobs</Text>
            <Text style={styles.quickBtnSub}>Full list</Text>
          </TouchableOpacity>
          {/* Improvement #14 — ScratchPad promoted from drawer to home */}
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => navigation.navigate('ScratchPadScreen')}
            activeOpacity={0.85}
          >
            <Text style={styles.quickBtnEmoji}>📝</Text>
            <Text style={styles.quickBtnLabel}>Notes</Text>
            <Text style={styles.quickBtnSub}>Scratch pad</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Spacing.xxxl * 2 }} />
      </ScrollView>

      {/* Improvement #5 — Persistent FAB with spring entrance */}
      <Animated.View style={[styles.fabWrap, fabSpring.style]}>
        <TouchableOpacity
          onPress={startNewOrder}
          activeOpacity={0.88}
          style={styles.fab}
          accessibilityLabel="Start new order"
          accessibilityRole="button"
        >
          <Text style={styles.fabPlus}>+</Text>
          <Text style={styles.fabLabel}>New Order</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ─── Floating AI Assistant ─── */}
      <FloatingAssistant screen="Dashboard" />

    </SafeAreaView>
  );
};

// ─── RecentJobCard ─────────────────────────────────────────────────────────────

const OUTFIT_ICON_MAP: Record<string, React.FC<IconProps>> = {
  Agbada:  AgbadaIcon,
  Blouse:  BlouseIcon,
  Gown:    GownIcon,
  Kaftan:  KaftanIcon,
  Other:   OtherIcon,
  Senator: SenatorIcon,
  Shirt:   ShirtIcon,
  Skirt:   SkirtIcon,
  Suit:    SuitIcon,
  Trouser: TrouserIcon,
};

const RecentJobCard: React.FC<{ job: Job; onPress: () => void; styles: any; Colors: any }> = ({ job, onPress, styles, Colors }) => {
  const photos = useMemo(() => {
    if (!job.photoUris?.length) return [];
    if (job.photoUris.length === 1) return job.photoUris;
    return [...job.photoUris].sort(() => Math.random() - 0.5);
  }, []);

  const [photoIdx, setPhotoIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Physical press feel on recent job cards
  const { style: pressStyle, handlers } = useShimmerPress();

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

  // Recomputed from the live palette (Colors prop is theme-reactive via useTheme upstream)
  const cfg = getJobStatusConfig(Colors)[job.status as keyof ReturnType<typeof getJobStatusConfig>];
  const bgColor = cfg?.bgColor || Colors.surface;
  const OutfitIconCmp = OUTFIT_ICON_MAP[job.outfitType] ?? OtherIcon;

  return (
    <Animated.View style={[{ width: CARD_WIDTH }, pressStyle]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={1}
        {...handlers}
        style={styles.recentCard}
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
            <OutfitIconCmp size={48} color={Colors.textTertiary} />
          )}
          {/* Status badge */}
          <View style={[styles.recentStatusBadge, { backgroundColor: cfg?.color || Colors.primary }]}>
            <Text style={styles.recentStatusText}>{job.status}</Text>
          </View>
          {/* Photo count */}
          {photos.length > 1 && (
            <View style={styles.photoCountBadge}>
              <Ionicons name="camera" size={11} color={Colors.white} />
              <Text style={styles.photoCountText}>{photos.length}</Text>
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
    </Animated.View>
  );
};

// ─── TaskCard ─────────────────────────────────────────────────────────────────

const TaskCard: React.FC<{ task: Task; isLast: boolean; onPress: () => void; styles: any; Colors: any }> = ({
  task, isLast, onPress, styles, Colors,
}) => {
  const URGENCY_CONFIG = {
    critical: { border: Colors.overdue,  bg: Colors.overdueLight,  dot: Colors.overdue  },
    warning:  { border: Colors.dueSoon,  bg: Colors.dueSoonLight,  dot: Colors.dueSoon  },
    action:   { border: Colors.ready,    bg: Colors.readyLight,    dot: Colors.ready    },
    info:     { border: Colors.primary,  bg: Colors.primaryFaint,  dot: Colors.primary  },
  };
  const cfg = URGENCY_CONFIG[task.urgency];
  // Improvement — physical press feedback on every task card
  const { style: pressStyle, handlers } = useShimmerPress();

  return (
    <Animated.View style={pressStyle}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={1}
        {...handlers}
        style={[styles.taskCard, { borderLeftColor: cfg.border }, !isLast && styles.taskCardBorder]}
      >
        <View style={[styles.taskDot, { backgroundColor: cfg.dot }]} />
        <View style={styles.taskContent}>
          <Text style={styles.taskLabel}>{task.label}</Text>
          {task.subLabel && <Text style={styles.taskSubLabel}>{task.subLabel}</Text>}
        </View>
        <ChevronRightIcon size={16} color={Colors.textTertiary} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Empty task card — floating icon so it feels alive, not abandoned
const EmptyTaskCard: React.FC<{ Colors: any; styles: any; onNewOrder: () => void }> = ({
  Colors, styles, onNewOrder,
}) => {
  const floatAnim = useFloatLoop(4, 2600);
  return (
    <View style={styles.emptyTaskCard}>
      <Animated.View style={floatAnim.style}>
        <Ionicons
          name="checkmark-circle-outline"
          size={40}
          color={Colors.primary}
          style={{ marginBottom: Spacing.md }}
        />
      </Animated.View>
      <Text style={styles.emptyTaskTitle}>Nothing urgent today</Text>
      <Text style={styles.emptyTaskSubtext}>
        All jobs are on track. Start a new order when ready.
      </Text>
    </View>
  );
};

export default HomeScreen;
