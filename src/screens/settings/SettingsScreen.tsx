import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { AppearanceMode } from '../../constants/theme';
import { MenuIcon } from '../../components/common/Icons';
import { useStore } from '../../context/store';
import { useTheme } from '../../context/ThemeContext';

const APP_VERSION = '1.0.0';

// ─── SettingsScreen ────────────────────────────────────────────────────────────

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { settings, saveSettings } = useStore();
  const { colors, appearance } = useTheme();

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const currentAppearance: AppearanceMode =
    (settings?.appearance as AppearanceMode) || 'system';

  const notificationsEnabled = settings?.notificationsEnabled !== '0';

  const setAppearance = async (mode: AppearanceMode) => {
    await saveSettings({ ...settings!, appearance: mode });
  };

  const toggleNotifications = async (value: boolean) => {
    await saveSettings({ ...settings!, notificationsEnabled: value ? '1' : '0' });
  };

  const APPEARANCE_OPTIONS: { label: string; value: AppearanceMode; icon: string }[] = [
    { label: 'System', value: 'system', icon: 'phone-portrait-outline' },
    { label: 'Light',  value: 'light',  icon: 'sunny-outline' },
    { label: 'Dark',   value: 'dark',   icon: 'moon-outline' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Open menu"
          accessibilityRole="button"
        >
          <MenuIcon size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ─── Appearance ─── */}
        <SectionLabel label="Appearance" style={styles} />
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Theme</Text>
          <Text style={styles.cardSubtitle}>Choose how TailorBook looks on your device</Text>
          <View style={styles.appearanceRow}>
            {APPEARANCE_OPTIONS.map((opt) => {
              const isSelected = currentAppearance === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setAppearance(opt.value)}
                  activeOpacity={0.8}
                  accessibilityLabel={`${opt.label} theme`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  style={[styles.appearanceOption, isSelected && styles.appearanceOptionSelected]}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={20}
                    color={isSelected ? colors.primary : colors.textTertiary}
                  />
                  <Text style={[styles.appearanceLabel, isSelected && styles.appearanceLabelSelected]}>
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── Notifications ─── */}
        <SectionLabel label="Notifications" style={styles} />
        <View style={[styles.card, { padding: 0 }]}>
          <SettingRow
            label="Job Reminders"
            subtitle="Get alerted at 7, 3, 1 day before delivery"
            colors={colors}
            style={styles}
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={colors.white}
                accessibilityLabel="Toggle job reminders"
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            label="Manage System Notifications"
            subtitle="Open device notification settings"
            colors={colors}
            style={styles}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }}
          />
        </View>

        {/* ─── About ─── */}
        <SectionLabel label="About TailorBook" style={styles} />
        <View style={[styles.card, { padding: 0 }]}>
          <AboutRow label="Version"       value={APP_VERSION}   style={styles} />
          <View style={styles.divider} />
          <AboutRow label="Build"         value="Production"    style={styles} />
          <View style={styles.divider} />
          <AboutRow label="Storage"       value="Local Device"  style={styles} />
          <View style={styles.divider} />
          <AboutRow label="Notifications" value="Local Only"    style={styles} />
        </View>

        {/* ─── Privacy ─── */}
        <SectionLabel label="Privacy" style={styles} />
        <View style={[styles.card, { padding: 0 }]}>
          <SettingRow
            label="Privacy Policy"
            subtitle="How TailorBook handles your data"
            colors={colors}
            style={styles}
            onPress={() => Linking.openURL('https://tailorbook.app/privacy')}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Terms of Use"
            subtitle="Usage terms and conditions"
            colors={colors}
            style={styles}
            onPress={() => Linking.openURL('https://tailorbook.app/terms')}
          />
        </View>

        {/* ─── Version Footer ─── */}
        <View style={styles.versionFooter}>
          <Text style={styles.versionText}>TailorBook v{APP_VERSION}</Text>
          <Text style={styles.versionTagline}>Your digital workshop companion</Text>
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ label: string; style: ReturnType<typeof makeStyles> }> = ({
  label, style,
}) => (
  <Text style={style.sectionLabel}>{label}</Text>
);

const SettingRow: React.FC<{
  label: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  colors: any;
  style: ReturnType<typeof makeStyles>;
}> = ({ label, subtitle, onPress, right, colors, style }) => (
  <TouchableOpacity
    onPress={onPress}
    style={style.settingRow}
    activeOpacity={onPress ? 0.7 : 1}
    disabled={!onPress && !right}
    accessibilityRole={onPress ? 'button' : 'none'}
  >
    <View style={{ flex: 1 }}>
      <Text style={style.settingLabel}>{label}</Text>
      {subtitle ? <Text style={style.settingSubtitle}>{subtitle}</Text> : null}
    </View>
    {right ?? (
      onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} /> : null
    )}
  </TouchableOpacity>
);

const AboutRow: React.FC<{
  label: string;
  value: string;
  style: ReturnType<typeof makeStyles>;
}> = ({ label, value, style }) => (
  <View style={style.aboutRow}>
    <Text style={style.settingLabel}>{label}</Text>
    <Text style={style.aboutValue}>{value}</Text>
  </View>
);

// ─── Styles (theme-aware) ─────────────────────────────────────────────────────

function makeStyles(C: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
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
      color: C.textPrimary,
    },
    scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },
    sectionLabel: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      color: C.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: Spacing.sm,
      marginTop: Spacing.lg,
    },
    card: {
      backgroundColor: C.surface,
      borderRadius: Radius.lg,
      padding: Spacing.base,
      marginBottom: Spacing.md,
      ...Shadow.sm,
    },
    cardTitle: {
      fontSize: Typography.base,
      fontWeight: Typography.semibold,
      color: C.textPrimary,
      marginBottom: 4,
    },
    cardSubtitle: {
      fontSize: Typography.xs,
      color: C.textTertiary,
      marginBottom: Spacing.md,
    },
    appearanceRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    appearanceOption: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: C.border,
      backgroundColor: C.background,
    },
    appearanceOptionSelected: {
      borderColor: C.primary,
      backgroundColor: C.primaryFaint,
    },
    appearanceLabel: {
      fontSize: Typography.xs,
      fontWeight: Typography.semibold,
      color: C.textTertiary,
    },
    appearanceLabelSelected: {
      color: C.primary,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: Spacing.base,
      minHeight: 52,
    },
    settingLabel: {
      fontSize: Typography.base,
      color: C.textPrimary,
      fontWeight: Typography.medium,
    },
    settingSubtitle: {
      fontSize: Typography.xs,
      color: C.textTertiary,
      marginTop: 2,
    },
    aboutRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: Spacing.base,
    },
    aboutValue: {
      fontSize: Typography.sm,
      color: C.textSecondary,
      fontWeight: Typography.medium,
    },
    divider: {
      height: 1,
      backgroundColor: C.border,
      marginHorizontal: Spacing.base,
    },
    versionFooter: {
      alignItems: 'center',
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.lg,
    },
    versionText: {
      fontSize: Typography.sm,
      color: C.textTertiary,
      fontWeight: Typography.medium,
    },
    versionTagline: {
      fontSize: Typography.xs,
      color: C.textTertiary,
      marginTop: 4,
    },
  });
}

export default SettingsScreen;
