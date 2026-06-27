import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStore } from '../../context/store';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { MEASUREMENT_FIELDS, TEMPLATE_LABELS } from '../../constants/theme';
import { BackIcon, CheckIcon } from '../../components/common/Icons';
import { Button, Chip } from '../../components/common/UI';
import { MeasurementTemplate } from '../../types';
import { format } from 'date-fns';

const TEMPLATES: MeasurementTemplate[] = [
  'mens_senator',
  'agbada',
  'suit',
  'womens_gown',
  'shirt',
  'trouser',
];

const MeasurementFormScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { customerId, jobId, existingMeasurementId } = route.params || {};

  const { addMeasurement, getMeasurementsByCustomer, getCustomer } = useStore();
  const customer = getCustomer(customerId);
  const existingMeasurements = getMeasurementsByCustomer(customerId);

  const [template, setTemplate] = useState<MeasurementTemplate>('mens_senator');
  const [data, setData] = useState<Record<string, string>>({});
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);

  const fields = MEASUREMENT_FIELDS[template] || [];

  const handleSave = async () => {
    const hasData = Object.values(data).some((v) => v.trim().length > 0);
    if (!hasData) {
      Alert.alert('Empty measurements', 'Please fill in at least one measurement field.');
      return;
    }

    setLoading(true);
    try {
      const measurement = await addMeasurement({
        customerId,
        template,
        data,
        label: label.trim() || `${TEMPLATE_LABELS[template]} — ${format(new Date(), 'MMM yyyy')}`,
      });

      Alert.alert('Saved!', 'Measurements have been saved.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Could not save measurements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyFromExisting = (existingId: string) => {
    const existing = existingMeasurements.find((m) => m.id === existingId);
    if (!existing) return;
    setTemplate(existing.template as MeasurementTemplate);
    setData({ ...existing.data });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <BackIcon size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Measurements</Text>
            {customer && (
              <Text style={styles.headerSub}>{customer.name}</Text>
            )}
          </View>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Copy from existing ─── */}
          {existingMeasurements.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Use Previous Measurements</Text>
              {existingMeasurements.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => handleCopyFromExisting(m.id)}
                  style={styles.existingRow}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text style={styles.existingLabel}>{m.label || m.template}</Text>
                    <Text style={styles.existingDate}>
                      {new Date(m.createdAt).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Text style={styles.copyText}>Copy →</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ─── Template Selector ─── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Template</Text>
            <View style={styles.templateWrap}>
              {TEMPLATES.map((t) => (
                <Chip
                  key={t}
                  label={TEMPLATE_LABELS[t]}
                  selected={template === t}
                  onPress={() => {
                    setTemplate(t);
                    setData({});
                  }}
                />
              ))}
            </View>
          </View>

          {/* ─── Measurement Fields ─── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Measurements (in inches)</Text>
            <View style={styles.fieldsGrid}>
              {fields.map((field) => (
                <View key={field.key} style={styles.fieldItem}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <View style={styles.fieldInputWrap}>
                    <TextInput
                      value={data[field.key] || ''}
                      onChangeText={(val) =>
                        setData((prev) => ({ ...prev, [field.key]: val }))
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
          </View>

          {/* ─── Label ─── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Label (optional)</Text>
            <View style={styles.labelInput}>
              <TextInput
                value={label}
                onChangeText={setLabel}
                placeholder={`e.g. ${TEMPLATE_LABELS[template]} — ${format(new Date(), 'MMM yyyy')}`}
                placeholderTextColor={Colors.textTertiary}
                style={styles.labelInputText}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* ─── Save ─── */}
          <Button
            label="Save Measurements"
            onPress={handleSave}
            loading={loading}
            size="lg"
            style={{ marginTop: Spacing.sm, marginBottom: Spacing.xxxl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  headerSub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl },
  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  existingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  existingLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  existingDate: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  copyText: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  templateWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  fieldItem: {
    width: '47%',
  },
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
  fieldUnit: {
    fontSize: Typography.sm,
    color: Colors.textTertiary,
    fontWeight: Typography.medium,
  },
  labelInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  labelInputText: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
});

export default MeasurementFormScreen;
