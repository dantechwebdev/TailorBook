import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Typography, Spacing, Radius, Shadow } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';
import { DeliveryType } from '../../../types';
import { OrderDraft } from './index';
import { addDays, format, parse, isValid } from 'date-fns';

interface Props {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  onNext: () => void;
}

function getPresets() {
  const today = new Date();
  return [
    { label: 'In 3 days', date: addDays(today, 3) },
    { label: 'In 1 week', date: addDays(today, 7) },
    { label: 'In 2 weeks', date: addDays(today, 14) },
    { label: 'In 3 weeks', date: addDays(today, 21) },
    { label: 'In 1 month', date: addDays(today, 30) },
    { label: 'In 6 weeks', date: addDays(today, 42) },
  ];
}

function formatDisplayDate(iso: string): string {
  if (!iso) return '';
  try {
    return format(new Date(iso + 'T00:00:00'), 'EEE, d MMM yyyy');
  } catch {
    return iso;
  }
}

function parseCustomDate(input: string): string | null {
  const clean = input.trim();
  if (!clean) return null;

  const tryFormats = [
    { fmt: 'dd/MM/yyyy', val: clean },
    { fmt: 'dd-MM-yyyy', val: clean },
    { fmt: 'yyyy-MM-dd', val: clean },
    { fmt: 'dd/MM/yy', val: clean },
    { fmt: 'ddMMyyyy', val: clean.replace(/\D/g, '') },
  ];

  for (const { fmt, val } of tryFormats) {
    try {
      const parsed = parse(val, fmt, new Date());
      if (isValid(parsed) && parsed.getFullYear() >= new Date().getFullYear()) {
        return format(parsed, 'yyyy-MM-dd');
      }
    } catch {}
  }
  return null;
}

