import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { LogoutIcon, MenuIcon } from '../../components/common/Icons';
import { Avatar, Card, Divider, Button } from '../../components/common/UI';
import { useStore } from '../../context/store';
import { TailorSettings } from '../../types';

const AccountScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { jobs, customers, settings, loadSettings, saveSettings } = useStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);

  const [form, setForm] = useState<TailorSettings>({
    tailorName: '',
    shopName: '',
    phone: '',
    location: '',
    currency: '₦',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      setForm({
        tailorName: settings.tailorName || '',
        shopName: settings.shopName || '',
        phone: settings.phone || '',
        location: settings.location || '',
        currency: settings.currency || '₦',
      });
    }
  }, [settings]);

  const handleSaveProfile = async () => {
    await saveSettings(form);
    setEditingProfile(false);
    Alert.alert('Saved', 'Your profile has been updated.');
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => {} },
    ]);
  };

  const displayName = settings?.shopName || settings?.tailorName || 'My Shop';
  const displayRole = settings?.tailorName || 'Tailor';
  const displayLocation = settings?.location || 'Nigeria';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MenuIcon size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ─── Profile Card ─── */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Avatar name={displayName} size={60} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileRole}>{displayRole}</Text>
              <Text style={styles.profileLocation}>{displayLocation}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setEditingProfile(true)}
              style={styles.editProfileBtn}
            >
              <Text style={styles.editProfileText}>Edit</Text>
            </TouchableOpacity>
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

        {/* ─── Preferences ─── */}
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

        {/* ─── Subscription ─── */}
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

        {/* ─── Support ─── */}
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

      {/* ─── Edit Profile Modal ─── */}
      <Modal visible={editingProfile} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditingProfile(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHint}>
              <Text style={styles.modalHintText}>
                Your name will appear on the home screen and drawer menu.
              </Text>
            </View>

            <ProfileField
              label="Your Name"
              placeholder="e.g. Tunde Balogun"
              value={form.tailorName}
              onChangeText={(v) => setForm((f) => ({ ...f, tailorName: v }))}
            />
            <ProfileField
              label="Shop Name"
              placeholder="e.g. Tunde Stitches"
              value={form.shopName}
              onChangeText={(v) => setForm((f) => ({ ...f, shopName: v }))}
            />
            <ProfileField
              label="Phone Number"
              placeholder="e.g. 0811 234 5678"
              value={form.phone}
              onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
              keyboardType="phone-pad"
            />
            <ProfileField
              label="Location"
              placeholder="e.g. Lagos, Nigeria"
              value={form.location}
              onChangeText={(v) => setForm((f) => ({ ...f, location: v }))}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={{ alignItems: 'center', flex: 1 }}>
    <Text style={{ fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.primary }}>
      {value}
    </Text>
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

const ProfileField: React.FC<{
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: any;
}> = ({ label, placeholder, value, onChangeText, keyboardType }) => (
  <View style={styles.profileField}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={styles.fieldInput}
      placeholder={placeholder}
      placeholderTextColor={Colors.textTertiary}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType || 'default'}
      autoCapitalize="words"
    />
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  headerTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  scroll: { paddingHorizontal: Spacing.base },

  profileCard: { marginBottom: Spacing.xl },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  profileInfo: { flex: 1 },
  profileName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  profileRole: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  profileLocation: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  editProfileBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryFaint,
  },
  editProfileText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semibold },
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
  settingLabel: { fontSize: Typography.base, color: Colors.textPrimary, fontWeight: Typography.medium },
  settingSubtitle: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },

  planRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  planBadge: {
    backgroundColor: Colors.borderLight, paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: Radius.full,
  },
  planBadgeText: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textSecondary, letterSpacing: 1 },
  planName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  planDesc: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  upgradeBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 12, alignItems: 'center',
  },
  upgradeText: { color: Colors.white, fontSize: Typography.sm, fontWeight: Typography.semibold },

  versionText: {
    textAlign: 'center', fontSize: Typography.xs,
    color: Colors.textTertiary, marginBottom: Spacing.md,
  },

  // Edit modal
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary },
  modalCancel: { fontSize: Typography.base, color: Colors.textSecondary },
  modalSave: { fontSize: Typography.base, color: Colors.primary, fontWeight: Typography.bold },
  modalScroll: { flex: 1, padding: Spacing.base },
  modalHint: {
    backgroundColor: Colors.primaryFaint,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  modalHintText: { fontSize: Typography.sm, color: Colors.primary, lineHeight: 20 },
  profileField: { marginBottom: Spacing.lg },
  fieldLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  fieldInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    ...Shadow.sm,
  },
});

export default AccountScreen;
