/**
 * ErrorState
 *
 * Deliberately separate from EmptyState. EmptyState means "there's nothing
 * here yet, here's how to add something" — encouraging. ErrorState means
 * "something went wrong on our end, not yours" — reassuring, with a retry.
 * Conflating the two (as most apps do by reusing one generic placeholder for
 * both) undersells genuine failures and over-dramatizes normal empty lists.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing, IconSize } from '../../constants/theme';
import { Button } from './UI';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "Something went wrong. This isn't your fault — try again.",
  onRetry,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.lg }}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={message}
    >
      <View
        style={{
          width: 72, height: 72, borderRadius: 36,
          backgroundColor: colors.overdueLight,
          alignItems: 'center', justifyContent: 'center',
        }}
        importantForAccessibility="no-hide-descendants"
      >
        <Ionicons name="cloud-offline-outline" size={IconSize.xl} color={colors.overdue} />
      </View>
      <Text style={{ fontSize: Typography.base, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
        {message}
      </Text>
      {onRetry && (
        <Button label="Try Again" onPress={onRetry} variant="secondary" fullWidth={false} />
      )}
    </View>
  );
};

export default ErrorState;
