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
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  BlouseIcon,
  GownIcon,
  KaftanIcon,
  SenatorIcon,
  ShirtIcon,
  SkirtIcon,
  SuitIcon,
  TrouserIcon,
  IconProps,
} from '../../../assets/icons/custom';
import { useStore } from '../../context/store';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { OutfitType } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────────────

type ApparelOption = { type: OutfitType } & (
  | { Icon: React.FC<IconProps>; ionicon?: never }
  | { Icon?: never; ionicon: string }
);

const APPARELS: ApparelOption[] = [
  { type: 'Senator', Icon: SenatorIcon },
  { type: 'Agbada',  ionicon: 'shirt-outline' },
  { type: 'Suit',    Icon: SuitIcon },
  { type: 'Gown',    Icon: GownIcon },
  { type: 'Kaftan',  Icon: KaftanIcon },
  { type: 'Shirt',   Icon: ShirtIcon },
  { type: 'Trouser', Icon: TrouserIcon },
  { type: 'Blouse',  Icon: BlouseIcon },
  { type: 'Skirt',   Icon: SkirtIcon },
  { type: 'Other',   ionicon: 'cut-outline' },
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

// Total steps: 0=identity, 1=photo, 2=apparels, 3=workdays, 4=currency → step 5 = completion
const TOTAL_STEPS = 5;

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
  const [profilePhotoUri, setProfilePhotoUri] = useState('');
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

  const pickPhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please allow access to your photo library to add a shop photo.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setProfilePhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Could not open photo library', 'You can add a photo later from Account settings.');
    }
  };

  const canProceedStep0 = tailorName.trim().length >= 2;
  const canProceedStep2 = selectedApparels.length > 0;
  const canProceedStep3 = workDays.length > 0;

  const goNext = () => setStep((s) => s + 1);

  const handleFinish = async () => {
    const defaultApparel = selectedApparels[0] || '';
    await saveSettings({
      ...settings,
      tailorName: tailorName.trim(),
      shopName: shopName.trim(),
      phone: phone.trim(),
      location: settings?.location || '',
      workDays: JSON.stringify(workDays),
      defaultApparel,
      currency,
      onboardingComplete: '1',
      profilePhotoUri: profilePhotoUri || '',
    });
    setDone(true);
  };

  if (done) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.doneContainer}>
          <Ionicons name="checkmark-circle" size={72} color={Colors.primary} />
          <Text style={styles.doneTitle}>You're all set!</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Completion Screen ────────────────────────────────────────────────────────
  if (step === TOTAL_STEPS) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.completionContainer}>
          <Ionicons name="sparkles" size={64} color={Colors.primary} style={{ marginBottom: Spacing.lg }} />
          <Text style={styles.completionTitle}>
            Welcome to TailorBook{tailorName ? `, ${tailorName}!` : '!'}
          </Text>
          <Text style={styles.completionSub}>
            Your workshop is set up and ready. Hit the button below to start.
          </Text>
          <View style={styles.completionBtnGroup}>
            <TouchableOpacity
              style={[styles.completionBtn, styles.completionBtnPrimary]}
              onPress={handleFinish}
              activeOpacity={0.85}
            >
              <Ionicons name="storefront-outline" size={32} color={Colors.white} style={{ marginBottom: Spacing.sm }} />
              <Text style={styles.completionBtnPrimaryLabel}>Open My Workshop</Text>
              <Text style={styles.completionBtnSub}>Your home screen is ready</Text>
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
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
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
              <View style={styles.stepIconWrap}>
                <Ionicons name="hand-left-outline" size={48} color={Colors.primary} />
              </View>
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

          {/* ─── Step 1: Shop Photo (optional) ─── */}
          {step === 1 && (
            <View style={{ alignItems: 'center' }}>
              <View style={styles.stepIconWrap}>
                <Ionicons name="camera-outline" size={48} color={Colors.primary} />
              </View>
              <Text style={styles.stepTitle}>Add your shop photo</Text>
              <Text style={styles.stepSub}>
                A photo of you or your shop front. This is optional — you can skip it.
              </Text>

              <TouchableOpacity onPress={pickPhoto} activeOpacity={0.85} style={styles.photoPicker}>
                {profilePhotoUri ? (
                  <Image
                    source={{ uri: profilePhotoUri }}
                    style={styles.photoPreview}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="camera" size={36} color={Colors.textTertiary} />
                    <Text style={styles.photoPlaceholderText}>Tap to choose photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              {profilePhotoUri ? (
                <TouchableOpacity onPress={() => setProfilePhotoUri('')} style={{ marginTop: Spacing.md }}>
                  <Text style={styles.removePhotoText}>Remove photo</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {/* ─── Step 2: Apparels ─── */}
          {step === 2 && (
            <View>
              <View style={styles.stepIconWrap}>
                <Ionicons name="cut-outline" size={48} color={Colors.primary} />
              </View>
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
                      {'Icon' in item && item.Icon ? (
                        <item.Icon
                          size={24}
                          color={isSelected ? Colors.primary : Colors.textTertiary}
                          style={{ marginBottom: 4 }}
                        />
                      ) : 'ionicon' in item ? (
                        <Ionicons
                          name={item.ionicon as any}
                          size={24}
                          color={isSelected ? Colors.primary : Colors.textTertiary}
                          style={{ marginBottom: 4 }}
                        />
                      ) : null}
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

          {/* ─── Step 3: Work Days ─── */}
          {step === 3 && (
            <View>
              <View style={styles.stepIconWrap}>
                <Ionicons name="calendar-outline" size={48} color={Colors.primary} />
              </View>
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

          {/* ─── Step 4: Currency ─── */}
          {step === 4 && (
            <View>
              <View style={styles.stepIconWrap}>
                <Ionicons name="cash-outline" size={48} color={Colors.primary} />
              </View>
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
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                      )}
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
                (step === 2 && !canProceedStep2) ||
                (step === 3 && !canProceedStep3)
              }
              activeOpacity={0.85}
              style={[
                styles.nextBtn,
                ((step === 0 && !canProceedStep0) ||
                  (step === 2 && !canProceedStep2) ||
                  (step === 3 && !canProceedStep3)) && styles.nextBtnDisabled,
              ]}
            >
              <Text style={styles.nextBtnText}>
                {step === 4 ? 'Almost done →' : 'Continue →'}
              </Text>
            </TouchableOpacity>

            {(step === 1 || step === 4) && (
              <TouchableOpacity onPress={goNext} style={{ marginTop: Spacing.md }}>
                <Text style={styles.skipText}>
                  {step === 1 ? 'Skip for now' : 'Skip currency selection'}
                </Text>
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

  stepIconWrap: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
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

  // Photo step
  photoPicker: {
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  photoPreview: { width: '100%', height: '100%' },
  photoPlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 90,
    borderStyle: 'dashed',
    gap: Spacing.sm,
  },
  photoPlaceholderText: {
    fontSize: Typography.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  removePhotoText: {
    fontSize: Typography.sm,
    color: Colors.overdue,
    fontWeight: Typography.medium,
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
  completionBtnPrimaryLabel: {
    fontSize: Typography.md, fontWeight: Typography.bold,
    color: Colors.white, marginBottom: 4,
  },
  completionBtnSub: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.8)' },

  doneContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  doneTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
});

export default OnboardingFlow;
