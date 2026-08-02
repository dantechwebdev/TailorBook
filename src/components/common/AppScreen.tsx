/**
 * AppScreen
 *
 * Every screen in the app repeated the same four lines:
 *   <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
 * with the container style redefined locally in each file's StyleSheet. This
 * is that pattern, centralized once. New screens should start here instead
 * of hand-rolling it again.
 *
 * Handles three states so screens don't each reinvent loading/error UI:
 *   - default: renders children
 *   - loading: shows a centered spinner (optionally with a message)
 *   - error: shows ErrorState with a retry action
 */

import React from 'react';
import { View, ViewStyle, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Typography } from '../../constants/theme';
import { ErrorState } from './ErrorState';

interface AppScreenProps {
  children: React.ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
  loading?: boolean;
  loadingMessage?: string;
  error?: string | null;
  onRetry?: () => void;
  /** Background override — defaults to the theme's background token. */
  backgroundColor?: string;
}

export const AppScreen: React.FC<AppScreenProps> = ({
  children,
  edges = ['top'],
  style,
  loading = false,
  loadingMessage,
  error,
  onRetry,
  backgroundColor,
}) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: backgroundColor ?? colors.background }, style]}
      edges={edges}
    >
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md }}>
          <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading" />
          {loadingMessage ? (
            <Text style={{ fontSize: Typography.sm, color: colors.textSecondary }}>{loadingMessage}</Text>
          ) : null}
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : (
        children
      )}
    </SafeAreaView>
  );
};

export default AppScreen;
