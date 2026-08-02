/**
 * SignUpScreen
 *
 * Optional cloud registration — the workshop always works without it.
 * Design philosophy: feels like gaining a superpower, not filling a form.
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

const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors: Colors, shadow} = useTheme();
  const { signUp } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const styles = React.useMemo(() => createStyles(Colors, shadow), [Colors, shadow]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!displayName.trim() || displayName.trim().length < 2) {
      newErrors.displayName = 'Please enter your full name';
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!password || password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = useCallback(async () => {
    if (!validate()) return;
    setIsLoading(true);

    try {
      const result = await signUp({
        email: email.trim().toLowerCase(),
        password,
        displayName: displayName.trim(),
      });

      if (result.success) {
        Alert.alert(
          'Account Created! 🎉',
          'Your TailorBook account is ready. Your workshop will now be backed up securely.',
          [{ text: 'Start Using Cloud', onPress: () => {
            if (navigation.canGoBack()) navigation.goBack();
          }}]
        );
      } else {
        Alert.alert('Sign Up', result.error || 'Registration failed. Please try again.', [{ text: 'OK' }]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [displayName, email, password, confirmPassword, signUp, navigation]);

  const Field = ({
    label, value, onChangeText, placeholder, secureTextEntry,
    keyboardType, returnKeyType, onSubmitEditing, inputRef,
    autoComplete, autoCapitalize, errorKey, rightElement,
  }: any) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: Colors.textSecondary }]}>{label}</Text>
      <View style={[
        styles.inputWrap,
        {
          borderColor: errors[errorKey] ? Colors.overdue : Colors.border,
          backgroundColor: Colors.surface,
        }
      ]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: Colors.textPrimary }]}
          value={value}
          onChangeText={(t: string) => { onChangeText(t); setErrors((e) => ({ ...e, [errorKey]: '' })); }}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType || 'default'}
          returnKeyType={returnKeyType || 'next'}
          onSubmitEditing={onSubmitEditing}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize || 'words'}
        />
        {rightElement}
      </View>
      {errors[errorKey] ? (
        <Text style={[styles.fieldError, { color: Colors.overdue }]}>{errors[errorKey]}</Text>
      ) : null}
    </View>
  );

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
              <Text style={styles.logoEmoji}>☁️</Text>
            </View>
            <Text style={[styles.title, { color: Colors.textPrimary }]}>
              Create your account
            </Text>
            <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
              Back up your workshop and access it from any device.
            </Text>
          </View>

          {/* ─── Form ─── */}
          <Field
            label="Your Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="e.g. Emeka Johnson"
            errorKey="displayName"
            autoComplete="name"
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            errorKey="email"
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
            returnKeyType="next"
            inputRef={emailRef}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            errorKey="password"
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            autoCapitalize="none"
            returnKeyType="next"
            inputRef={passwordRef}
            onSubmitEditing={() => confirmRef.current?.focus()}
            rightElement={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textTertiary} />
              </TouchableOpacity>
            }
          />
          <Field
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repeat your password"
            errorKey="confirmPassword"
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            autoCapitalize="none"
            returnKeyType="done"
            inputRef={confirmRef}
            onSubmitEditing={handleSignUp}
          />

          {/* ─── Sign Up Button ─── */}
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: Colors.primary }, isLoading && { opacity: 0.7 }]}
            onPress={handleSignUp}
            disabled={isLoading}
            activeOpacity={0.88}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.ctaBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* ─── Terms note ─── */}
          <Text style={[styles.termsNote, { color: Colors.textTertiary }]}>
            By creating an account, you agree to TailorBook's Terms of Service and Privacy Policy.
          </Text>

          {/* ─── Sign In Link ─── */}
          <View style={styles.switchRow}>
            <Text style={[styles.switchText, { color: Colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.replace('SignIn')}>
              <Text style={[styles.switchLink, { color: Colors.primary }]}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* ─── Skip ─── */}
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => navigation.goBack()}
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

const createStyles = (Colors: any, shadow: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
    scroll: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xxxl },
    brandBlock: {
      alignItems: 'center',
      paddingVertical: Spacing.xl,
      marginBottom: Spacing.lg,
    },
    logoWrap: {
      width: 72, height: 72, borderRadius: 36,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: Spacing.lg, ...shadow.sm,
    },
    logoEmoji: { fontSize: 34 },
    title: { fontSize: Typography.xl + 4, fontWeight: Typography.extrabold, textAlign: 'center', marginBottom: Spacing.sm },
    subtitle: { fontSize: Typography.base, textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing.md },
    fieldGroup: { marginBottom: Spacing.lg },
    label: { fontSize: Typography.sm, fontWeight: Typography.semibold, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.4 },
    inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, height: 52 },
    input: { flex: 1, fontSize: Typography.base, paddingVertical: 0 },
    fieldError: { fontSize: Typography.xs, marginTop: Spacing.xs, paddingLeft: Spacing.sm },
    ctaBtn: { borderRadius: Radius.xl, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.md, ...shadow.md },
    ctaBtnText: { fontSize: Typography.lg, fontWeight: Typography.bold, color: '#FFFFFF' },
    termsNote: { fontSize: Typography.xs, textAlign: 'center', lineHeight: 17, marginTop: Spacing.md, paddingHorizontal: Spacing.lg },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg },
    switchText: { fontSize: Typography.sm },
    switchLink: { fontSize: Typography.sm, fontWeight: Typography.bold },
    skipBtn: { alignItems: 'center', paddingVertical: Spacing.xl, marginTop: Spacing.md },
    skipText: { fontSize: Typography.sm },
  });

export default SignUpScreen;
