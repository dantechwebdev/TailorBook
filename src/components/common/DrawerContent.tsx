import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Typography, Spacing, Radius } from '../../constants/theme';
import {
  HomeIcon,
  CustomersIcon,
  JobsIcon,
  NotificationsIcon,
  ClockIcon,
  AccountIcon,
  SubscriptionIcon,
  HelpIcon,
  ReportsIcon,
  NotepadIcon,
  SettingsIcon,
} from '../common/Icons';
import { useStore } from '../../context/store';
import { useTheme } from '../../context/ThemeContext';
import { getInitials, getAvatarColor } from '../../utils/helpers';

// ─── Drawer Content ───────────────────────────────────────────────────────────

const DrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { navigation, state } = props;
  const { unreadNotificationCount, settings } = useStore();
  const { colors } = useTheme();

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const currentRoute = state.routeNames[state.index];

  const shopName   = settings?.shopName   || 'My Shop';
  const tailorName = settings?.tailorName || 'Tailor';
  const photoUri   = settings?.profilePhotoUri || '';

  const navItems = [
    {
      key: 'HomeTab',
      label: 'Home',
      icon: (active: boolean) => (
        <HomeIcon size={20} color={active ? colors.primaryLight : colors.drawerTextMuted} />
      ),
    },
    {
      key: 'CustomersStack',
      label: 'Customers',
      icon: (active: boolean) => (
        <CustomersIcon size={20} color={active ? colors.primaryLight : colors.drawerTextMuted} />
      ),
    },
    {
      key: 'JobsStack',
      label: 'Jobs',
      icon: (active: boolean) => (
        <JobsIcon size={20} color={active ? colors.primaryLight : colors.drawerTextMuted} />
      ),
    },
    {
      key: 'ScheduleScreen',
      label: 'Schedule',
      icon: (active: boolean) => (
        <ClockIcon size={20} color={active ? colors.primaryLight : colors.drawerTextMuted} />
      ),
    },
    {
      key: 'FinancialsScreen',
      label: 'Financials',
      icon: (active: boolean) => (
        <ReportsIcon size={20} color={active ? colors.primaryLight : colors.drawerTextMuted} />
      ),
    },
    {
      key: 'ScratchPadScreen',
      label: 'Scratch Pad',
      icon: (active: boolean) => (
        <NotepadIcon size={20} color={active ? colors.primaryLight : colors.drawerTextMuted} />
      ),
    },
    {
      key: 'NotificationsScreen',
      label: 'Notifications',
      badge: unreadNotificationCount,
      icon: (active: boolean) => (
        <NotificationsIcon size={20} color={active ? colors.primaryLight : colors.drawerTextMuted} />
      ),
    },
    {
      key: 'AccountScreen',
      label: 'Account',
      icon: (active: boolean) => (
        <AccountIcon size={20} color={active ? colors.primaryLight : colors.drawerTextMuted} />
      ),
    },
    {
      key: 'SettingsScreen',
      label: 'Settings',
      icon: (active: boolean) => (
        <SettingsIcon size={20} color={active ? colors.primaryLight : colors.drawerTextMuted} />
      ),
    },
    {
      key: 'SubscriptionScreen',
      label: 'Subscription',
      icon: (active: boolean) => (
        <SubscriptionIcon size={20} color={active ? colors.primaryLight : colors.drawerTextMuted} />
      ),
    },
    {
      key: 'HelpScreen',
      label: 'Help & Support',
      icon: (active: boolean) => (
        <HelpIcon size={20} color={active ? colors.primaryLight : colors.drawerTextMuted} />
      ),
    },
  ];

  return (
    <View style={styles.container}>
      {/* ─── Profile Header ─── */}
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={styles.avatarPhoto}
              resizeMode="cover"
              accessibilityLabel={`${shopName} profile photo`}
            />
          ) : (
            <DrawerAvatar name={shopName} size={52} colors={colors} />
          )}
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
              accessibilityLabel={item.label}
              accessibilityRole="menuitem"
              accessibilityState={{ selected: isActive }}
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
      </ScrollView>

      {/* ─── Footer ─── */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>TailorBook v1.0.0</Text>
        <Text style={styles.footerSub}>Your digital workshop companion</Text>
      </View>
    </View>
  );
};

// ─── Drawer Avatar (initials fallback) ────────────────────────────────────────

const DrawerAvatar: React.FC<{ name: string; size: number; colors: any }> = ({ name, size, colors }) => {
  const initials = getInitials(name);
  const bgColor  = getAvatarColor(name);
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: bgColor,
        alignItems: 'center', justifyContent: 'center',
      }}
      accessibilityLabel={`${name} avatar`}
    >
      <Text style={{ color: colors.white, fontSize: size * 0.36, fontWeight: Typography.bold }}>
        {initials}
      </Text>
    </View>
  );
};

// ─── Styles (always dark — drawer stays dark in both themes) ──────────────────

function makeStyles(C: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.drawerBg },
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
      overflow: 'hidden',
      backgroundColor: C.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarPhoto: { width: 52, height: 52 },
    headerText: { flex: 1 },
    shopName: { color: C.drawerText, fontSize: Typography.md, fontWeight: Typography.bold },
    shopRole: { color: C.drawerTextMuted, fontSize: Typography.sm, marginTop: 2 },
    navList: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.md },
    navItem: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 13, paddingHorizontal: Spacing.md,
      borderRadius: Radius.md, marginBottom: 2, gap: Spacing.md,
    },
    navItemActive: { backgroundColor: C.drawerActive },
    navLabel: { flex: 1, fontSize: Typography.base, color: C.drawerTextMuted, fontWeight: Typography.medium },
    navLabelActive: { color: C.drawerText, fontWeight: Typography.semibold },
    navBadge: {
      backgroundColor: '#E8443A', minWidth: 20, height: 20,
      borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
    },
    navBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: Typography.bold },
    footer: {
      padding: Spacing.base,
      borderTopWidth: 1,
      borderTopColor: '#FFFFFF10',
      paddingBottom: 32,
    },
    footerText: { color: C.drawerTextMuted, fontSize: Typography.xs, fontWeight: Typography.medium },
    footerSub: { color: '#FFFFFF30', fontSize: 10, marginTop: 2 },
  });
}

export default DrawerContent;
