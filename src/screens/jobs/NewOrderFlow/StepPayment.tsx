import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Typography, Spacing, Radius, Shadow } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';
import { OrderDraft } from './index';

interface Props {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  onNext: () => void;
}

const QUICK_PRICES = [15000, 25000, 35000, 50000, 75000, 100000];
const DEPOSIT_PCTS = [
  { label: '50%', pct: 0.5 },
  { label: '30%', pct: 0.3 },
  { label: 'Full', pct: 1.0 },
  { label: 'None', pct: 0 },
];

function formatNaira(n: number): string {
  return '₦' + n.toLocaleString('en-NG');
}

const StepPayment: React.FC<Props> = ({ draft, onChange, onNext }) => {
  const { colors: Colors, shadow} = useTheme();
  const [priceStr, setPriceStr] = useState(draft.price || '');
  const [depositStr, setDepositStr] = useState(draft.deposit || '');
  const [notes, setNotes] = useState(draft.notes || '');

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

    chipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: Spacing.base,
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    priceChip: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderWidth: 2,
      borderColor: 'transparent',
      ...shadow.sm,
    },
    priceChipSelected: {
      borderColor: Colors.primary,
      backgroundColor: Colors.primaryFaint,
    },
    priceChipText: {
      fontSize: Typography.sm,
      fontWeight: Typography.semibold,
      color: Colors.textPrimary,
    },
    priceChipTextSelected: { color: Colors.primary },

    inputGroup: {
      paddingHorizontal: Spacing.base,
      marginBottom: Spacing.lg,
    },
    inputLabel: {
      fontSize: Typography.sm,
      fontWeight: Typography.semibold,
      color: Colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    nairaInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.base,
      ...shadow.sm,
    },
    nairaSign: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: Colors.textSecondary,
      marginRight: 6,
    },
    nairaInput: {
      flex: 1,
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
      paddingVertical: Spacing.md,
    },

    sectionHeader: { paddingHorizontal: Spacing.base, marginBottom: Spacing.md },
    sectionTitle: {
      fontSize: Typography.md,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
    },

    depositPctRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.base,
      marginBottom: Spacing.lg,
      flexWrap: 'wrap',
    },
    pctChip: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      borderWidth: 2,
      borderColor: 'transparent',
      alignItems: 'center',
      minWidth: 80,
      ...shadow.sm,
    },
    pctChipSelected: {
      borderColor: Colors.accent,
      backgroundColor: Colors.accentLight,
    },
    pctLabel: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
    },
    pctLabelSelected: { color: Colors.accent },
    pctAmount: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
    pctAmountSelected: { color: Colors.accent },

    balanceSummary: {
      marginHorizontal: Spacing.base,
      marginBottom: Spacing.xl,
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      ...shadow.sm,
    },
    balanceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    balanceTotalRow: {
      borderTopWidth: 1,
      borderTopColor: Colors.borderLight,
      marginTop: 4,
      paddingTop: 10,
    },
    balanceLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
    balanceValue: {
      fontSize: Typography.base,
      fontWeight: Typography.semibold,
      color: Colors.textPrimary,
    },
    balanceTotalLabel: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
    },
    balanceTotalValue: {
      fontSize: Typography.md,
      fontWeight: Typography.extrabold,
    },

    notesInput: {
      minHeight: 80,
      textAlignVertical: 'top',
      paddingTop: Spacing.md,
      fontSize: Typography.base,
      color: Colors.textPrimary,
      paddingVertical: Spacing.md,
      flex: undefined,
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
  }), [Colors, shadow]);

  const price = parseFloat(priceStr.replace(/,/g, '')) || 0;
  const deposit = parseFloat(depositStr.replace(/,/g, '')) || 0;
  const balance = Math.max(0, price - deposit);

  const canProceed = price > 0;

  const setDepositPct = (pct: number) => {
    const dep = Math.round(price * pct);
    setDepositStr(dep > 0 ? String(dep) : '');
  };

  const handleNext = () => {
    onChange({
      price: priceStr,
      deposit: depositStr,
      notes: notes.trim(),
    });
    onNext();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.promptBlock}>
          <Text style={styles.question}>Set the price</Text>
          <Text style={styles.subtitle}>How much does this order cost?</Text>
        </View>

        {/* ─── Quick Price Chips ─── */}
        <View style={styles.chipsWrap}>
          {QUICK_PRICES.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPriceStr(String(p))}
              activeOpacity={0.8}
              style={[
                styles.priceChip,
                price === p && styles.priceChipSelected,
              ]}
            >
              <Text style={[styles.priceChipText, price === p && styles.priceChipTextSelected]}>
                {formatNaira(p)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Price Input ─── */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Total Price (₦) *</Text>
          <View style={styles.nairaInputWrap}>
            <Text style={styles.nairaSign}>₦</Text>
            <TextInput
              style={styles.nairaInput}
              placeholder="0"
              placeholderTextColor={Colors.textTertiary}
              value={priceStr}
              onChangeText={setPriceStr}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* ─── Deposit ─── */}
        {price > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Deposit collected</Text>
            </View>

            <View style={styles.depositPctRow}>
              {DEPOSIT_PCTS.map((d) => {
                const dep = Math.round(price * d.pct);
                const isSelected = deposit === dep && priceStr !== '';
                return (
                  <TouchableOpacity
                    key={d.label}
                    onPress={() => setDepositPct(d.pct)}
                    activeOpacity={0.8}
                    style={[styles.pctChip, isSelected && styles.pctChipSelected]}
                  >
                    <Text style={[styles.pctLabel, isSelected && styles.pctLabelSelected]}>
                      {d.label}
                    </Text>
                    <Text style={[styles.pctAmount, isSelected && styles.pctAmountSelected]}>
                      {d.pct > 0 ? formatNaira(dep) : 'No deposit'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Deposit Amount (₦)</Text>
              <View style={styles.nairaInputWrap}>
                <Text style={styles.nairaSign}>₦</Text>
                <TextInput
                  style={styles.nairaInput}
                  placeholder="0"
                  placeholderTextColor={Colors.textTertiary}
                  value={depositStr}
                  onChangeText={setDepositStr}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Balance summary */}
            <View style={styles.balanceSummary}>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Total</Text>
                <Text style={styles.balanceValue}>{formatNaira(price)}</Text>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Deposit</Text>
                <Text style={[styles.balanceValue, { color: Colors.ready }]}>
                  {formatNaira(deposit)}
                </Text>
              </View>
              <View style={[styles.balanceRow, styles.balanceTotalRow]}>
                <Text style={styles.balanceTotalLabel}>Balance Due</Text>
                <Text
                  style={[
                    styles.balanceTotalValue,
                    { color: balance > 0 ? Colors.overdue : Colors.ready },
                  ]}
                >
                  {formatNaira(balance)}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ─── Notes ─── */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Order notes (optional)</Text>
          <TextInput
            style={[styles.nairaInput, styles.notesInput]}
            placeholder="Any special instructions, color, style notes..."
            placeholderTextColor={Colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* ─── Footer ─── */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleNext}
            disabled={!canProceed}
            style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
          >
            <Text style={styles.nextBtnText}>Review Order →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default StepPayment;
