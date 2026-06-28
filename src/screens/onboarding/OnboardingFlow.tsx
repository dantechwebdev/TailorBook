import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useStore } from '../../context/store';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { OutfitType } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const APPARELS: { type: OutfitType; emoji: string }[] = [
  { type: 'Senator', emoji: '👘' },
  { type: 'Agbada', emoji: '🥻' },
  { type: 'Suit', emoji: '🤵' },
  { type: 'Gown', emoji: '👗' },
  { type: 'Kaftan', emoji: '🧥' },
  { type: 'Shirt', emoji: '👔' },
  { type: 'Trouser', emoji: '👖' },
  { type: 'Blouse', emoji: '👚' },
  { type: 'Skirt', emoji: '🪡' },
  { type: 'Other', emoji: '✂️' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CURRENCIES = [
  { symbol: '₦', label: 'Naira (NGN)' },
  { symbol: '$', label: 'Dollar (USD)' },
  { symbol: '£', label: 'Pound (GBP)' },
  { symbol: '€', label: 'Euro (EUR)' },
  { symbol: 'GH₵', label: 'Cedi (GHS)' },
  { symbol: 'KSh', label: 'Shilling (KES)' },
];

// ─── OnboardingFlow ───────────────────────────────────────────────────────────

interface Props {
  onComplete: () => void;
}

const OnboardingFlow: React.FC<Props> = ({ onComplete }) => {
  const { settings, saveSettings } = useStore();

  const [step, setStep] = useState(0);
  const [tailorName, setTailorName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedApparels, setSelectedApparels] = useState<OutfitType[]>([]);
  const [workDays, setWorkDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [currency, setCurrency] = useState('₦');
  const [done, setDone] = useState(false);

  const toggleApparel = (type: OutfitType) => {
    setSelectedApparels((prev) =>
      prev.includes(type) ? prev.filter((a) => a !== type) : [...prev, type]
    );
  };

  const toggleDay = (day: string) => {
    setWorkDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const canProceedStep0 = tailorName.trim().length >= 2;
  const canProceedStep1 = selectedApparels.length > 0;
  const canProceedStep2 = workDays.length > 0;

  const goNext = () => setStep((s) => s + 1);

  const handleFinish = async (destination: 'job' | 'workshop') => {
    const defaultApparel = selectedApparels[0] || '';
    await saveSettings({
      ...settings,
      tailorName: tailorName.trim(),
      shopName: shopName.trim(),
      phone: phone.trim(),
      workDays: JSON.stringify(workDays),
      defaultApparel,
      currency,
      onboardingComplete: '1',
    });
    setDone(true);
    setTimeout(() => onComplete(), 200);
  };

  if (done) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.doneContainer}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>You're all set!</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Completion Screen ────────────────────────────────────────────────────────
  if (step === 4) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={styles.completionTitle}>
            Welcome to TailorBook{tailorName ? `, ${tailorName}!` : '!'}
          </Text>
          <Text style={styles.completionSub}>
            Your workshop is set up and ready. Where would you like to start?
          </Text>
          <View style={styles.completionBtnGroup}>
            <TouchableOpacity
              style={[styles.completionBtn, styles.completionBtnPrimary]}
              onPress={() => handleFinish('job')}
              activeOpacity={0.85}
            >
              <Text style={styles.completionBtnPrimaryIcon}>✂️</Text>
              <Text style={styles.completionBtnPrimaryLabel}>Create First Job</Text>
              <Text style={styles.completionBtnSub}>Start taking orders right away</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.completionBtn, styles.completionBtnSecondary]}
              onPress={() => handleFinish('workshop')}
              activeOpacity={0.85}
            >
              <Text style={styles.completionBtnPrimaryIcon}>🏪</Text>
              <Text style={styles.completionBtnSecondaryLabel}>Open My Workshop</Text>
              <Text style={styles.completionBtnSubSecondary}>Explore the app first</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ─── Progress Dots ─── */}
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, step === i && styles.dotActive]} />
          ))}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Step 0: Identity ─── */}
          {step === 0 && (
            <View>
              <Text style={styles.stepEmoji}>👋</Text>
              <Text style={styles.stepTitle}>Welcome! Let's set up your workshop</Text>
              <Text style={styles.stepSub}>Tell us a bit about you and your business</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Your Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Emeka Johnson"
                  placeholderTextColor={Colors.textTertiary}
                  value={tailorName}
                  onChangeText={setTailorName}
                  autoCapitalize="words"
                  autoFocus
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Shop / Business Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. EJ Fashion House"
                  placeholderTextColor={Colors.textTertiary}
                  value={shopName}
                  onChangeText={setShopName}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 0803 123 4567"
                  placeholderTextColor={Colors.textTertiary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          )}

          {/* ─── Step 1: Apparels ─── */}
          {step === 1 && (
            <View>
              <Text style={styles.stepEmoji}>✂️</Text>
              <Text style={styles.stepTitle}>What do you sew?</Text>
              <Text style={styles.stepSub}>
                Select the garments you typically make. The first one will be your default.
              </Text>
              <View style={styles.apparelGrid}>
                {APPARELS.map((item) => {
                  const isSelected = selectedApparels.includes(item.type);
                  const orderIdx = selectedApparels.indexOf(item.type);
                  return (
                    <TouchableOpacity
                      key={item.type}
                      onPress={() => toggleApparel(item.type)}
                      activeOpacity={0.8}
                      style={[styles.apparelCard, isSelected && styles.apparelCardSelected]}
                    >
                      {isSelected && (
                        <View style={styles.apparelBadge}>
                          <Text style={styles.apparelBadgeText}>{orderIdx + 1}</Text>
                        </View>
                      )}
                      <Text style={styles.apparelEmoji}>{item.emoji}</Text>
                      <Text style={[styles.apparelName, isSelected && { color: Colors.primary }]}>
                        {item.type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {selectedApparels.length > 0 && (
                <Text style={styles.defaultHint}>
                  Default: {selectedApparels[0]} (selected first)
                </Text>
              )}
            </View>
          )}

          {/* ─── Step 2: Work Days ─── */}
          {step === 2 && (
            <View>
              <Text style={styles.stepEmoji}>📅</Text>
              <Text style={styles.stepTitle}>When do you work?</Text>
              <Text style={styles.stepSub}>Select your regular working days</Text>
              <View style={styles.daysGrid}>
                {DAYS.map((day) => {
                  const isOn = workDays.includes(day);
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
          )}

          {/* ─── Step 3: Currency ─── */}
          {step === 3 && (
            <View>
              <Text style={styles.stepEmoji}>💰</Text>
              <Text style={styles.stepTitle}>What currency do you use?</Text>
              <Text style={styles.stepSub}>We'll use this for all your pricing</Text>
              <View style={styles.currencyList}>
                {CURRENCIES.map((c) => {
                  const isSelected = currency === c.symbol;
                  return (
                    <TouchableOpacity
                      key={c.symbol}
                      onPress={() => setCurrency(c.symbol)}
                      activeOpacity={0.8}
                      style={[styles.currencyRow, isSelected && styles.currencyRowSelected]}
                    >
                      <Text style={styles.currencySymbol}>{c.symbol}</Text>
                      <Text style={[styles.currencyLabel, isSelected && { color: Colors.primary }]}>
                        {c.label}
                      </Text>
                      {isSelected && <Text style={styles.currencyCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ─── Footer CTA ─── */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={goNext}
              disabled={
                (step === 0 && !canProceedStep0) ||
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2)
              }
              activeOpacity={0.85}
              style={[
                styles.nextBtn,
                ((step === 0 && !canProceedStep0) ||
                  (step === 1 && !canProceedStep1) ||
                  (step === 2 && !canProceedStep2)) && styles.nextBtnDisabled,
              ]}
            >
              <Text style={styles.nextBtnText}>
                {step === 3 ? 'Almost done →' : 'Continue →'}
              </Text>
            </TouchableOpacity>
            {step === 3 && (
              <TouchableOpacity onPress={goNext} style={{ marginTop: Spacing.md }}>
                <Text style={styles.skipText}>Skip currency selection</Text>
              </TouchableOpacity>
            )}
            {step > 0 && (
              <TouchableOpacity onPress={() => setStep((s) => s - 1)} style={{ marginTop: Spacing.md }}>
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.borderLight,
  },
  dotActive: { backgroundColor: Colors.primary, width: 24 },
  scrollContent: { paddingHorizontal: Spacing.base, paddingBottom: 60 },

  stepEmoji: { fontSize: 52, textAlign: 'center', marginTop: Spacing.xl, marginBottom: Spacing.md },
  stepTitle: {
    fontSize: Typography.xl + 2,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  stepSub: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },

  inputGroup: { marginBottom: Spacing.md },
  inputLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md + 2,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    ...Shadow.sm,
  },

  apparelGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: Spacing.md,
  },
  apparelCard: {
    width: '30%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadow.sm,
    minHeight: 90,
    justifyContent: 'center',
    position: 'relative',
  },
  apparelCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryFaint },
  apparelBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  apparelBadgeText: { color: Colors.white, fontSize: 10, fontWeight: Typography.bold },
  apparelEmoji: { fontSize: 24, marginBottom: 4 },
  apparelName: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textSecondary },
  defaultHint: {
    textAlign: 'center',
    marginTop: Spacing.md,
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.medium,
  },

  daysGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: Spacing.md, justifyContent: 'center',
  },
  dayChip: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadow.sm,
  },
  dayChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryFaint },
  dayChipText: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textSecondary },
  dayChipTextActive: { color: Colors.primary },

  currencyList: { gap: Spacing.sm },
  currencyRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadow.sm,
    gap: Spacing.md,
  },
  currencyRowSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryFaint },
  currencySymbol: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, width: 36 },
  currencyLabel: { flex: 1, fontSize: Typography.base, color: Colors.textSecondary },
  currencyCheck: { fontSize: Typography.base, color: Colors.primary, fontWeight: Typography.bold },

  footer: { marginTop: Spacing.xxl, paddingBottom: Spacing.xxl, alignItems: 'center' },
  nextBtn: {
    width: '100%', backgroundColor: Colors.primary,
    paddingVertical: Spacing.md + 4,
    borderRadius: Radius.lg, alignItems: 'center',
    ...Shadow.md,
  },
  nextBtnDisabled: { backgroundColor: Colors.border },
  nextBtnText: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.white },
  skipText: { fontSize: Typography.sm, color: Colors.textTertiary },
  backText: { fontSize: Typography.sm, color: Colors.textSecondary },

  // Completion screen
  completionContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  completionEmoji: { fontSize: 72, marginBottom: Spacing.lg },
  completionTitle: {
    fontSize: Typography.xl + 4,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  completionSub: {
    fontSize: Typography.base, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 24,
    marginBottom: Spacing.xxxl,
  },
  completionBtnGroup: { width: '100%', gap: Spacing.md },
  completionBtn: {
    borderRadius: Radius.xl, padding: Spacing.xl,
    alignItems: 'center', ...Shadow.md,
  },
  completionBtnPrimary: { backgroundColor: Colors.primary },
  completionBtnSecondary: {
    backgroundColor: Colors.surface,
    borderWidth: 2, borderColor: Colors.border,
  },
  completionBtnPrimaryIcon: { fontSize: 32, marginBottom: Spacing.sm },
  completionBtnPrimaryLabel: {
    fontSize: Typography.md, fontWeight: Typography.bold,
    color: Colors.white, marginBottom: 4,
  },
  completionBtnSecondaryLabel: {
    fontSize: Typography.md, fontWeight: Typography.bold,
    color: Colors.textPrimary, marginBottom: 4,
  },
  completionBtnSub: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.8)' },
  completionBtnSubSecondary: { fontSize: Typography.sm, color: Colors.textSecondary },

  doneContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  doneEmoji: { fontSize: 72, marginBottom: Spacing.lg },
  doneTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
});

export default OnboardingFlow;
