/**
 * AppIconButton
 *
 * There was no dedicated icon-button primitive anywhere in the app — every
 * back arrow, menu trigger, and close button was a bare TouchableOpacity
 * with its own one-off hitSlop, size, and (usually absent) accessibility
 * label. This guarantees a 44pt touch target regardless of how small the
 * icon glyph itself is, and never ships without a label.
 */

import React from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Opacity, TouchTarget, Radius } from '../../constants/theme';

interface AppIconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string; // required, not optional — an icon-only button with no label is invisible to screen readers
  disabled?: boolean;
  variant?: 'plain' | 'filled';
  style?: ViewStyle;
}

export const AppIconButton: React.FC<AppIconButtonProps> = ({
  icon,
  onPress,
  accessibilityLabel,
  disabled = false,
  variant = 'plain',
  style,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={Opacity.pressed}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[
        {
          minWidth: TouchTarget.minimum,
          minHeight: TouchTarget.minimum,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: Radius.full,
          backgroundColor: variant === 'filled' ? colors.surface : 'transparent',
          opacity: disabled ? Opacity.disabled : 1,
        },
        style,
      ]}
    >
      {icon}
    </TouchableOpacity>
  );
};

export default AppIconButton;
