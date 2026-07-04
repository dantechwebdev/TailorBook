import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
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
} from '../../../../assets/icons/custom';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../../constants/theme';
import { OutfitType } from '../../../types';
import { OrderDraft } from './index';

interface Props {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  onNext: () => void;
}

type GarmentOption = {
  type: OutfitType;
  desc: string;
} & (
  | { Icon: React.FC<IconProps>; emoji?: never }
  | { Icon?: never; emoji: string }
);

const GARMENT_OPTIONS: GarmentOption[] = [
  { type: 'Senator', Icon: SenatorIcon, desc: 'Senator suit' },
  { type: 'Suit',    Icon: SuitIcon,    desc: 'Suit & trousers' },
  { type: 'Kaftan',  Icon: KaftanIcon,  desc: 'Kaftan style' },
  { type: 'Gown',    Icon: GownIcon,    desc: "Women's gown" },
  { type: 'Shirt',   Icon: ShirtIcon,   desc: 'Bespoke shirt' },
  { type: 'Trouser', Icon: TrouserIcon, desc: 'Trousers only' },
  { type: 'Blouse',  Icon: BlouseIcon,  desc: 'Blouse / top' },
  { type: 'Skirt',   Icon: SkirtIcon,   desc: 'Skirt' },
  { type: 'Agbada',  emoji: '🥻',       desc: 'Full Agbada set' },
  { type: 'Other',   emoji: '✂️',       desc: 'Custom / other' },
];

const KNOWN_TYPES = GARMENT_OPTIONS.map((o) => o.type);

const StepGarment: React.FC<Props> = ({ draft, onChange, onNext }) => {
  const [style, setStyle] = useState(draft.style);
  const [fabric, setFabric] = useState(draft.fabric);

  const isInitiallyCustom =
    draft.outfitType !== '' && !KNOWN_TYPES.includes(draft.outfitType as OutfitType);

  const [isCustom, setIsCustom] = useState(isInitiallyCustom);
  const [customTypeText, setCustomTypeText] = useState(isInitiallyCustom ? draft.outfitType : '');

  const customInputRef = useRef<TextInput>(null);

  const selected = draft.outfitType;

  const handleSelectOption = (type: OutfitType) => {
    if (type === 'Other') {
      setIsCustom(true);
      onChange({ outfitType: customTypeText.trim() });
      setTimeout(() => customInputRef.current?.focus(), 100);
    } else {
      setIsCustom(false);
      setCustomTypeText('');
      onChange({ outfitType: type });
    }
  };

  const handleCustomTextChange = (text: string) => {
    setCustomTypeText(text);
    onChange({ outfitType: text.trim() });
  };

  const handleNext = () => {
    onChange({ style: style.trim(), fabric: fabric.trim() });
    onNext();
  };

  const canProceed = !!selected;

  const continueLabel = selected
    ? `Continue with ${selected} →`
    : isCustom
    ? 'Enter garment name to continue'
    : 'Select a garment to continue';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.promptBlock}>
        <Text style={styles.question}>What are we making?</Text>
        <Text style={styles.subtitle}>Tap to select the garment type</Text>
      </View>

      {/* ─── Garment Grid ─── */}
      <View style={styles.grid}>
        {GARMENT_OPTIONS.map((item) => {
          const isSelected = item.type === 'Other' ? isCustom : (!isCustom && selected === item.type);
          return (
            <TouchableOpacity
              key={item.type}
              onPress={() => handleSelectOption(item.type)}
              activeOpacity={0.8}
              style={[styles.garmentCard, isSelected && styles.garmentCardSelected]}
            >
              {'Icon' in item && item.Icon ? (
                <item.Icon
                  size={30}
                  color={isSelected ? Colors.primary : Colors.textSecondary}
                  style={{ marginBottom: Spacing.sm }}
                />
              ) : (
                <Text style={styles.garmentEmoji}>{item.emoji}</Text>
              )}
              <Text style={[styles.garmentName, isSelected && styles.garmentNameSelected]}>
                {item.type}
              </Text>
              <Text style={[styles.garmentDesc, isSelected && styles.garmentDescSelected]}>
                {item.desc}
              </Text>
              {isSelected && (
                <View style={styles.selectedTick}>
                  <Text style={styles.tickText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ─── Custom Garment Input ─── */}
      {isCustom && (
        <View style={styles.customInputBlock}>
          <Text style={styles.customInputLabel}>Garment name</Text>
          <TextInput
            ref={customInputRef}
            style={styles.customInput}
            placeholder="e.g. Babariga, Jumpsuit, Corset..."
            placeholderTextColor={Colors.textTertiary}
            value={customTypeText}
            onChangeText={handleCustomTextChange}
            autoCapitalize="words"
            returnKeyType="done"
          />
          {customTypeText.trim().length === 0 && (
            <Text style={styles.customInputHint}>Please enter the garment name to continue</Text>
          )}
        </View>
      )}

      {/* ─── Optional fields ─── */}
      <View style={styles.optionalBlock}>
        <Text style={styles.optionalTitle}>Style details (optional)</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Style / Cut</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Slim fit, V-neck, Three-piece..."
            placeholderTextColor={Colors.textTertiary}
            value={style}
            onChangeText={setStyle}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Fabric / Material</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ankara, Cashmere, Lace, Silk..."
            placeholderTextColor={Colors.textTertiary}
            value={fabric}
            onChangeText={setFabric}
          />
        </View>
      </View>

      {/* ─── Footer ─── */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={!canProceed}
          style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
        >
          <Text style={styles.nextBtnText}>{continueLabel}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 100 },
  promptBlock: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  question: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: { fontSize: Typography.base, color: Colors.textSecondary },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },
  garmentCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadow.sm,
    minHeight: 110,
    justifyContent: 'center',
    position: 'relative',
  },
  garmentCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaint,
  },
  garmentEmoji: { fontSize: 28, marginBottom: Spacing.sm },
  garmentName: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
  },
  garmentNameSelected: { color: Colors.primary },
  garmentDesc: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  garmentDescSelected: { color: Colors.primaryLight },
  selectedTick: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickText: { color: Colors.white, fontSize: 11, fontWeight: Typography.bold },
  customInputBlock: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: Spacing.base,
    ...Shadow.sm,
  },
  customInputLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  customInput: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  customInputHint: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
  },
  optionalBlock: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },
  optionalTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputGroup: { marginBottom: Spacing.md },
  inputLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    ...Shadow.sm,
  },
  footer: {
    padding: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  nextBtnDisabled: { backgroundColor: Colors.border },
  nextBtnText: {
    fontSize: Typography.base,
    color: Colors.white,
    fontWeight: Typography.bold,
  },
});

export default StepGarment;
