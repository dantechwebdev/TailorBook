import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../../constants/theme';
import { OutfitType } from '../../../types';
import { OrderDraft } from './index';

interface Props {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  onNext: () => void;
}

const GARMENT_OPTIONS: { type: OutfitType; emoji: string; desc: string }[] = [
  { type: 'Agbada', emoji: '🥻', desc: 'Full Agbada set' },
  { type: 'Senator', emoji: '👘', desc: 'Senator suit' },
  { type: 'Suit', emoji: '🤵', desc: 'Suit & trousers' },
  { type: 'Gown', emoji: '👗', desc: "Women's gown" },
  { type: 'Kaftan', emoji: '🧥', desc: 'Kaftan style' },
  { type: 'Shirt', emoji: '👔', desc: 'Bespoke shirt' },
  { type: 'Trouser', emoji: '👖', desc: 'Trousers only' },
  { type: 'Blouse', emoji: '👚', desc: 'Blouse / top' },
  { type: 'Skirt', emoji: '🪡', desc: 'Skirt' },
  { type: 'Other', emoji: '✂️', desc: 'Custom / other' },
];

const StepGarment: React.FC<Props> = ({ draft, onChange, onNext }) => {
  const [style, setStyle] = useState(draft.style);
  const [fabric, setFabric] = useState(draft.fabric);

  const selected = draft.outfitType;

  const handleNext = () => {
    onChange({ style: style.trim(), fabric: fabric.trim() });
    onNext();
  };

  const canProceed = !!selected;

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
          const isSelected = selected === item.type;
          return (
            <TouchableOpacity
              key={item.type}
              onPress={() => onChange({ outfitType: item.type })}
              activeOpacity={0.8}
              style={[styles.garmentCard, isSelected && styles.garmentCardSelected]}
            >
              <Text style={styles.garmentEmoji}>{item.emoji}</Text>
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
          <Text style={styles.nextBtnText}>
            {selected ? `Continue with ${selected} →` : 'Select a garment to continue'}
          </Text>
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
