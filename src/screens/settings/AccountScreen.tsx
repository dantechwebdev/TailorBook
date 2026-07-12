import React, { useState, useEffect, useMemo } from 'react';
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
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { MenuIcon } from '../../components/common/Icons';
import { Card, Divider, Button } from '../../components/common/UI';
import { useStore } from '../../context/store';
import { TailorSettings } from '../../types';
import { getInitials, getAvatarColor } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CURRENCIES = [
  { symbol: '₦', label: 'Naira (NGN)' },
  { symbol: '$', label: 'Dollar (USD)' },
  { symbol: '£', label: 'Pound (GBP)' },
  { symbol: '€', label: 'Euro (EUR)' },
  { symbol: 'GH₵', label: 'Cedi (GHS)' },
  { symbol: 'KSh', label: 'Shilling (KES)' },
];

// ─── AccountScreen ─────────────────────────────────────────────────────────────

const AccountScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { jobs, customers, settings, loadSettings, saveSettings } = useStore();
  const { colors: Colors } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const [form, setForm] = useState<TailorSettings>({
    tailorName: '',
    shopName: '',
    phone: '',
    location: '',
    currency: '₦',
    workDays: '["Mon","Tue","Wed","Thu","Fri","Sat"]',
    defaultApparel: '',
    onboardingComplete: '1',
    profilePhotoUri: '',
  });

  const [formWorkDays, setFormWorkDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);

  const styles = useMemo(() => StyleSheet.create({
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

    workDayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
    workDayChip: {
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
      borderRadius: Radius.full,
      backgroundColor: Colors.background,
      borderWidth: 1.5,
      borderColor: Colors.border,
    },
    workDayChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryFaint },
    workDayText: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textTertiary },
    workDayTextActive: { color: Colors.primary },
    editScheduleLink: { alignSelf: 'flex-start' },
    editScheduleLinkText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.medium },

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

    // Modals
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

    // Photo section in edit modal
    photoSection: {
      alignItems: 'center',
      marginBottom: Spacing.xl,
      position: 'relative',
    },
    cameraOverlay: {
      position: 'absolute',
      bottom: 28,
      right: '33%',
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: Colors.primary,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: Colors.background,
    },
    photoHint: {
      fontSize: Typography.xs,
      color: Colors.textTertiary,
      marginTop: Spacing.sm,
    },
    removePhotoText: {
      fontSize: Typography.sm,
      color: Colors.overdue,
      fontWeight: Typography.medium,
      marginTop: Spacing.xs,
    },

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

    daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    dayChip: {
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
      borderRadius: Radius.full,
      backgroundColor: Colors.surface,
      borderWidth: 1.5,
      borderColor: Colors.border,
    },
    dayChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryFaint },
    dayChipText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary },
    dayChipTextActive: { color: Colors.primary },

    // Currency modal
    currencyRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.base,
      borderWidth: 2,
      borderColor: 'transparent',
      ...Shadow.sm,
      gap: Spacing.md,
      marginBottom: Spacing.sm,
    },
    currencyRowSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryFaint },
    currencySymbol: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, width: 36 },
    currencyLabel: { flex: 1, fontSize: Typography.base, color: Colors.textSecondary },
  }), [Colors]);

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
        workDays: settings.workDays || '["Mon","Tue","Wed","Thu","Fri","Sat"]',
        defaultApparel: settings.defaultApparel || '',
        onboardingComplete: settings.onboardingComplete || '1',
        profilePhotoUri: settings.profilePhotoUri || '',
      });
      try {
        setFormWorkDays(JSON.parse(settings.workDays || '["Mon","Tue","Wed","Thu","Fri","Sat"]'));
      } catch {
        setFormWorkDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
      }
    }
  }, [settings]);

  const toggleDay = (day: string) => {
    setFormWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const pickPhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please allow access to your photo library.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setForm((f) => ({ ...f, profilePhotoUri: result.assets[0].uri }));
      }
    } catch {
      Alert.alert('Could not open photo library', 'Try again or use a different method.');
    }
  };

  const handleSaveProfile = async () => {
    const updated: TailorSettings = {
      ...form,
      workDays: JSON.stringify(formWorkDays),
    };
    await saveSettings(updated);
    setEditingProfile(false);
    Alert.alert('Saved', 'Your profile has been updated.');
  };

  const displayName = settings?.shopName || settings?.tailorName || 'My Shop';
  const displayRole = settings?.tailorName || 'Tailor';
  const displayLocation = settings?.location || 'Nigeria';
  const photoUri = settings?.profilePhotoUri || '';

  const parsedWorkDays: string[] = (() => {
    try { return JSON.parse(settings?.workDays || '[]'); } catch { return []; }
  })();

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
            {/* Avatar / Photo */}
            <ProfileAvatar photoUri={photoUri} name={displayName} size={64} Colors={Colors} />

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileRole}>{displayRole}</Text>
              <Text style={styles.profileLocation}>
                <Ionicons name="location-outline" size={12} color={Colors.textTertiary} />
                {' '}{displayLocation}
              </Text>
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
            <StatItem label="Customers" value={String(customers.length)} Colors={Colors} />
            <View style={styles.statDivider} />
            <StatItem label="Total Jobs" value={String(jobs.length)} Colors={Colors} />
            <View style={styles.statDivider} />
            <StatItem
              label="Delivered"
              value={String(jobs.filter((j) => j.status === 'Delivered').length)}
              Colors={Colors}
            />
          </View>
        </Card>

        {/* ─── Work Schedule ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Work Schedule</Text>
          <Card>
            <View style={styles.workDayRow}>
              {DAYS.map((day) => {
                const isActive = parsedWorkDays.includes(day);
                return (
                  <View
                    key={day}
                    style={[styles.workDayChip, isActive && styles.workDayChipActive]}
                  >
                    <Text style={[styles.workDayText, isActive && styles.workDayTextActive]}>
                      {day}
                    </Text>
                  </View>
                );
              })}
            </View>
            <TouchableOpacity
              onPress={() => setEditingProfile(true)}
              style={styles.editScheduleLink}
            >
              <Text style={styles.editScheduleLinkText}>Edit schedule →</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* ─── Preferences ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Preferences</Text>
          <Card padding={0}>
            <SettingRow
              label="Job Reminders"
              subtitle="Get notified about upcoming jobs"
              styles={styles}
              Colors={Colors}
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
              subtitle={`${settings?.currency || '₦'} — tap to change`}
              styles={styles}
              Colors={Colors}
              onPress={() => setShowCurrencyPicker(true)}
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
            <SettingRow label="Help & FAQ" styles={styles} Colors={Colors} onPress={() => {}} />
            <Divider />
            <SettingRow label="Send Feedback" styles={styles} Colors={Colors} onPress={() => {}} />
            <Divider />
            <SettingRow label="Privacy Policy" styles={styles} Colors={Colors} onPress={() => {}} />
          </Card>
        </View>

        <Text style={styles.versionText}>TailorBook v1.0.0 · Made for African tailors</Text>
        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      {/* ─── Currency Picker Modal ─── */}
      <Modal visible={showCurrencyPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <View style={{ width: 50 }} />
          </View>
          <ScrollView style={{ flex: 1, padding: Spacing.base }}>
            {CURRENCIES.map((c) => {
              const isSelected = (settings?.currency || '₦') === c.symbol;
              return (
                <TouchableOpacity
                  key={c.symbol}
                  onPress={async () => {
                    await saveSettings({ ...settings!, currency: c.symbol });
                    setShowCurrencyPicker(false);
                  }}
                  style={[styles.currencyRow, isSelected && styles.currencyRowSelected]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.currencySymbol}>{c.symbol}</Text>
                  <Text style={[styles.currencyLabel, isSelected && { color: Colors.primary }]}>
                    {c.label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

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
            {/* ─── Photo Picker ─── */}
            <View style={styles.photoSection}>
              <TouchableOpacity onPress={pickPhoto} activeOpacity={0.85}>
                <ProfileAvatar photoUri={form.profilePhotoUri || ''} name={form.tailorName || displayName} size={88} Colors={Colors} />
                <View style={styles.cameraOverlay}>
                  <Ionicons name="camera" size={16} color={Colors.white} />
                </View>
              </TouchableOpacity>
              <Text style={styles.photoHint}>Tap to change photo</Text>
              {form.profilePhotoUri ? (
                <TouchableOpacity onPress={() => setForm((f) => ({ ...f, profilePhotoUri: '' }))}>
                  <Text style={styles.removePhotoText}>Remove photo</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <ProfileField
              label="Your Name"
              placeholder="e.g. Tunde Balogun"
              value={form.tailorName}
              onChangeText={(v) => setForm((f) => ({ ...f, tailorName: v }))}
              styles={styles}
              Colors={Colors}
            />
            <ProfileField
              label="Shop Name"
              placeholder="e.g. Tunde Stitches"
              value={form.shopName}
              onChangeText={(v) => setForm((f) => ({ ...f, shopName: v }))}
              styles={styles}
              Colors={Colors}
            />
            <ProfileField
              label="Phone Number"
              placeholder="e.g. 0811 234 5678"
              value={form.phone}
              onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
              keyboardType="phone-pad"
              styles={styles}
              Colors={Colors}
            />
            <ProfileField
              label="Location"
              placeholder="e.g. Lagos, Nigeria"
              value={form.location}
              onChangeText={(v) => setForm((f) => ({ ...f, location: v }))}
              styles={styles}
              Colors={Colors}
            />

            {/* ─── Work Days ─── */}
            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>Working Days</Text>
              <View style={styles.daysRow}>
                {DAYS.map((day) => {
                  const isOn = formWorkDays.includes(day);
                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => toggleDay(day)}
                      activeOpacity={0.8}
                      style={[styles.dayChip, isOn && styles.dayChipActive]}
                    >
                      <Text style={[styles.dayChipText, isOn && styles.dayChipTextActive]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// ─── ProfileAvatar ────────────────────────────────────────────────────────────

const ProfileAvatar: React.FC<{ photoUri: string; name: string; size: number; Colors: any }> = ({
  photoUri, name, size, Colors,
}) => {
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  if (photoUri) {
    return (
      <Image
        source={{ uri: photoUri }}
        style={{
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: Colors.border,
        }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: bgColor,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Text style={{ color: Colors.white, fontSize: size * 0.36, fontWeight: Typography.bold }}>
        {initials}
      </Text>
    </View>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatItem: React.FC<{ label: string; value: string; Colors: any }> = ({ label, value, Colors }) => (
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
  styles: any;
  Colors: any;
}> = ({ label, subtitle, onPress, right, styles, Colors }) => (
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
  styles: any;
  Colors: any;
}> = ({ label, placeholder, value, onChangeText, keyboardType, styles, Colors }) => (
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

export default AccountScreen;