const StepDelivery: React.FC<Props> = ({ draft, onChange, onNext }) => {
  const { colors: Colors } = useTheme();
  const [address, setAddress] = useState(draft.deliveryAddress);
  const [customDateInput, setCustomDateInput] = useState('');
  const [customDateError, setCustomDateError] = useState('');
  const presets = getPresets();

  const styles = useMemo(() => StyleSheet.create({
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

    presetsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: Spacing.base,
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    presetChip: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.base,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
      minWidth: 100,
      ...Shadow.sm,
    },
    presetChipSelected: {
      borderColor: Colors.primary,
      backgroundColor: Colors.primaryFaint,
    },
    presetLabel: {
      fontSize: Typography.sm,
      fontWeight: Typography.semibold,
      color: Colors.textPrimary,
    },
    presetLabelSelected: { color: Colors.primary },
    presetDate: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
    presetDateSelected: { color: Colors.primaryLight },

    customDateBlock: {
      paddingHorizontal: Spacing.base,
      marginBottom: Spacing.md,
    },
    customDateInput: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      fontSize: Typography.base,
      color: Colors.textPrimary,
      borderWidth: 1.5,
      borderColor: Colors.border,
    },
    customDateInputError: {
      borderColor: Colors.overdue,
    },
    errorText: {
      fontSize: Typography.xs,
      color: Colors.overdue,
      marginTop: 4,
    },

    selectedDateBox: {
      marginHorizontal: Spacing.base,
      marginBottom: Spacing.lg,
      backgroundColor: Colors.readyLight,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      borderLeftWidth: 3,
      borderLeftColor: Colors.ready,
    },
    selectedDateLabel: { fontSize: Typography.xs, color: Colors.ready, fontWeight: Typography.semibold },
    selectedDateValue: {
      fontSize: Typography.md,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
      marginTop: 2,
    },

    sectionHeader: {
      paddingHorizontal: Spacing.base,
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      fontSize: Typography.md,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
    },
    deliveryRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      paddingHorizontal: Spacing.base,
      marginBottom: Spacing.xl,
    },
    deliveryCard: {
      flex: 1,
      backgroundColor: Colors.surface,
      borderRadius: Radius.xl,
      padding: Spacing.lg,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
      ...Shadow.sm,
      minHeight: 120,
      justifyContent: 'center',
    },
    deliveryCardSelected: {
      borderColor: Colors.primary,
      backgroundColor: Colors.primaryFaint,
    },
    deliveryEmoji: { fontSize: 32, marginBottom: Spacing.sm },
    deliveryLabel: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
      marginBottom: 4,
    },
    deliveryLabelSelected: { color: Colors.primary },
    deliverySub: { fontSize: Typography.xs, color: Colors.textSecondary, textAlign: 'center' },

    addressBlock: { paddingHorizontal: Spacing.base, marginBottom: Spacing.xl },
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
      paddingVertical: Spacing.md,
      fontSize: Typography.base,
      color: Colors.textPrimary,
      ...Shadow.sm,
    },
    inputHint: {
      fontSize: Typography.xs,
      color: Colors.textTertiary,
      marginTop: 6,
    },

    footer: { padding: Spacing.base, paddingBottom: Spacing.xxl },
    nextBtn: {
      backgroundColor: Colors.primary,
      paddingVertical: Spacing.md + 2,
      borderRadius: Radius.lg,
      alignItems: 'center',
    },
    nextBtnDisabled: { backgroundColor: Colors.border },
    nextBtnText: { fontSize: Typography.base, color: Colors.white, fontWeight: Typography.bold },
  }), [Colors]);

  const selectedDate = draft.deliveryDate;
  const deliveryType = draft.deliveryType;

  const canProceed = !!selectedDate && (deliveryType === 'pickup' || address.trim().length > 2);

  const selectPreset = (date: Date) => {
    setCustomDateInput('');
    setCustomDateError('');
    onChange({ deliveryDate: format(date, 'yyyy-MM-dd') });
  };

  const handleCustomDateChange = (val: string) => {
    setCustomDateInput(val);
    setCustomDateError('');
    const parsed = parseCustomDate(val);
    if (parsed) {
      onChange({ deliveryDate: parsed });
    }
  };

  const handleCustomDateBlur = () => {
    if (customDateInput.trim() && !parseCustomDate(customDateInput)) {
      setCustomDateError('Enter date as DD/MM/YYYY e.g. 25/12/2025');
    }
  };

  const handleNext = () => {
    onChange({ deliveryAddress: address.trim() });
    onNext();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ─── Delivery Date ─────────────────────────────────────────────────── */}
      <View style={styles.promptBlock}>
        <Text style={styles.question}>When is it due?</Text>
        <Text style={styles.subtitle}>Pick a preset or enter a custom date</Text>
      </View>

      {/* Quick presets */}
      <View style={styles.presetsWrap}>
        {presets.map((preset) => {
          const isoVal = format(preset.date, 'yyyy-MM-dd');
          const isSelected = selectedDate === isoVal;
          return (
            <TouchableOpacity
              key={preset.label}
              onPress={() => selectPreset(preset.date)}
              activeOpacity={0.8}
              style={[styles.presetChip, isSelected && styles.presetChipSelected]}
            >
              <Text style={[styles.presetLabel, isSelected && styles.presetLabelSelected]}>
                {preset.label}
              </Text>
              <Text style={[styles.presetDate, isSelected && styles.presetDateSelected]}>
                {format(preset.date, 'd MMM')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom date input */}
      <View style={styles.customDateBlock}>
        <Text style={styles.inputLabel}>Or enter a specific date</Text>
        <TextInput
          style={[styles.customDateInput, customDateError ? styles.customDateInputError : null]}
          placeholder="DD/MM/YYYY  e.g. 25/12/2025"
          placeholderTextColor={Colors.textTertiary}
          value={customDateInput}
          onChangeText={handleCustomDateChange}
          onBlur={handleCustomDateBlur}
          keyboardType="numeric"
          maxLength={10}
        />
        {customDateError ? (
          <Text style={styles.errorText}>{customDateError}</Text>
        ) : null}
      </View>

      {selectedDate ? (
        <View style={styles.selectedDateBox}>
          <Text style={styles.selectedDateLabel}>Selected date</Text>
          <Text style={styles.selectedDateValue}>{formatDisplayDate(selectedDate)}</Text>
        </View>
      ) : null}

      {/* ─── Delivery Type ─────────────────────────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>How will you deliver?</Text>
      </View>

      <View style={styles.deliveryRow}>
        <TouchableOpacity
          onPress={() => onChange({ deliveryType: 'pickup' })}
          activeOpacity={0.85}
          style={[
            styles.deliveryCard,
            deliveryType === 'pickup' && styles.deliveryCardSelected,
          ]}
        >
          <Text style={styles.deliveryEmoji}>🏪</Text>
          <Text style={[styles.deliveryLabel, deliveryType === 'pickup' && styles.deliveryLabelSelected]}>
            Pick Up
          </Text>
          <Text style={styles.deliverySub}>Customer comes to shop</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onChange({ deliveryType: 'waybill' })}
          activeOpacity={0.85}
          style={[
            styles.deliveryCard,
            deliveryType === 'waybill' && styles.deliveryCardSelected,
          ]}
        >
          <Text style={styles.deliveryEmoji}>📦</Text>
          <Text style={[styles.deliveryLabel, deliveryType === 'waybill' && styles.deliveryLabelSelected]}>
            Waybill
          </Text>
          <Text style={styles.deliverySub}>Ship to customer</Text>
        </TouchableOpacity>
      </View>

      {/* Waybill destination */}
      {deliveryType === 'waybill' && (
        <View style={styles.addressBlock}>
          <Text style={styles.inputLabel}>Delivery destination *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Port Harcourt, Abuja, Lagos..."
            placeholderTextColor={Colors.textTertiary}
            value={address}
            onChangeText={setAddress}
            autoFocus
          />
          <Text style={styles.inputHint}>
            City or address where item will be waybilled
          </Text>
        </View>
      )}

      {/* ─── Footer ─── */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={!canProceed}
          style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
        >
          <Text style={styles.nextBtnText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default StepDelivery;
