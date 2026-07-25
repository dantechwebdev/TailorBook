/**
 * CloudStatusCard
 *
 * Shown on the Dashboard home screen.
 *
 * Unauthenticated:
 *   - Soft CTA encouraging the tailor to back up their workshop
 *   - "Sign In" and "Sign Up" buttons
 *   - Framing: optional upgrade, never blocking
 *
 * Authenticated:
 *   - Shows cloud protection status
 *   - Last backup timestamp
 *   - Next sync info
 *   - Manage Cloud shortcut
 *
 * Mission spec (Mission 1 / Mission 6):
 *   "Your workshop is stored locally. Sign In | Sign Up"
 *   "Back up your workshop securely and access it from any of your devices."
 */

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { CloudIcon, CheckIcon, AlertCircleIcon } from '../common/Icons';
import { AuthState, CloudSyncState } from '../../types';
import { formatDateTime } from '../../utils/helpers';
import { useSpinLoop, useEntrance } from '../../utils/animations';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CloudStatusCardProps {
  authState: AuthState;
  syncState: CloudSyncState;
  onSignIn: () => void;
  onSignUp: () => void;
  onManageCloud: () => void;
  onSyncNow: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const CloudStatusCard: React.FC<CloudStatusCardProps> = memo(({
  authState,
  syncState,
  onSignIn,
  onSignUp,
  onManageCloud,
  onSyncNow,
}) => {
  const { colors: Colors } = useTheme();
  const styles = React.useMemo(() => createStyles(Colors), [Colors]);

  const isAuthenticated = authState.status === 'authenticated';
  const isSyncing = syncState.status === 'syncing';

  // Spin cloud icon when syncing, entrance animation for the whole card
  const { style: spinStyle } = useSpinLoop(isSyncing, 900);
  const cardEntrance = useEntrance(100, 6);

  // ── Unauthenticated view ────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <Animated.View style={[styles.unauthCard, cardEntrance.style]}>
        <View style={styles.unauthHeader}>
          <View style={styles.cloudIconWrap}>
            <Animated.View style={isSyncing ? spinStyle : undefined}>
              <CloudIcon size={18} color={Colors.primary} />
            </Animated.View>
          </View>
          <View style={styles.unauthHeaderText}>
            <Text style={styles.unauthTitle}>Workshop stored locally</Text>
            <Text style={styles.unauthSub}>Your data lives on this device</Text>
          </View>
        </View>
        <Text style={styles.unauthTagline}>
          Back up your workshop securely and access it from any of your devices.
        </Text>
        <View style={styles.authBtnRow}>
          <TouchableOpacity style={styles.signInBtn} onPress={onSignIn} activeOpacity={0.85}>
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signUpBtn} onPress={onSignUp} activeOpacity={0.85}>
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  // ── Authenticated view ──────────────────────────────────────────────────

  const syncStatusColor =
    syncState.status === 'success' ? Colors.ready :
    syncState.status === 'error'   ? Colors.overdue :
    syncState.status === 'syncing' ? Colors.primary :
    Colors.textSecondary;

  const syncStatusLabel =
    syncState.status === 'success' ? 'Workshop protected' :
    syncState.status === 'error'   ? 'Sync failed — tap to retry' :
    syncState.status === 'syncing' ? 'Syncing...' :
    'Ready to sync';

  const lastBackupText = syncState.lastBackupAt
    ? formatDateTime(syncState.lastBackupAt) : 'Never backed up';

  const lastSyncText = syncState.lastSyncAt
    ? formatDateTime(syncState.lastSyncAt) : 'Not yet synced';

  return (
    <Animated.View style={cardEntrance.style}>
    <TouchableOpacity style={styles.authCard} onPress={onManageCloud} activeOpacity={0.88}>
      <View style={styles.authCardHeader}>
        <View style={styles.cloudIconWrap}>
          {/* Cloud icon spins during active sync */}
          <Animated.View style={isSyncing ? spinStyle : undefined}>
            <CloudIcon size={18} color={Colors.primary} />
          </Animated.View>
        </View>
        <View style={styles.authHeaderText}>
          <Text style={styles.authCardTitle}>TailorBook Cloud</Text>
          <Text style={[styles.authCardStatus, { color: syncStatusColor }]}>
            {syncStatusLabel}
          </Text>
        </View>
        {syncState.status === 'success' && <CheckIcon size={18} color={Colors.ready} />}
        {syncState.status === 'error'   && <AlertCircleIcon size={18} color={Colors.overdue} />}
      </View>

      <View style={styles.authStats}>
        <StatItem label="Last Backup" value={lastBackupText} />
        <View style={styles.statDivider} />
        <StatItem label="Last Sync" value={lastSyncText} />
      </View>

      <View style={styles.authFooter}>
        <TouchableOpacity onPress={onSyncNow} style={styles.syncNowBtn} activeOpacity={0.8}>
          <Text style={styles.syncNowText}>Sync Now</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onManageCloud} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.manageText}>Manage →</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
    </Animated.View>
  );
});

CloudStatusCard.displayName = 'CloudStatusCard';

// ─── StatItem ─────────────────────────────────────────────────────────────────

const StatItem: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const { colors: Colors } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: Typography.xs, color: Colors.textTertiary, marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.medium }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (Colors: any) =>
  StyleSheet.create({
    // Unauthenticated
    unauthCard: {
      marginHorizontal: Spacing.base,
      marginBottom: Spacing.xl,
      backgroundColor: Colors.primaryFaint,
      borderRadius: Radius.lg,
      padding: Spacing.base,
      borderWidth: 1,
      borderColor: Colors.primary + '20',
    },
    unauthHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.sm,
    },
    cloudIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadow.sm,
    },
    unauthHeaderText: { flex: 1 },
    unauthTitle: {
      fontSize: Typography.sm,
      fontWeight: Typography.semibold,
      color: Colors.textPrimary,
    },
    unauthSub: {
      fontSize: Typography.xs,
      color: Colors.textSecondary,
      marginTop: 1,
    },
    unauthTagline: {
      fontSize: Typography.sm,
      color: Colors.textSecondary,
      lineHeight: 19,
      marginBottom: Spacing.md,
    },
    authBtnRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    signInBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: Radius.md,
      backgroundColor: Colors.surface,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: Colors.border,
    },
    signInText: {
      fontSize: Typography.sm,
      fontWeight: Typography.semibold,
      color: Colors.textPrimary,
    },
    signUpBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: Radius.md,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      ...Shadow.sm,
    },
    signUpText: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: Colors.white,
    },

    // Authenticated
    authCard: {
      marginHorizontal: Spacing.base,
      marginBottom: Spacing.xl,
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.base,
      ...Shadow.sm,
    },
    authCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    authHeaderText: { flex: 1 },
    authCardTitle: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
    },
    authCardStatus: {
      fontSize: Typography.xs,
      fontWeight: Typography.medium,
      marginTop: 2,
    },
    authStats: {
      flexDirection: 'row',
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: Colors.borderLight,
      marginBottom: Spacing.md,
      gap: Spacing.md,
    },
    statDivider: {
      width: 1,
      backgroundColor: Colors.borderLight,
      marginHorizontal: Spacing.sm,
    },
    authFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    syncNowBtn: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.md,
      backgroundColor: Colors.primaryFaint,
    },
    syncNowText: {
      fontSize: Typography.xs,
      fontWeight: Typography.semibold,
      color: Colors.primary,
    },
    manageText: {
      fontSize: Typography.xs,
      color: Colors.primary,
      fontWeight: Typography.medium,
    },
  });

export default CloudStatusCard;
