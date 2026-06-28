import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import {
  HomeIcon,
  CustomersIcon,
  JobsIcon,
  NotificationsIcon,
  ClockIcon,
  AccountIcon,
  SubscriptionIcon,
  HelpIcon,
  LogoutIcon,
  ScissorsIcon,
} from '../common/Icons';
import { useStore } from '../../context/store';

// ─── Drawer Content ───────────────────────────────────────────────────────────

const DrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { navigation, state } = props;
  const { unreadNotificationCount, settings } = useStore();

  const currentRoute = state.routeNames[state.index];

  const shopName = settings?.shopName || 'My Shop';
  const tailorName = settings?.tailorName || 'Tailor';

  const navItems = [
    {
      key: 'HomeTab',
      label: 'Home',
      icon: (active: boolean) => (
        <HomeIcon size={20} color={active ? Colors.primaryLight : Colors.drawerTextMuted} />
      ),
    },
    {
      key: 'CustomersStack',
      label: 'Customers',
      icon: (active: boolean) => (
        <CustomersIcon size={20} color={active ? Colors.primaryLight : Colors.drawerTextMuted} />
      ),
    },
    {
      key: 'JobsStack',
      label: 'Jobs',
      icon: (active: boolean) => (
        <JobsIcon size={20} color={active ? Colors.primaryLight : Colors.drawerTextMuted} />
      ),
    },
    {
      key: 'ScheduleScreen',
      label: 'Schedule',
      icon: (active: boolean) => (
        <ClockIcon size={20} color={active ? Colors.primaryLight : Colors.drawerTextMuted} />
      ),
    },
    {
      key: 'NotificationsScreen',
      label: 'Notifications',
      badge: unreadNotificationCount,
      icon: (active: boolean) => (
        <NotificationsIcon size={20} color={active ? Colors.primaryLight : Colors.drawerTextMuted} />
      ),
    },
    {
      key: 'AccountScreen',
      label: 'Account',
      icon: (active: boolean) => (
        <AccountIcon size={20} color={active ? Colors.primaryLight : Colors.drawerTextMuted} />
      ),
    },
    {
      key: 'SubscriptionScreen',
      label: 'Subscription',
      icon: (active: boolean) => (
        <SubscriptionIcon size={20} color={active ? Colors.primaryLight : Colors.drawerTextMuted} />
      ),
    },
    {
      key: 'HelpScreen',
      label: 'Help & Support',
      icon: (active: boolean) => (
        <HelpIcon size={20} color={active ? Colors.primaryLight : Colors.drawerTextMuted} />
      ),
    },
  ];

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => {} },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* ─── Profile Header ─── */}
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <ScissorsIcon size={28} color={Colors.white} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.shopName} numberOfLines={1}>
            {shopName}
          </Text>
          <Text style={styles.shopRole} numberOfLines={1}>
            {tailorName}
          </Text>
        </View>
      </View>

      {/* ─── Navigation Items ─── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.navList}>
        {navItems.map((item) => {
          const isActive = currentRoute === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => navigation.navigate(item.key)}
              activeOpacity={0.8}
              style={[styles.navItem, isActive && styles.navItemActive]}
            >
              {item.icon(isActive)}
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
              {item.badge ? (
                <View style={styles.navBadge}>
                  <Text style={styles.navBadgeText}>{item.badge}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}

        <View style={styles.divider} />

        <TouchableOpacity onPress={handleLogout} activeOpacity={0.8} style={styles.navItem}>
          <LogoutIcon size={20} color="#FF6B6B" />
          <Text style={[styles.navLabel, { color: '#FF6B6B' }]}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ─── Footer ─── */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>TailorBook v1.0</Text>
        <Text style={styles.footerSub}>Your digital workshop assistant</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.drawerBg },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF15',
  },
  avatarWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerText: { flex: 1 },
  shopName: { color: Colors.drawerText, fontSize: Typography.md, fontWeight: Typography.bold },
  shopRole: { color: Colors.drawerTextMuted, fontSize: Typography.sm, marginTop: 2 },
  navList: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.md },
  navItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: Spacing.md,
    borderRadius: Radius.md, marginBottom: 2, gap: Spacing.md,
  },
  navItemActive: { backgroundColor: Colors.drawerActive },
  navLabel: { flex: 1, fontSize: Typography.base, color: Colors.drawerTextMuted, fontWeight: Typography.medium },
  navLabelActive: { color: Colors.drawerText, fontWeight: Typography.semibold },
  navBadge: {
    backgroundColor: Colors.overdue, minWidth: 20, height: 20,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  navBadgeText: { color: Colors.white, fontSize: 11, fontWeight: Typography.bold },
  divider: { height: 1, backgroundColor: '#FFFFFF15', marginVertical: Spacing.md },
  footer: { padding: Spacing.base, borderTopWidth: 1, borderTopColor: '#FFFFFF10', paddingBottom: 32 },
  footerText: { color: Colors.drawerTextMuted, fontSize: Typography.xs, fontWeight: Typography.medium },
  footerSub: { color: '#FFFFFF30', fontSize: 10, marginTop: 2 },
});

export default DrawerContent;
