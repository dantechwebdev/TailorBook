import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Switch,
} from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Typography, Spacing, Radius } from '../../constants/theme';
import {
  HomeIcon, AccountIcon, SubscriptionIcon, HelpIcon,
  ReportsIcon, NotepadIcon, SparkleIcon, Logo,
} from '../common/Icons';
import { useStore } from '../../context/store';
import { useTheme } from '../../context/ThemeContext';
import { getInitials, getAvatarColor } from '../../utils/helpers';

const DrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { navigation, state } = props;
  const { unreadNotificationCount, overdueJobs, dueToday, settings } = useStore();
  const { colors: C, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  const shopName   = settings?.shopName   || 'My Shop';
  const tailorName = settings?.tailorName || 'Tailor';
  const photoUri   = settings?.profilePhotoUri || '';

  // Improvement #11 — jobs needing attention shown in drawer header
  const attentionCount = (overdueJobs?.length ?? 0) + (dueToday?.length ?? 0);

  const navItems = [
    { key: 'MainTabs',          label: 'Dashboard',    Icon: HomeIcon },
    { key: 'FinancialsScreen',  label: 'Financials',   Icon: ReportsIcon },
    { key: 'ScratchPadScreen',  label: 'Scratch Pad',  Icon: NotepadIcon },
    { key: 'TailorStudioScreen',label: 'TailorStudio', Icon: SparkleIcon, badge: 'SOON' },
    { key: 'AccountScreen',     label: 'Account',      Icon: AccountIcon },
    { key: 'SubscriptionScreen',label: 'Subscription', Icon: SubscriptionIcon },
    { key: 'HelpScreen',        label: 'Help',         Icon: HelpIcon },
  ];

  const currentRoute = state.routeNames[state.index];

  return (
    <View style={styles.container}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Logo size={22} variant="white" />
          <Text style={styles.brandText}>TailorBook</Text>
        </View>
        <View style={styles.headerDivider} />
        <View style={styles.avatarWrap}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarPhoto} resizeMode="cover" />
          ) : (
            <DrawerAvatar name={shopName} size={44} C={C} />
          )}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.shopName} numberOfLines={1}>{shopName}</Text>
          {attentionCount > 0 ? (
            <Text style={styles.attentionText}>
              {attentionCount} job{attentionCount !== 1 ? 's' : ''} need attention
            </Text>
          ) : (
            <Text style={styles.shopRole}>{tailorName}</Text>
          )}
        </View>
      </View>

      {/* ─── Nav Items ─── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.navList}>
        {navItems.map(({ key, label, Icon, badge }) => {
          const isActive = currentRoute === key;
          const iconColor = isActive ? C.primaryLight : C.drawerTextMuted;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => navigation.navigate(key)}
              activeOpacity={0.8}
              style={[styles.navItem, isActive && styles.navItemActive]}
            >
              <Icon size={20} color={iconColor} />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{label}</Text>
              {badge && (
                <View style={styles.navBadgeOutline}>
                  <Text style={styles.navBadgeOutlineText}>{badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ─── Footer ─── */}
      <View style={styles.footer}>
        <View style={styles.themeRow}>
          <Text style={styles.themeLabel}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#3A3568', true: C.primaryLight }}
            thumbColor={C.white}
          />
        </View>
        <Text style={styles.footerText}>TailorBook v1.0.0</Text>
        <Text style={styles.footerSub}>Your digital workshop companion</Text>
      </View>
    </View>
  );
};

const DrawerAvatar: React.FC<{ name: string; size: number; C: any }> = ({ name, size, C }) => {
  const initials = getInitials(name);
  const bg = getAvatarColor(name);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: C.white, fontSize: size * 0.36, fontWeight: Typography.bold }}>{initials}</Text>
    </View>
  );
};

function makeStyles(C: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.drawerBg },
    header: {
      paddingTop: 60, paddingBottom: Spacing.xl, paddingHorizontal: Spacing.base,
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      borderBottomWidth: 1, borderBottomColor: '#FFFFFF15',
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    brandText: { color: '#FFF', fontSize: Typography.base, fontWeight: Typography.bold, letterSpacing: 0.5 },
    headerDivider: { width: 1, height: 32, backgroundColor: '#FFFFFF20', marginHorizontal: 4 },
    avatarWrap: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
    avatarPhoto: { width: 44, height: 44 },
    headerText: { flex: 1 },
    shopName: { color: C.drawerText, fontSize: Typography.md, fontWeight: Typography.bold },
    shopRole: { color: C.drawerTextMuted, fontSize: Typography.sm, marginTop: 2 },
    attentionText: { color: '#FFB347', fontSize: Typography.xs, fontWeight: Typography.semibold, marginTop: 2 },
    navList: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.md },
    navItem: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: 13,
      paddingHorizontal: Spacing.md, borderRadius: Radius.md, marginBottom: 2, gap: Spacing.md,
    },
    navItemActive: { backgroundColor: C.drawerActive },
    navLabel: { flex: 1, fontSize: Typography.base, color: C.drawerTextMuted, fontWeight: Typography.medium },
    navLabelActive: { color: C.drawerText, fontWeight: Typography.semibold },
    navBadgeOutline: { borderWidth: 1, borderColor: C.primaryLight, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 1 },
    navBadgeOutlineText: { color: C.primaryLight, fontSize: 10, fontWeight: Typography.bold },
    themeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
    themeLabel: { color: C.drawerText, fontSize: Typography.base, fontWeight: Typography.medium },
    footer: { padding: Spacing.base, borderTopWidth: 1, borderTopColor: '#FFFFFF10', paddingBottom: 32 },
    footerText: { color: C.drawerTextMuted, fontSize: Typography.xs, fontWeight: Typography.medium },
    footerSub: { color: '#FFFFFF30', fontSize: 10, marginTop: 2 },
  });
}

export default DrawerContent;
