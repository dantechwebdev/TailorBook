import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Typography, Spacing, Radius, Shadow, MEASUREMENT_FIELDS, TEMPLATE_LABELS } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';
import { MeasurementTemplate, Measurements } from '../../../types';
import { useStore } from '../../../context/store';
import { OrderDraft } from './index';
import { Chip } from '../../../components/common/UI';
import { CheckIcon, MeasurementsIcon } from '../../../components/common/Icons';

interface Props {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  onNext: () => void;
}

const TEMPLATES: MeasurementTemplate[] = [
  'mens_senator',
  'agbada',
  'suit',
  'womens_gown',
  'shirt',
  'trouser',
];

type Mode = 'select' | 'inline';

const StepMeasurements: React.FC<Props> = ({ draft, onChange, onNext }) => {
  const { getMeasurementsByCustomer } = useStore();
  const { colors: Colors, shadow} = useTheme();

  const customerId = draft.customer?.id || '';
  const existingMeasurements = customerId ? getMeasurementsByCustomer(customerId) : [];
  const isNewCustomer = draft.isNewCustomer;

  const [mode, setMode] = useState<Mode>(
    existingMeasurements.length === 0 ? 'inline' : 'select'
  );

  const [inlineTemplate, setInlineTemplate] = useState<MeasurementTemplate>('mens_senator');
  const [inlineData, setInlineData] = useState<Record<string, string>>(
    draft.draftMeasurement?.data || {}
  );
  const [inlineLabel, setInlineLabel] = useState(draft.draftMeasurement?.label || '');

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { paddingBottom: 120 },
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

    modeRow: {
      flexDirection: 'row',
      marginHorizontal: Spacing.base,
      marginBottom: Spacing.lg,
      backgroundColor: Colors.borderLight,
      borderRadius: Radius.full,
      padding: 3,
      gap: 3,
    },
    modeBtn: {
      flex: 1,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.full,
      alignItems: 'center',
    },
    modeBtnActive: { backgroundColor: Colors.white, ...shadow.sm },
    modeBtnText: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textSecondary },
    modeBtnTextActive: { color: Colors.primary, fontWeight: Typography.semibold },

    section: { paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
    subSectionTitle: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      color: Colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: Spacing.md,
    },

    measureCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      borderWidth: 2,
      borderColor: 'transparent',
      gap: Spacing.md,
      ...shadow.sm,
    },
    measureCardSelected: {
      borderColor: Colors.primary,
      backgroundColor: Colors.primaryFaint,
    },
    measureCardIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.borderLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    measureCardContent: { flex: 1 },
    measureCardTitle: {
      fontSize: Typography.base,
      fontWeight: Typography.semibold,
      color: Colors.textPrimary,
      marginBottom: 2,
    },
    measureCardSub: { fontSize: Typography.xs, color: Colors.textSecondary },
    checkCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },

    chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
    fieldsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    fieldItem: { width: '47%' },
    fieldLabel: {
      fontSize: Typography.xs,
      color: Colors.textSecondary,
      fontWeight: Typography.medium,
      marginBottom: 6,
    },
    fieldInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderRadius: Radius.sm,
      borderWidth: 1.5,
      borderColor: Colors.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
    },
    fieldInput: {
      flex: 1,
      fontSize: Typography.base,
      color: Colors.textPrimary,
      padding: 0,
    },
    fieldUnit: { fontSize: Typography.sm, color: Colors.textTertiary, fontWeight: Typography.medium },

    savedInlineBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.lg,
      padding: Spacing.md,
      backgroundColor: Colors.readyLight,
      borderRadius: Radius.lg,
      borderLeftWidth: 3,
      borderLeftColor: Colors.ready,
    },
    savedInlineText: { fontSize: Typography.sm, color: Colors.ready, fontWeight: Typography.medium, flex: 1 },

    footer: {
      flexDirection: 'row',
      gap: Spacing.md,
      paddingHorizontal: Spacing.base,
      paddingBottom: Spacing.xxl,
      paddingTop: Spacing.md,
    },
    skipBtn: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: Radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: Colors.border,
    },
    skipBtnText: { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: Typography.medium },
    nextBtn: {
      flex: 2,
      backgroundColor: Colors.primary,
      paddingVertical: Spacing.md,
      borderRadius: Radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nextBtnSecondary: { backgroundColor: Colors.primaryLight },
    nextBtnText: { fontSize: Typography.base, color: Colors.white, fontWeight: Typography.bold },
  }), [Colors, shadow]);

  const selectedId = draft.measurementId;
  const fields = MEASUREMENT_FIELDS[inlineTemplate] || [];

  const handleSelectExisting = (m: Measurements) => {
    onChange({ measurementId: m.id, draftMeasurement: null });
  };

  const handleSkip = () => {
    onChange({ measurementId: '', draftMeasurement: null });
    onNext();
  };

  const handleContinueWithSelection = () => {
    onNext();
  };

  const handleSaveInline = () => {
    const hasData = Object.values(inlineData).some((v) => v.trim().length > 0);
    if (!hasData) {
      onChange({ measurementId: '', draftMeasurement: null });
      onNext();
      return;
    }
    const label = inlineLabel.trim() || TEMPLATE_LABELS[inlineTemplate];
    onChange({
      measurementId: '',
      draftMeasurement: { template: inlineTemplate, data: inlineData, label },
    });
    onNext();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.promptBlock}>
        <Text style={styles.question}>Measurements</Text>
        <Text style={styles.subtitle}>
          {isNewCustomer
            ? 'Record measurements now or skip to add later'
            : existingMeasurements.length > 0
            ? 'Select from saved or record new measurements'
            : 'Record measurements now or skip to add later'}
        </Text>
      </View>

      {/* ─── Mode Switcher (only if existing measurements available) ─── */}
      {existingMeasurements.length > 0 && (
        <View style={styles.modeRow}>
          <TouchableOpacity
            onPress={() => setMode('select')}
            style={[styles.modeBtn, mode === 'select' && styles.modeBtnActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeBtnText, mode === 'select' && styles.modeBtnTextActive]}>
              Saved
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('inline')}
            style={[styles.modeBtn, mode === 'inline' && styles.modeBtnActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeBtnText, mode === 'inline' && styles.modeBtnTextActive]}>
              New
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── SELECT MODE: Existing Measurements ─── */}
      {mode === 'select' && existingMeasurements.length > 0 && (
        <View style={styles.section}>
          {existingMeasurements.map((m) => {
            const isSelected = selectedId === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                onPress={() => handleSelectExisting(m)}
                activeOpacity={0.8}
                style={[styles.measureCard, isSelected && styles.measureCardSelected]}
              >
                <View style={styles.measureCardIcon}>
                  <MeasurementsIcon size={18} color={isSelected ? Colors.primary : Colors.textTertiary} />
                </View>
                <View style={styles.measureCardContent}>
                  <Text style={[styles.measureCardTitle, isSelected && { color: Colors.primary }]}>
                    {m.label || TEMPLATE_LABELS[m.template] || m.template}
                  </Text>
                  <Text style={styles.measureCardSub}>
                    {Object.keys(m.data).length} measurements recorded
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.checkCircle}>
                    <CheckIcon size={14} color={Colors.white} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* ─── INLINE MODE: Quick Measurements ─── */}
      {mode === 'inline' && (
        <View style={styles.section}>
          <Text style={styles.subSectionTitle}>Template</Text>
          <View style={styles.chipWrap}>
            {TEMPLATES.map((t) => (
              <Chip
                key={t}
                label={TEMPLATE_LABELS[t]}
                selected={inlineTemplate === t}
                onPress={() => {
                  setInlineTemplate(t);
                  setInlineData({});
                }}
              />
            ))}
          </View>

          <Text style={[styles.subSectionTitle, { marginTop: Spacing.lg }]}>
            Key measurements (inches)
          </Text>
          <View style={styles.fieldsGrid}>
            {fields.slice(0, 6).map((field) => (
              <View key={field.key} style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <View style={styles.fieldInputWrap}>
                  <TextInput
                    value={inlineData[field.key] || ''}
                    onChangeText={(val) =>
                      setInlineData((prev) => ({ ...prev, [field.key]: val }))
                    }
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.textTertiary}
                    style={styles.fieldInput}
                    maxLength={5}
                  />
                  <Text style={styles.fieldUnit}>"</Text>
                </View>
              </View>
            ))}
          </View>

          {fields.length > 6 && (
            <>
              <Text style={[styles.subSectionTitle, { marginTop: Spacing.md }]}>
                More measurements
              </Text>
              <View style={styles.fieldsGrid}>
                {fields.slice(6).map((field) => (
                  <View key={field.key} style={styles.fieldItem}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <View style={styles.fieldInputWrap}>
                      <TextInput
                        value={inlineData[field.key] || ''}
                        onChangeText={(val) =>
                          setInlineData((prev) => ({ ...prev, [field.key]: val }))
                        }
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={Colors.textTertiary}
                        style={styles.fieldInput}
                        maxLength={5}
                      />
                      <Text style={styles.fieldUnit}>"</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {draft.draftMeasurement && (
            <View style={styles.savedInlineBadge}>
              <CheckIcon size={14} color={Colors.ready} />
              <Text style={styles.savedInlineText}>Measurements recorded — will be saved with the job</Text>
            </View>
          )}
        </View>
      )}

      {/* ─── Footer ─── */}
      <View style={styles.footer}>
        {mode === 'select' ? (
          <>
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.skipBtnText}>Skip for now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleContinueWithSelection}
              style={[styles.nextBtn, !selectedId && styles.nextBtnSecondary]}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>
                {selectedId ? 'Continue →' : 'Skip & Continue →'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.skipBtnText}>Skip for now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveInline}
              style={styles.nextBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>Save & Continue →</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};

export default StepMeasurements;
