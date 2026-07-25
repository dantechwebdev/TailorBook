/**
 * NotificationsScreen — Improvement #9
 * Compact card design: 2 lines per notification (was 3-4).
 * Notification icon + title + message + time all fit without scrolling.
 * 3× more notifications visible at a time.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useStore } from '../../context/store';
import { Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import {
  NotificationsIcon, MenuIcon, CheckIcon, AlertCircleIcon, ClockIcon,
} from '../../components/common/Icons';
import { EmptyState } from '../../components/common/UI';
import { AppNotification, NotificationType } from '../../types';
import { formatDateTime } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';
import { useEntrance, useFloatLoop } from '../../utils/animations';

const TABS = ['All', 'Jobs', 'System'] as const;
type Tab = typeof TABS[number];

// Icon + bg colour per notification type
function notifMeta(type: NotificationType, C: any): { icon: React.ReactNode; bg: string; accent: string } {
  switch (type) {
    case 'overdue':    return { icon: <ClockIcon size={14} color={C.overdue} />,        bg: C.overdueLight,  accent: C.overdue  };
    case 'due_today':  return { icon: <AlertCircleIcon size={14} color={C.overdue} />,  bg: C.overdueLight,  accent: C.overdue  };
    case 'due_soon':   return { icon: <NotificationsIcon size={14} color={C.dueSoon} />,bg: C.dueSoonLight,  accent: C.dueSoon  };
    case 'completed':
    case 'payment':    return { icon: <CheckIcon size={14} color={C.ready} />,          bg: C.readyLight,    accent: C.ready    };
    default:           return { icon: <NotificationsIcon size={14} color={C.primary} />,bg: C.primaryFaint, accent: C.primary  };
  }
}

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { notifications, markNotificationRead, markAllRead } = useStore();
  const { colors: C } = useTheme();
  const [tab, setTab] = useState<Tab>('All');
  const styles = useMemo(() => makeStyles(C), [C]);

  // Entrance animations
  const headerAnim = useEntrance(0, 5);
  const listAnim   = useEntrance(80, 8);

  const filtered = useMemo(() => {
    if (!notifications) return [];
    if (tab === 'Jobs')   return notifications.filter(n => n.type !== 'system');
    if (tab === 'System') return notifications.filter(n => n.type === 'system');
    return notifications;
  }, [notifications, tab]);

  const unreadCount = useMemo(
    () => filtered.filter(n => !n.read).length,
    [filtered]
  );

  const handlePress = useCallback(async (n: AppNotification) => {
    if (!n.read) await markNotificationRead(n.id);
    if (n.jobId) navigation.navigate('JobsStack', { screen: 'JobDetail', params: { jobId: n.jobId } });
  }, [markNotificationRead, navigation]);

  const renderItem = useCallback(({ item }: { item: AppNotification }) => {
    const meta = notifMeta(item.type, C);
    return (
      <TouchableOpacity
        onPress={() => handlePress(item)}
        activeOpacity={0.8}
        style={[styles.card, !item.read && styles.cardUnread]}
      >
        {/* Left accent indicator */}
        {!item.read && <View style={[styles.unreadBar, { backgroundColor: meta.accent }]} />}

        {/* Icon pill */}
        <View style={[styles.iconPill, { backgroundColor: meta.bg }]}>
          {meta.icon}
        </View>

        {/* Content — compact 2-line layout */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, !item.read && { color: C.textPrimary, fontWeight: Typography.bold }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.time}>{formatDateTime(item.createdAt)}</Text>
          </View>
          <Text style={styles.message} numberOfLines={1}>{item.message}</Text>
        </View>

        {/* Unread dot */}
        {!item.read && <View style={[styles.dot, { backgroundColor: meta.accent }]} />}
      </TouchableOpacity>
    );
  }, [C, styles, handlePress]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header + tabs fade in on mount */}
      <Animated.View style={headerAnim.style}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
            <MenuIcon size={22} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
              <Text style={styles.markAll}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.tabs}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t} onPress={() => setTab(t)} activeOpacity={0.8}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* List fades in 80ms after header */}
      <Animated.View style={[{ flex: 1 }, listAnim.style]}>
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          ListEmptyComponent={<AnimatedEmptyNotif C={C} styles={styles} />}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

function makeStyles(C: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
    headerTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: C.textPrimary },
    markAll: { fontSize: Typography.sm, color: C.primary, fontWeight: Typography.semibold },
    tabs: { flexDirection: 'row', paddingHorizontal: Spacing.base, marginBottom: Spacing.md, gap: Spacing.sm },
    tabBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.full, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },
    tabBtnActive: { backgroundColor: C.primaryFaint, borderColor: C.primary },
    tabText: { fontSize: Typography.sm, color: C.textSecondary, fontWeight: Typography.medium },
    tabTextActive: { color: C.primary, fontWeight: Typography.semibold },
    list: { paddingHorizontal: Spacing.base, paddingBottom: 120, flexGrow: 1 },
    // Compact card — improvement #9
    card: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.surface, borderRadius: Radius.lg,
      paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
      gap: Spacing.sm, ...Shadow.sm, overflow: 'hidden',
    },
    cardUnread: { backgroundColor: C.white },
    unreadBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
    iconPill: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    content: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
    title: { flex: 1, fontSize: Typography.sm, color: C.textSecondary, fontWeight: Typography.medium },
    time: { fontSize: 10, color: C.textTertiary, flexShrink: 0 },
    message: { fontSize: Typography.xs, color: C.textSecondary, marginTop: 2 },
    dot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  });
}

// ─── Animated empty state — icon floats gently ───────────────────────────────
const AnimatedEmptyNotif: React.FC<{ C: any; styles: any }> = ({ C, styles }) => {
  const floatAnim = useFloatLoop(5, 2800);
  return (
    <View style={{ alignItems: 'center', paddingVertical: Spacing.xxxl, paddingHorizontal: Spacing.xl }}>
      <Animated.View style={[floatAnim.style, { marginBottom: Spacing.lg }]}>
        <NotificationsIcon size={44} color={C.primary} />
      </Animated.View>
      <Text style={{ fontSize: Typography.lg, fontWeight: Typography.bold, color: C.textPrimary, textAlign: 'center', marginBottom: Spacing.sm }}>
        You're all caught up
      </Text>
      <Text style={{ fontSize: Typography.sm, color: C.textSecondary, textAlign: 'center', lineHeight: 20 }}>
        Reminders about upcoming and overdue jobs will appear here automatically.
      </Text>
    </View>
  );
};

export default NotificationsScreen;
