import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { getInitials, getAvatarColor } from '../../utils/helpers';

// ─── Primary Button ───────────────────────────────────────────────────────────

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  fullWidth = true,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.btn,
        styles[`btn_${variant}`],
        styles[`btn_${size}`],
        fullWidth && styles.btnFullWidth,
        isDisabled && styles.btnDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.white : Colors.primary}
        />
      ) : (
        <>
          {icon && <View style={styles.btnIcon}>{icon}</View>}
          <Text style={[styles.btnText, styles[`btnText_${variant}`], styles[`btnText_${size}`]]}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
  },
  btnFullWidth: { width: '100%' },
  btnDisabled: { opacity: 0.5 },
  btnIcon: { marginRight: Spacing.sm },

  btn_primary: {
    backgroundColor: Colors.primary,
    ...Shadow.sm,
  },
  btn_secondary: {
    backgroundColor: Colors.primaryFaint,
    borderWidth: 1.5,
    borderColor: Colors.primary + '30',
  },
  btn_ghost: {
    backgroundColor: 'transparent',
  },
  btn_danger: {
    backgroundColor: Colors.overdueLight,
    borderWidth: 1.5,
    borderColor: Colors.overdue + '30',
  },

  btn_sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.md },
  btn_md: { paddingVertical: 14, paddingHorizontal: Spacing.lg },
  btn_lg: { paddingVertical: 16, paddingHorizontal: Spacing.xl },

  btnText: {
    fontWeight: Typography.semibold,
    letterSpacing: 0.2,
  },
  btnText_primary: { color: Colors.white },
  btnText_secondary: { color: Colors.primary },
  btnText_ghost: { color: Colors.primary },
  btnText_danger: { color: Colors.overdue },

  btnText_sm: { fontSize: Typography.sm },
  btnText_md: { fontSize: Typography.base },
  btnText_lg: { fontSize: Typography.md, fontWeight: Typography.bold },
});

// ─── Avatar ───────────────────────────────────────────────────────────────────

