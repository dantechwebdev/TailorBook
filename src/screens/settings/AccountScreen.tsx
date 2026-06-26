import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { AccountIcon, NotificationsIcon, HelpIcon, LogoutIcon, SubscriptionIcon } from '../common/Icons';
import { Avatar, Card, Divider } from '../common/UI';
import { useStore } from '../../context/store';

const AccountScreen: React.FC = () => {
  const { jobs, customers } = useStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => {} },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ─── Profile ─── */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Avatar name="Tunde Stitches" size={60} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Tunde Stitches</Text>
              <Text style={styles.profileRole}>Independent Tailor</Text>
              <Text style={styles.profileLocation}>Lagos, Nigeria</Text>
            </View>
          </View>
          <Divider style={{ marginVertical: Spacing.md }} />
          <View style={styles.statsRow}>
            <StatItem label="Customers" value={String(customers.length)} />
            <View style={styles.statDivider} />
            <StatItem label="Total Jobs" value={String(jobs.length)} />
            <View style={styles.statDivider} />
            <StatItem
              label="Delivered"
              value={String(jobs.filter((j) => j.status === 'Delivered').length)}
            />
          </View>
        </Card>

        {/* ─── Settings Sections ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Preferences</Text>
          <Card padding={0}>
            <SettingRow
              label="Job Reminders"
              subtitle="Get notified about upcoming jobs"
              right={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                  thumbColor={Colors.white}
                />
              }
            />
            <Divider />
            <SettingRow
              label="Currency"
              subtitle="Nigerian Naira (₦)"
              onPress={() => {}}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Subscription</Text>
          <Card>
            <View style={styles.planRow}>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>FREE</Text>
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={styles.planName}>Basic Plan</Text>
                <Text style={styles.planDesc}>Up to 50 customers · Unlimited jobs</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.85}>
              <Text style={styles.upgradeText}>Upgrade to Pro →</Text>
            </TouchableOpacity>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Support</Text>
          <Card padding={0}>
            <SettingRow label="Help & FAQ" onPress={() => {}} />
            <Divider />
            <SettingRow label="Send Feedback" onPress={() => {}} />
            <Divider />
            <SettingRow label="Privacy Policy" onPress={() => {}} />
          </Card>
        </View>

        <View style={styles.section}>
          <Card padding={0}>
            <TouchableOpacity
              onPress={handleLogout}
              style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base }}
              activeOpacity={0.8}
            >
              <LogoutIcon size={18} color={Colors.overdue} />
              <Text style={{ fontSize: Typography.base, color: Colors.overdue, fontWeight: Typography.medium }}>
                Log out
              </Text>
            </TouchableOpacity>
          </Card>
        </View>

        <Text style={styles.versionText}>TailorBook v1.0.0 · Made for African tailors</Text>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const StatItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={{ alignItems: 'center', flex: 1 }}>
    <Text style={{ fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.primary }}>{value}</Text>
    <Text style={{ fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 }}>{label}</Text>
  </View>
);

const SettingRow: React.FC<{
  label: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
}> = ({ label, subtitle, onPress, right }) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.settingRow}
    activeOpacity={onPress ? 0.7 : 1}
    disabled={!onPress && !right}
  >
    <View style={{ flex: 1 }}>
      <Text style={styles.settingLabel}>{label}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {right ?? (onPress && <Text style={{ color: Colors.textTertiary, fontSize: 18 }}>›</Text>)}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  scroll: { paddingHorizontal: Spacing.base },
  profileCard: { marginBottom: Spacing.xl },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  profileRole: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  profileLocation: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  statsRow: { flexDirection: 'row' },
  statDivider: { width: 1, backgroundColor: Colors.borderLight },
  section: { marginBottom: Spacing.xl },
  sectionLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.base,
  },
  settingLabel: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
  settingSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  planRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  planBadge: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  planBadgeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  planName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  planDesc: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  upgradeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  upgradeText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  versionText: {
    textAlign: 'center',
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
  },
});

export default AccountScreen;
