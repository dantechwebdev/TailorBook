/**
 * ConfirmationDialog
 *
 * Destructive actions (delete customer, cancel job) currently go through the
 * native Alert.alert — functional, but visually disconnected from the rest
 * of the app (system font, system colors, no dark-mode awareness). This is
 * the on-brand equivalent, controlled the same way Alert.alert is used
 * today (open with a boolean, resolve on confirm/cancel) so it's a drop-in
 * upgrade wherever a screen currently calls Alert.alert for a destructive
 * confirmation.
 */

import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing, Radius, Opacity, IconSize } from '../../constants/theme';
import { Button } from './UI';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  const { colors, shadow } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onCancel} />
        <View
          style={[styles.card, { backgroundColor: colors.surfaceElevated }, shadow.lg]}
          accessible
          accessibilityRole="alert"
          accessibilityViewIsModal
        >
          <View style={[styles.iconWrap, { backgroundColor: destructive ? colors.overdueLight : colors.primaryFaint }]}>
            <Ionicons
              name={destructive ? 'warning-outline' : 'help-circle-outline'}
              size={IconSize.xl}
              color={destructive ? colors.overdue : colors.primary}
            />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Button label={cancelLabel} onPress={onCancel} variant="ghost" />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={confirmLabel}
                onPress={onConfirm}
                variant={destructive ? 'danger' : 'primary'}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: Typography.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
});