interface AvatarProps {
  name: string;
  size?: number;
  photoUri?: string;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 44, style }) => {
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text
        style={{
          color: Colors.white,
          fontSize: size * 0.38,
          fontWeight: Typography.bold,
          letterSpacing: 0.5,
        }}
      >
        {initials}
      </Text>
    </View>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

import { JOB_STATUS_CONFIG } from '../../constants/theme';
import { JobStatus } from '../../types';

interface StatusBadgeProps {
  status: JobStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = JOB_STATUS_CONFIG[status];
  return (
    <View
      style={{
        backgroundColor: config.bgColor,
        paddingHorizontal: size === 'sm' ? 8 : 10,
        paddingVertical: size === 'sm' ? 3 : 4,
        borderRadius: Radius.full,
      }}
    >
      <Text
        style={{
          color: config.color,
          fontSize: size === 'sm' ? Typography.xs : Typography.sm,
          fontWeight: Typography.semibold,
        }}
      >
        {config.label}
      </Text>
    </View>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  action?: { label: string; onPress: () => void };
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action, style }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, style]}>
    <Text style={{ fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary }}>
      {title}
    </Text>
    {action && (
      <TouchableOpacity onPress={action.onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={{ fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semibold }}>
          {action.label}
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress, padding = Spacing.base }) => {
  const content = (
    <View
      style={[
        {
          backgroundColor: Colors.surface,
          borderRadius: Radius.lg,
          padding,
          ...Shadow.sm,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
};

// ─── Text Input ───────────────────────────────────────────────────────────────

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'numeric' | 'decimal-pad';
  multiline?: boolean;
  numberOfLines?: number;
  icon?: React.ReactNode;
  error?: string;
  style?: ViewStyle;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export const InputField: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  icon,
  error,
  style,
  maxLength,
  autoCapitalize = 'words',
}) => (
  <View style={[{ marginBottom: Spacing.md }, style]}>
    {label && (
      <Text
        style={{
          fontSize: Typography.sm,
          fontWeight: Typography.semibold,
          color: Colors.textSecondary,
          marginBottom: Spacing.xs,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    )}
    <View
      style={{
        flexDirection: 'row',
        alignItems: multiline ? 'flex-start' : 'center',
        backgroundColor: Colors.surface,
        borderRadius: Radius.md,
        borderWidth: 1.5,
        borderColor: error ? Colors.overdue : Colors.border,
        paddingHorizontal: Spacing.md,
        paddingVertical: multiline ? Spacing.md : 0,
        minHeight: multiline ? 90 : 52,
      }}
    >
      {icon && <View style={{ marginRight: Spacing.sm, paddingTop: multiline ? 2 : 0 }}>{icon}</View>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : undefined}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        style={{
          flex: 1,
          fontSize: Typography.base,
          color: Colors.textPrimary,
          paddingVertical: multiline ? 0 : 14,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
    {error && (
      <Text style={{ fontSize: Typography.xs, color: Colors.overdue, marginTop: 4 }}>{error}</Text>
    )}
  </View>
);

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle, action }) => (
  <View style={{ alignItems: 'center', paddingVertical: Spacing.xxxl, paddingHorizontal: Spacing.xl }}>
    <View
      style={{
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.primaryFaint,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
      }}
    >
      {icon}
    </View>
    <Text
      style={{
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: Spacing.sm,
      }}
    >
      {title}
    </Text>
    {subtitle && (
      <Text
        style={{
          fontSize: Typography.sm,
          color: Colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
          marginBottom: action ? Spacing.lg : 0,
        }}
      >
        {subtitle}
      </Text>
    )}
    {action && (
      <Button label={action.label} onPress={action.onPress} variant="primary" fullWidth={false} />
    )}
  </View>
);

// ─── Chip / Quick Select ──────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected,
  onPress,
  color = Colors.primary,
  style,
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={[
      {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.full,
        borderWidth: 1.5,
        borderColor: selected ? color : Colors.border,
        backgroundColor: selected ? color + '15' : Colors.surface,
        marginRight: Spacing.sm,
        marginBottom: Spacing.sm,
      },
      style,
    ]}
  >
    <Text
      style={{
        fontSize: Typography.sm,
        fontWeight: selected ? Typography.semibold : Typography.regular,
        color: selected ? color : Colors.textSecondary,
      }}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── Divider ──────────────────────────────────────────────────────────────────

export const Divider: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[{ height: 1, backgroundColor: Colors.divider }, style]} />
);

// ─── Loading Screen ───────────────────────────────────────────────────────────

export const LoadingScreen: React.FC<{ message?: string }> = ({ message }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
    <ActivityIndicator size="large" color={Colors.primary} />
    {message && (
      <Text style={{ marginTop: Spacing.md, color: Colors.textSecondary, fontSize: Typography.sm }}>
        {message}
      </Text>
    )}
  </View>
);

// ─── Row Item ────────────────────────────────────────────────────────────────

interface RowItemProps {
  label: string;
  value?: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  valueStyle?: TextStyle;
}

export const RowItem: React.FC<RowItemProps> = ({
  label,
  value,
  onPress,
  icon,
  rightIcon,
  style,
  valueStyle,
}) => {
  const content = (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.base,
          backgroundColor: Colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: Colors.borderLight,
        },
        style,
      ]}
    >
      {icon && <View style={{ marginRight: Spacing.md }}>{icon}</View>}
      <Text style={{ flex: 1, fontSize: Typography.base, color: Colors.textSecondary }}>{label}</Text>
      {value && (
        <Text
          style={[
            { fontSize: Typography.base, color: Colors.textPrimary, fontWeight: Typography.medium },
            valueStyle,
          ]}
        >
          {value}
        </Text>
      )}
      {rightIcon || (onPress && <ChevronRightIconInline />)}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
  }
  return content;
};

const ChevronRightIconInline = () => (
  <View style={{ marginLeft: 8 }}>
    <Text style={{ color: Colors.textTertiary, fontSize: 18 }}>›</Text>
  </View>
);
