import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useStore } from '../../context/store';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { NotificationsIcon, CheckIcon, AlertCircleIcon, JobsIcon, ClockIcon, MenuIcon } from '../../components/common/Icons';
import { EmptyState } from '../../components/common/UI';
import { AppNotification, NotificationType } from '../../types';
import { formatDateTime } from '../../utils/helpers';

const TABS = ['All', 'Jobs', 'System'] as const;
type Tab = typeof TABS[number];

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { notifications, markNotificationRead, markAllRead } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('All');

  const filtered = notifications.filter((n) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Jobs') return n.type !== 'system';
    return n.type === 'system';
  });

  const unreadCount = filtered.filter((n) => !n.read).length;

  const handlePress = async (notification: AppNotification) => {
    if (!notification.read) await markNotificationRead(notification.id);
    if (notification.jobId) {
      navigation.navigate('JobsStack', {
        screen: 'JobDetail',
        params: { jobId: notification.jobId },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MenuIcon size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 70 }} />
        )}
      </View>

      {/* ─── Tabs ─── */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <NotificationItem notification={item} onPress={() => handlePress(item)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          <EmptyState
            icon={<NotificationsIcon size={32} color={Colors.primary} />}
            title="No notifications"
            subtitle="You're all caught up! Notifications about upcoming jobs will appear here."
          />
        }
      />
    </SafeAreaView>
  );
};

const NOTIF_ICONS: Record<NotificationType, React.ReactNode> = {
  overdue: <ClockIcon size={18} color={Colors.overdue} />,
  due_today: <AlertCircleIcon size={18} color={Colors.overdue} />,
  due_soon: <NotificationsIcon size={18} color={Colors.dueSoon} />,
  completed: <CheckIcon size={18} color={Colors.ready} />,
  payment: <CheckIcon size={18} color={Colors.ready} />,
  system: <NotificationsIcon size={18} color={Colors.primary} />,
};

const NOTIF_BG: Record<NotificationType, string> = {
  overdue: Colors.overdueLight,
  due_today: Colors.overdueLight,
  due_soon: Colors.dueSoonLight,
  completed: Colors.readyLight,
  payment: Colors.readyLight,
  system: Colors.primaryFaint,
};

const NotificationItem: React.FC<{
  notification: AppNotification;
  onPress: () => void;
}> = ({ notification, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[styles.notifCard, !notification.read && styles.notifCardUnread]}
  >
    <View style={[styles.notifIcon, { backgroundColor: NOTIF_BG[notification.type] }]}>
      {NOTIF_ICONS[notification.type]}
    </View>
    <View style={styles.notifContent}>
      <Text style={[styles.notifTitle, !notification.read && { color: Colors.textPrimary }]}>
        {notification.title}
      </Text>
      <Text style={styles.notifMessage} numberOfLines={2}>{notification.message}</Text>
      <Text style={styles.notifTime}>{formatDateTime(notification.createdAt)}</Text>
    </View>
    {!notification.read && <View style={styles.unreadDot} />}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
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
  markAllText: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primaryFaint,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  list: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxxl,
    flexGrow: 1,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  notifCardUnread: {
    backgroundColor: Colors.white,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifContent: { flex: 1, gap: 3 },
  notifTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  notifMessage: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  notifTime: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 4,
    flexShrink: 0,
  },
});

export default NotificationsScreen;
