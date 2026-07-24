/**
 * SignInScreen
 *
 * Optional cloud authentication — the workshop always works without it.
 * Design philosophy: feels like an upgrade, not a gate.
 *
 * Layout:
 *   - Back / close at top
 *   - TailorBook branding
 *   - Email + Password fields
 *   - Sign In CTA
 *   - "Forgot password?" link (architecture prepared, not implemented)
 *   - "Don't have an account? Sign Up" link
 *   - "Continue without account" at the bottom (always visible)
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Typography, Spacing, Radius, Shadow } from '../../constants/theme';

const SignInScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors: Colors } = useTheme();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const passwordRef = useRef<TextInput>(null);
  const styles = React.useMemo(() => createStyles(Colors), [Colors]);

  const validate = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) {
      setEmailError('Email address is required');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    }

    return valid;
  };

  const handleSignIn = useCallback(async () => {
    if (!validate()) return;
    setIsLoading(true);

    try {
      const result = await signIn({ email: email.trim().toLowerCase(), password });

      if (result.success) {
        // Navigate back to where they came from
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      } else {
        // Show the error — it will be the "not yet connected" message or a real auth error
        Alert.alert(
          'Sign In',
          result.error || 'Sign in failed. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, password, signIn, navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Branding ─── */}
          <View style={styles.brandBlock}>
            <View style={[styles.logoWrap, { backgroundColor: Colors.primaryFaint }]}>
              <Text style={styles.logoEmoji}>🪡</Text>
            </View>
            <Text style={[styles.title, { color: Colors.textPrimary }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
              Sign in to access your cloud backup and sync your workshop across devices.
            </Text>
          </View>

          {/* ─── Form ─── */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: Colors.textSecondary }]}>Email</Text>
              <View style={[
                styles.inputWrap,
                { borderColor: emailError ? Colors.overdue : Colors.border, backgroundColor: Colors.surface }
              ]}>
                <Ionicons name="mail-outline" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: Colors.textPrimary }]}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setEmailError(''); }}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
              {emailError ? <Text style={[styles.fieldError, { color: Colors.overdue }]}>{emailError}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: Colors.textSecondary }]}>Password</Text>
              <View style={[
                styles.inputWrap,
                { borderColor: passwordError ? Colors.overdue : Colors.border, backgroundColor: Colors.surface }
              ]}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, { color: Colors.textPrimary }]}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
                  placeholder="Your password"
                  placeholderTextColor={Colors.textTertiary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={Colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={[styles.fieldError, { color: Colors.overdue }]}>{passwordError}</Text> : null}

              <TouchableOpacity style={styles.forgotBtn} onPress={() => {
                Alert.alert('Reset Password', 'Password reset will be available when TailorBook Cloud is activated. Your workshop is safe on this device.');
              }}>
                <Text style={[styles.forgotText, { color: Colors.primary }]}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: Colors.primary }, isLoading && { opacity: 0.7 }]}
              onPress={handleSignIn}
              disabled={isLoading}
              activeOpacity={0.88}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.ctaBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.switchRow}>
              <Text style={[styles.switchText, { color: Colors.textSecondary }]}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.replace('SignUp')}>
                <Text style={[styles.switchLink, { color: Colors.primary }]}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ─── Skip ─── */}
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={[styles.skipText, { color: Colors.textTertiary }]}>
              Continue without account
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (Colors: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
    },
    backBtn: { padding: Spacing.xs },
    scroll: {
      paddingHorizontal: Spacing.base,
      paddingBottom: Spacing.xxxl,
    },
    brandBlock: {
      alignItems: 'center',
      paddingVertical: Spacing.xl,
      marginBottom: Spacing.xl,
    },
    logoWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.lg,
      ...Shadow.sm,
    },
    logoEmoji: { fontSize: 34 },
    title: {
      fontSize: Typography.xxl,
      fontWeight: Typography.extrabold,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: Typography.base,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: Spacing.md,
    },
    form: { gap: Spacing.xs },
    fieldGroup: { marginBottom: Spacing.lg },
    label: {
      fontSize: Typography.sm,
      fontWeight: Typography.semibold,
      marginBottom: Spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.md,
      height: 52,
    },
    inputIcon: { marginRight: Spacing.sm },
    input: {
      flex: 1,
      fontSize: Typography.base,
      paddingVertical: 0,
    },
    fieldError: {
      fontSize: Typography.xs,
      marginTop: Spacing.xs,
      paddingLeft: Spacing.sm,
    },
    forgotBtn: { alignSelf: 'flex-end', marginTop: Spacing.sm },
    forgotText: { fontSize: Typography.sm, fontWeight: Typography.medium },
    ctaBtn: {
      borderRadius: Radius.xl,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.md,
      ...Shadow.md,
    },
    ctaBtnText: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: '#FFFFFF',
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.lg,
    },
    switchText: { fontSize: Typography.sm },
    switchLink: { fontSize: Typography.sm, fontWeight: Typography.bold },
    skipBtn: {
      alignItems: 'center',
      paddingVertical: Spacing.xl,
      marginTop: Spacing.xl,
    },
    skipText: { fontSize: Typography.sm },
  });

export default SignInScreen;
