import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Typography, Spacing, Radius, Shadow } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';
import { useStore } from '../../../context/store';
import { OrderDraft } from './index';
import { format } from 'date-fns';

interface Props {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  onDone: (jobId: string) => void;
}

function formatNaira(n: number): string {
  return '₦' + n.toLocaleString('en-NG');
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  try { return format(new Date(iso), 'EEE, d MMM yyyy'); } catch { return iso; }
}

const StepReview: React.FC<Props> = ({ draft, onDone }) => {
  const { addCustomer, addJob, addMeasurement } = useStore();
  const { colors: Colors, shadow} = useTheme();
  const [isCreating, setIsCreating] = useState(false);

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
    card: {
      marginHorizontal: Spacing.base,
      backgroundColor: Colors.surface,
      borderRadius: Radius.xl,
      padding: Spacing.base,
      ...shadow.md,
    },
    reviewSection: { marginBottom: Spacing.md },
    reviewSectionTitle: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: Colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: Spacing.sm,
    },
    reviewRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 5,
    },
    reviewLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
    reviewValue: {
      fontSize: Typography.sm,
      fontWeight: Typography.semibold,
      color: Colors.textPrimary,
      textAlign: 'right',
      flex: 1,
      marginLeft: Spacing.md,
    },
    newBadge: {
      marginTop: 6,
      backgroundColor: Colors.primaryFaint,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      alignSelf: 'flex-start',
    },
    newBadgeText: { fontSize: Typography.xs, color: Colors.primary, fontWeight: Typography.medium },
    divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.md },
    notesText: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
    aiCard: {
      marginHorizontal: Spacing.base,
      marginTop: Spacing.lg,
      backgroundColor: Colors.primaryFaint,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      borderLeftWidth: 3,
      borderLeftColor: Colors.primary,
    },
    aiLabel: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: Colors.primary,
      marginBottom: 4,
    },
    aiText: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
    aiDisclaimer: {
      fontSize: Typography.xs,
      color: Colors.textTertiary,
      marginTop: 6,
      fontStyle: 'italic',
    },
    footer: {
      padding: Spacing.base,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.xxl,
      alignItems: 'center',
    },
    createBtn: {
      width: '100%',
      backgroundColor: Colors.ready,
      paddingVertical: Spacing.lg,
      borderRadius: Radius.lg,
      alignItems: 'center',
      ...shadow.md,
    },
    createBtnLoading: { opacity: 0.7 },
    createBtnText: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: Colors.white,
      letterSpacing: 0.3,
    },
    footerHint: {
      fontSize: Typography.xs,
      color: Colors.textTertiary,
      marginTop: Spacing.md,
      textAlign: 'center',
    },
  }), [Colors, shadow]);

  const customerName = draft.isNewCustomer
    ? draft.newCustomerName
    : draft.customer?.name || '—';
  const customerPhone = draft.isNewCustomer
    ? draft.newCustomerPhone
    : draft.customer?.phone || '';

  const price = parseFloat(draft.price.replace(/,/g, '')) || 0;
  const deposit = parseFloat(draft.deposit.replace(/,/g, '')) || 0;
  const balance = Math.max(0, price - deposit);

  const hasMeasurements = !!(draft.measurementId || draft.draftMeasurement);
  const photoCount = draft.photoUris?.length || 0;

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      let resolvedCustomer = draft.customer;

      if (draft.isNewCustomer) {
        resolvedCustomer = await addCustomer({
          name: draft.newCustomerName,
          phone: draft.newCustomerPhone,
          notes: '',
        });
      }

      if (!resolvedCustomer) {
        Alert.alert('Error', 'Customer not found. Please go back and select a customer.');
        setIsCreating(false);
        return;
      }

      let resolvedMeasurementId = draft.measurementId || undefined;
      if (!resolvedMeasurementId && draft.draftMeasurement) {
        const m = await addMeasurement({
          customerId: resolvedCustomer.id,
          template: draft.draftMeasurement.template,
          data: draft.draftMeasurement.data,
          label: draft.draftMeasurement.label,
        });
        resolvedMeasurementId = m.id;
      }

      const job = await addJob({
        customerId: resolvedCustomer.id,
        customerName: resolvedCustomer.name,
        customerPhone: resolvedCustomer.phone,
        outfitType: draft.outfitType as any,
        style: draft.style || undefined,
        fabric: draft.fabric || undefined,
        deliveryDate: draft.deliveryDate,
        deliveryType: draft.deliveryType,
        deliveryAddress: draft.deliveryAddress || undefined,
        price,
        deposit,
        balance,
        status: 'Pending',
        measurementId: resolvedMeasurementId,
        photoUris: draft.photoUris?.length ? draft.photoUris : undefined,
        notes: draft.notes || undefined,
      });

      onDone(job.id);
    } catch (err) {
      Alert.alert('Error', 'Failed to create order. Please try again.');
      setIsCreating(false);
    }
  };

  // ─── Sub-components ───────────────────────────────────────────────────────────

  const ReviewSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <View style={styles.reviewSection}>
      <Text style={styles.reviewSectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const ReviewRow: React.FC<{
    label: string;
    value: string;
    valueColor?: string;
    bold?: boolean;
  }> = ({ label, value, valueColor = Colors.textPrimary, bold }) => (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text
        style={[
          styles.reviewValue,
          { color: valueColor },
          bold && { fontWeight: Typography.bold, fontSize: Typography.md },
        ]}
      >
        {value}
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.promptBlock}>
        <Text style={styles.question}>Review Order</Text>
        <Text style={styles.subtitle}>Check everything before creating the job</Text>
      </View>

      {/* ─── Summary Card ─── */}
      <View style={styles.card}>
        <ReviewSection title="Customer">
          <ReviewRow label="Name" value={customerName} />
          {customerPhone ? <ReviewRow label="Phone" value={customerPhone} /> : null}
          {draft.isNewCustomer && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>New customer — will be saved</Text>
            </View>
          )}
        </ReviewSection>

        <View style={styles.divider} />

        <ReviewSection title="Garment">
          <ReviewRow label="Type" value={draft.outfitType || '—'} />
          {draft.style ? <ReviewRow label="Style" value={draft.style} /> : null}
          {draft.fabric ? <ReviewRow label="Fabric" value={draft.fabric} /> : null}
          <ReviewRow
            label="Photos"
            value={photoCount > 0 ? `${photoCount} photo${photoCount > 1 ? 's' : ''} attached` : 'None'}
            valueColor={photoCount > 0 ? Colors.ready : Colors.textTertiary}
          />
        </ReviewSection>

        <View style={styles.divider} />

        <ReviewSection title="Measurements">
          {hasMeasurements ? (
            <ReviewRow
              label="Status"
              value={draft.draftMeasurement ? `Recorded (${draft.draftMeasurement.label})` : 'Selected from saved'}
              valueColor={Colors.ready}
            />
          ) : (
            <ReviewRow label="Status" value="Not recorded — add later" valueColor={Colors.textTertiary} />
          )}
        </ReviewSection>

        <View style={styles.divider} />

        <ReviewSection title="Delivery">
          <ReviewRow label="Due Date" value={formatDate(draft.deliveryDate)} />
          <ReviewRow
            label="Method"
            value={draft.deliveryType === 'waybill' ? 'Waybill' : 'Pickup from Shop'}
          />
          {draft.deliveryType === 'waybill' && draft.deliveryAddress ? (
            <ReviewRow label="Destination" value={draft.deliveryAddress} />
          ) : null}
        </ReviewSection>

        <View style={styles.divider} />

        <ReviewSection title="Payment">
          <ReviewRow label="Total Price" value={formatNaira(price)} />
          <ReviewRow label="Deposit" value={formatNaira(deposit)} valueColor={Colors.ready} />
          <View style={styles.divider} />
          <ReviewRow
            label="Balance Due"
            value={formatNaira(balance)}
            valueColor={balance > 0 ? Colors.overdue : Colors.ready}
            bold
          />
        </ReviewSection>

        {draft.notes ? (
          <>
            <View style={styles.divider} />
            <ReviewSection title="Notes">
              <Text style={styles.notesText}>{draft.notes}</Text>
            </ReviewSection>
          </>
        ) : null}
      </View>

      {/* ─── AI Suggestion ─── */}
      <View style={styles.aiCard}>
        <Text style={styles.aiLabel}>AI Suggestion</Text>
        <Text style={styles.aiText}>
          Based on {draft.outfitType || 'this garment'} orders of similar value, typical completion time is{' '}
          <Text style={{ fontWeight: Typography.bold }}>10–14 days</Text>. Delivery looks
          achievable on schedule.
        </Text>
        <Text style={styles.aiDisclaimer}>AI insights · Simulated — full AI coming in next update</Text>
      </View>

      {/* ─── Create Button ─── */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleCreate}
          disabled={isCreating}
          activeOpacity={0.88}
          style={[styles.createBtn, isCreating && styles.createBtnLoading]}
        >
          {isCreating ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.createBtnText}>Create Order</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.footerHint}>Job will appear in your workbench immediately</Text>
      </View>
    </ScrollView>
  );
};

export default StepReview;
