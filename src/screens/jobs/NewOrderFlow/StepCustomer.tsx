import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius, Shadow } from '../../../constants/theme';
import { Avatar } from '../../../components/common/UI';
import ContactPickerButton from '../../../components/common/ContactPickerButton';
import { useStore } from '../../../context/store';
import { useTheme } from '../../../context/ThemeContext';
import { Customer } from '../../../types';
import { OrderDraft } from './index';

interface Props {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  onNext: () => void;
  prefilledCustomerId?: string;
}

const StepCustomer: React.FC<Props> = ({ draft, onChange, onNext, prefilledCustomerId }) => {
  const { customers, getCustomer } = useStore();
  const { colors: Colors } = useTheme();
  const [mode, setMode] = useState<'choose' | 'existing' | 'new'>(
    draft.customer ? 'existing' : 'choose'
  );
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState(draft.newCustomerName);
  const [newPhone, setNewPhone] = useState(draft.newCustomerPhone);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
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
    subtitle: { fontSize: Typography.base, color: Colors.textSecondary, lineHeight: 22 },
    choiceRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      paddingHorizontal: Spacing.base,
      marginTop: Spacing.md,
    },
    choiceCard: {
      flex: 1,
      backgroundColor: Colors.surface,
      borderRadius: Radius.xl,
      padding: Spacing.xl,
      alignItems: 'center',
      ...Shadow.sm,
      minHeight: 130,
      justifyContent: 'center',
    },
    choiceLabel: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
      textAlign: 'center',
      marginBottom: 4,
    },
    choiceSub: { fontSize: Typography.sm, color: Colors.textSecondary },
    searchBox: {
      marginHorizontal: Spacing.base,
      marginBottom: Spacing.md,
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      ...Shadow.sm,
    },
    searchInput: {
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      fontSize: Typography.base,
      color: Colors.textPrimary,
    },
    list: { flex: 1, paddingHorizontal: Spacing.base },
    customerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      gap: Spacing.md,
      ...Shadow.sm,
    },
    customerRowSelected: {
      borderWidth: 2,
      borderColor: Colors.primary,
      backgroundColor: Colors.primaryFaint,
    },
    customerInfo: { flex: 1 },
    customerName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
    customerPhone: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
    checkCircle: {
      width: 26, height: 26, borderRadius: 13,
      backgroundColor: Colors.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    checkMark: { color: Colors.white, fontSize: 14, fontWeight: Typography.bold },
    emptySearch: { padding: Spacing.xxl, alignItems: 'center' },
    emptySearchText: { fontSize: Typography.base, color: Colors.textSecondary },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    inputGroup: { paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
    inputLabel: {
      fontSize: Typography.sm,
      fontWeight: Typography.semibold,
      color: Colors.textSecondary,
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
      flexDirection: 'row',
      gap: Spacing.md,
      padding: Spacing.base,
      paddingBottom: Spacing.xxl,
      backgroundColor: Colors.background,
    },
    ghostBtn: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: Radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    ghostBtnText: { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: Typography.medium },
    nextBtn: {
      flex: 2,
      backgroundColor: Colors.primary,
      paddingVertical: Spacing.md,
      borderRadius: Radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nextBtnDisabled: { backgroundColor: Colors.border },
    nextBtnText: { fontSize: Typography.base, color: Colors.white, fontWeight: Typography.bold },
  }), [Colors]);

  useEffect(() => {
    if (prefilledCustomerId) {
      const c = getCustomer(prefilledCustomerId);
      if (c) {
        onChange({ customer: c, isNewCustomer: false });
        setMode('existing');
      }
    }
  }, [prefilledCustomerId]);

  const filtered = search.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search)
      )
    : customers;

  const selectCustomer = (c: Customer) => {
    onChange({ customer: c, isNewCustomer: false });
  };

  const canProceed =
    mode === 'existing'
      ? !!draft.customer
      : newName.trim().length > 1 && newPhone.trim().length >= 7;

  const handleNext = () => {
    if (mode === 'new') {
      onChange({
        isNewCustomer: true,
        customer: null,
        newCustomerName: newName.trim(),
        newCustomerPhone: newPhone.trim(),
      });
    }
    onNext();
  };

  // ─── Mode: Choose ─────────────────────────────────────────────────────────
  if (mode === 'choose') {
    return (
      <View style={styles.container}>
        <View style={styles.promptBlock}>
          <Text style={styles.question}>Who is this order for?</Text>
          <Text style={styles.subtitle}>Select an existing customer or add a new one</Text>
        </View>
        <View style={styles.choiceRow}>
          <TouchableOpacity
            style={styles.choiceCard}
            activeOpacity={0.85}
            onPress={() => setMode('existing')}
          >
            <Ionicons name="people-outline" size={36} color={Colors.textSecondary} style={{ marginBottom: Spacing.md }} />
            <Text style={styles.choiceLabel}>Existing Customer</Text>
            <Text style={styles.choiceSub}>{customers.length} saved</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.choiceCard, { backgroundColor: Colors.primaryFaint }]}
            activeOpacity={0.85}
            onPress={() => setMode('new')}
          >
            <Ionicons name="person-add-outline" size={36} color={Colors.primary} style={{ marginBottom: Spacing.md }} />
            <Text style={styles.choiceLabel}>New Customer</Text>
            <Text style={styles.choiceSub}>Add details now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Mode: Existing ───────────────────────────────────────────────────────
  if (mode === 'existing') {
    return (
      <View style={styles.container}>
        <View style={styles.promptBlock}>
          <Text style={styles.question}>Select customer</Text>
        </View>

        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or phone..."
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item: c }) => {
            const selected = draft.customer?.id === c.id;
            return (
              <TouchableOpacity
                onPress={() => selectCustomer(c)}
                activeOpacity={0.8}
                style={[styles.customerRow, selected && styles.customerRowSelected]}
              >
                <Avatar name={c.name} size={44} />
                <View style={styles.customerInfo}>
                  <Text style={[styles.customerName, selected && { color: Colors.primary }]}>
                    {c.name}
                  </Text>
                  <Text style={styles.customerPhone}>{c.phone}</Text>
                </View>
                {selected && (
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={14} color={Colors.white} />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptySearch}>
              <Text style={styles.emptySearchText}>No customers found</Text>
              <TouchableOpacity onPress={() => setMode('new')}>
                <Text style={[styles.emptySearchText, { color: Colors.primary, marginTop: 4 }]}>
                  Add new customer →
                </Text>
              </TouchableOpacity>
            </View>
          }
        />

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => { onChange({ customer: null }); setMode('choose'); }}
            style={styles.ghostBtn}
          >
            <Text style={styles.ghostBtnText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNext}
            disabled={!canProceed}
            style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
          >
            <Text style={styles.nextBtnText}>Continue →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Mode: New ────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.promptBlock}>
        <Text style={styles.question}>New customer details</Text>
        <Text style={styles.subtitle}>You can add measurements after creating the order</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Amaka Obi"
          placeholderTextColor={Colors.textTertiary}
          value={newName}
          onChangeText={setNewName}
          autoCapitalize="words"
          autoFocus
        />
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.inputLabel}>Phone Number *</Text>
          <ContactPickerButton
            onSelect={(name, phone) => {
              if (name && !newName) setNewName(name);
              setNewPhone(phone);
            }}
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="e.g. 0811 234 5678"
          placeholderTextColor={Colors.textTertiary}
          value={newPhone}
          onChangeText={setNewPhone}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => setMode('choose')} style={styles.ghostBtn}>
          <Text style={styles.ghostBtnText}>← Back</Text>
        </TouchableOpacity>
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

export default StepCustomer;
