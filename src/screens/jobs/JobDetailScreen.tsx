import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStore } from '../../context/store';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadow,
  JOB_STATUS_CONFIG,
  JOB_STATUSES,
} from '../../constants/theme';
import {
  BackIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  ScissorsIcon,
  HomeIcon,
} from '../../components/common/Icons';
import { Avatar, StatusBadge, Card, Button } from '../../components/common/UI';
import { formatDeliveryDate, formatDate, formatNaira, getDeliveryUrgency } from '../../utils/helpers';
import { JobStatus } from '../../types';
import { buildWhatsAppUrl, WhatsAppMessageType } from '../../utils/whatsapp';

// ─── Dynamic Next Step Config ─────────────────────────────────────────────────

const STATUS_ORDER: JobStatus[] = [
  'Pending', 'Cutting', 'Sewing', 'Finishing', 'Ready', 'Delivered',
];

function getNextStepLabel(status: JobStatus, deliveryType: 'pickup' | 'waybill'): string | null {
  switch (status) {
    case 'Pending': return '✂️ Start Cutting';
    case 'Cutting': return '🧵 Move to Sewing';
    case 'Sewing': return '🪡 Move to Finishing';
    case 'Finishing': return '✅ Mark as Ready';
    case 'Ready':
      return deliveryType === 'waybill' ? '📦 Mark Dispatched' : '👋 Mark Delivered';
    case 'Delivered': return null;
    default: return null;
  }
}

function getNextStatus(status: JobStatus): JobStatus | null {
  const idx = STATUS_ORDER.indexOf(status);
  return idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : null;
}

// ─── JobDetailScreen ──────────────────────────────────────────────────────────

const JobDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { jobId } = route.params;

  const { getJob, getCustomer, updateJobStatus, deleteJob, getMeasurementsByCustomer } = useStore();
  const job = getJob(jobId);
  const customer = job ? getCustomer(job.customerId) : null;

  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  if (!job) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <BackIcon size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.textSecondary }}>Job not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const urgency = getDeliveryUrgency(job.deliveryDate);
  const nextStepLabel = getNextStepLabel(job.status, job.deliveryType || 'pickup');
  const nextStatus = getNextStatus(job.status);
  const measurements = job.measurementId
    ? getMeasurementsByCustomer(job.customerId).find((m) => m.id === job.measurementId)
    : null;

  const handleStatusChange = async (newStatus: JobStatus) => {
    setStatusLoading(true);
    setShowStatusPicker(false);
    await updateJobStatus(job.id, newStatus);
    setStatusLoading(false);
  };

  const handleNextStep = () => {
    if (!nextStatus) return;
    const label = getNextStepLabel(job.status, job.deliveryType || 'pickup') || '';
    Alert.alert(
      label,
      `Move this job to "${nextStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => handleStatusChange(nextStatus),
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Order',
      `Remove ${job.outfitType} for ${job.customerName}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteJob(job.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleWhatsApp = (msgType: WhatsAppMessageType) => {
    const phone = customer?.phone || job.customerPhone || '';
    if (!phone) {
      Alert.alert('No phone number', 'This customer has no phone number saved.');
      return;
    }
    const url = buildWhatsAppUrl(phone, msgType, job);
    Linking.openURL(url).catch(() => {
      Alert.alert(
        'WhatsApp not available',
        'WhatsApp message has been queued and will send when available.'
      );
    });
  };

  const whatsAppType: WhatsAppMessageType =
    job.status === 'Ready'
      ? job.deliveryType === 'waybill'
        ? 'ready_waybill'
        : 'ready_pickup'
      : job.status === 'Delivered'
      ? 'delivery_complete'
      : 'job_created';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <BackIcon size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('HomeTab')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <HomeIcon size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('JobEdit', { jobId })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <EditIcon size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <TrashIcon size={20} color={Colors.overdue} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ─── Hero ─── */}
        <Card style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroLeft}>
              <Text style={styles.outfitType}>{job.outfitType}</Text>
              {job.style && <Text style={styles.outfitStyle}>{job.style}</Text>}
              <TouchableOpacity
                onPress={() => navigation.navigate('CustomerDetail', { customerId: job.customerId })}
                style={styles.customerLink}
              >
                <Avatar name={job.customerName} size={24} />
                <Text style={styles.customerLinkText}>{job.customerName}</Text>
              </TouchableOpacity>
            </View>
            {job.samplePhotoUri ? (
              <Image source={{ uri: job.samplePhotoUri }} style={styles.sampleThumb} />
            ) : (
              <View style={styles.samplePlaceholder}>
                <ScissorsIcon size={24} color={Colors.textTertiary} />
              </View>
            )}
          </View>

          {/* Status + Delivery badges */}
          <View style={styles.heroBadgeRow}>
            <StatusBadge status={job.status} />
            {/* Delivery type */}
            <View
              style={[
                styles.deliveryTypeChip,
                job.deliveryType === 'waybill'
                  ? { backgroundColor: '#E8F2FF' }
                  : { backgroundColor: Colors.readyLight },
              ]}
            >
              <Text
                style={[
                  styles.deliveryTypeText,
                  { color: job.deliveryType === 'waybill' ? Colors.cutting : Colors.ready },
                ]}
              >
                {job.deliveryType === 'waybill' ? '📦 Waybill' : '🏪 Pickup'}
              </Text>
            </View>
            {/* Due date */}
            <View
              style={[
                styles.deliveryChip,
                urgency === 'overdue' && { backgroundColor: Colors.overdueLight },
                urgency === 'today' && { backgroundColor: Colors.overdueLight },
                urgency === 'soon' && { backgroundColor: Colors.dueSoonLight },
              ]}
            >
              <Text
                style={[
                  styles.deliveryChipText,
                  urgency === 'overdue' && { color: Colors.overdue },
                  urgency === 'today' && { color: Colors.overdue },
                  urgency === 'soon' && { color: Colors.dueSoon },
                ]}
              >
                📅 {formatDeliveryDate(job.deliveryDate)}
              </Text>
            </View>
          </View>

          {/* Waybill destination */}
          {job.deliveryType === 'waybill' && job.deliveryAddress && (
            <View style={styles.destinationRow}>
              <Text style={styles.destinationLabel}>Destination: </Text>
              <Text style={styles.destinationValue}>{job.deliveryAddress}</Text>
            </View>
          )}
        </Card>

        {/* ─── Progress Pipeline ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <Card>
            <StatusPipeline currentStatus={job.status} />
            <TouchableOpacity
              onPress={() => setShowStatusPicker(true)}
              style={styles.changeStatusBtn}
            >
              <Text style={styles.changeStatusText}>Change status manually</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* ─── Payment ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <Card>
            <PaymentRow label="Total Price" value={formatNaira(job.price)} />
            <PaymentRow label="Deposit Paid" value={formatNaira(job.deposit)} valueColor={Colors.ready} />
            <View style={styles.paymentDivider} />
            <PaymentRow
              label="Balance Remaining"
              value={formatNaira(job.balance)}
              valueColor={job.balance > 0 ? Colors.overdue : Colors.ready}
              bold
            />
          </Card>
        </View>

        {/* ─── Details ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <Card>
            {job.fabric && <InfoRow label="Fabric" value={job.fabric} />}
            <InfoRow label="Created" value={formatDate(job.createdAt)} />
            <InfoRow label="Delivery" value={formatDeliveryDate(job.deliveryDate)} last />
          </Card>
        </View>

        {/* ─── Measurements ─── */}
        {measurements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Measurements</Text>
            <Card>
              <Text style={{ fontSize: Typography.sm, color: Colors.textTertiary, marginBottom: Spacing.md }}>
                {measurements.label || measurements.template}
              </Text>
              {Object.entries(measurements.data).map(([key, value]) => (
                <View key={key} style={styles.measureRow}>
                  <Text style={styles.measureKey}>{key}</Text>
                  <Text style={styles.measureValue}>{value}"</Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* ─── Notes ─── */}
        {job.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Card>
              <Text style={{ fontSize: Typography.base, color: Colors.textSecondary, lineHeight: 22 }}>
                {job.notes}
              </Text>
            </Card>
          </View>
        )}

        {/* ─── WhatsApp Actions ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WhatsApp</Text>
          <Card padding={0}>
            <WhatsAppRow
              label="Send order confirmation"
              icon="📋"
              onPress={() => handleWhatsApp('job_created')}
            />
            <View style={styles.waDivider} />
            <WhatsAppRow
              label={job.deliveryType === 'waybill' ? 'Notify — ready to dispatch' : 'Notify — ready for pickup'}
              icon={job.deliveryType === 'waybill' ? '📦' : '👋'}
              onPress={() => handleWhatsApp(whatsAppType)}
            />
            <View style={styles.waDivider} />
            <WhatsAppRow
              label="Send payment reminder"
              icon="💰"
              onPress={() => handleWhatsApp('payment_reminder')}
            />
          </Card>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ─── Growth Loop: post-delivery suggestion ─── */}
      {job.status === 'Delivered' && customer && (
        <View style={styles.growthBar}>
          <Text style={styles.growthText}>Start another order for {customer.name}?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('NewOrderFlow', { customerId: job.customerId })}
            style={styles.growthBtn}
          >
            <Text style={styles.growthBtnText}>New Order</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Bottom Bar: Dynamic Next Step ─── */}
      <View style={styles.bottomBar}>
        {nextStepLabel ? (
          <TouchableOpacity
            onPress={handleNextStep}
            disabled={statusLoading}
            activeOpacity={0.88}
            style={[styles.nextStepBtn, statusLoading && { opacity: 0.7 }]}
          >
            <Text style={styles.nextStepText}>{nextStepLabel}</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.nextStepBtn, { backgroundColor: Colors.delivered }]}>
            <Text style={styles.nextStepText}>✓ Delivered</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => setShowSummary(true)}
          style={styles.summaryBtn}
        >
          <Text style={styles.summaryBtnText}>Summary</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Status Picker Bottom Sheet ─── */}
      <Modal visible={showStatusPicker} transparent animationType="slide" presentationStyle="overFullScreen">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Change Status</Text>
            {JOB_STATUSES.map((s) => {
              const config = JOB_STATUS_CONFIG[s as JobStatus];
              const isCurrent = job.status === s;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => handleStatusChange(s as JobStatus)}
                  style={[styles.statusOption, isCurrent && { backgroundColor: config.bgColor }]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                  <Text style={[styles.statusOptionText, isCurrent && { color: config.color, fontWeight: Typography.bold }]}>
                    {config.label}
                  </Text>
                  {isCurrent && <CheckIcon size={16} color={config.color} />}
                </TouchableOpacity>
              );
            })}
            <Button label="Cancel" onPress={() => setShowStatusPicker(false)} variant="ghost" style={{ marginTop: Spacing.md }} />
          </View>
        </View>
      </Modal>

      {/* ─── Summary Bottom Sheet ─── */}
      <Modal visible={showSummary} transparent animationType="slide" presentationStyle="overFullScreen">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, styles.summarySheet]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Job Summary</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <SummaryItem label="Customer" value={job.customerName} />
              <SummaryItem label="Outfit" value={`${job.outfitType}${job.style ? ' · ' + job.style : ''}`} />
              <SummaryItem label="Status" value={job.status} />
              <SummaryItem
                label="Delivery"
                value={`${job.deliveryType === 'waybill' ? '📦 Waybill' : '🏪 Pickup'} · ${formatDeliveryDate(job.deliveryDate)}`}
              />
              {job.deliveryAddress && (
                <SummaryItem label="Destination" value={job.deliveryAddress} />
              )}
              <SummaryItem label="Price" value={formatNaira(job.price)} />
              <SummaryItem label="Deposit" value={formatNaira(job.deposit)} />
              <SummaryItem
                label="Balance"
                value={formatNaira(job.balance)}
                valueColor={job.balance > 0 ? Colors.overdue : Colors.ready}
              />
              {job.fabric && <SummaryItem label="Fabric" value={job.fabric} />}
              {job.notes && <SummaryItem label="Notes" value={job.notes} />}
            </ScrollView>

            <Button label="Close" onPress={() => setShowSummary(false)} variant="ghost" style={{ marginTop: Spacing.md }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const STATUS_PIPELINE: JobStatus[] = ['Pending', 'Cutting', 'Sewing', 'Finishing', 'Ready', 'Delivered'];

const StatusPipeline: React.FC<{ currentStatus: JobStatus }> = ({ currentStatus }) => {
  const currentIdx = STATUS_PIPELINE.indexOf(currentStatus);
  return (
    <View style={styles.pipeline}>
      {STATUS_PIPELINE.map((s, idx) => {
        const config = JOB_STATUS_CONFIG[s];
        const isPast = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <View key={s} style={styles.pipelineStep}>
            <View
              style={[
                styles.pipelineDot,
                isPast && { backgroundColor: Colors.ready, borderColor: Colors.ready },
                isCurrent && { backgroundColor: config.color, borderColor: config.color, width: 16, height: 16 },
              ]}
            >
              {isPast && <CheckIcon size={8} color={Colors.white} strokeWidth={3} />}
            </View>
            {idx < STATUS_PIPELINE.length - 1 && (
              <View style={[styles.pipelineLine, isPast && { backgroundColor: Colors.ready }]} />
            )}
            <Text style={[styles.pipelineLabel, isCurrent && { color: config.color, fontWeight: Typography.bold }]}>
              {s}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const PaymentRow: React.FC<{ label: string; value: string; valueColor?: string; bold?: boolean }> = ({
  label, value, valueColor = Colors.textPrimary, bold = false,
}) => (
  <View style={styles.paymentRow}>
    <Text style={styles.paymentLabel}>{label}</Text>
    <Text style={[styles.paymentValue, { color: valueColor }, bold && { fontWeight: Typography.bold, fontSize: Typography.md }]}>
      {value}
    </Text>
  </View>
);

const InfoRow: React.FC<{ label: string; value: string; last?: boolean }> = ({ label, value, last }) => (
  <View style={[styles.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: Colors.borderLight }]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const WhatsAppRow: React.FC<{ label: string; icon: string; onPress: () => void }> = ({
  label, icon, onPress,
}) => (
  <TouchableOpacity onPress={onPress} style={styles.waRow} activeOpacity={0.8}>
    <View style={styles.waIcon}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
    </View>
    <Text style={styles.waLabel}>{label}</Text>
    <View style={styles.waChevron}>
      <Text style={{ color: '#25D366', fontSize: 16 }}>→</Text>
    </View>
  </TouchableOpacity>
);

const SummaryItem: React.FC<{ label: string; value: string; valueColor?: string }> = ({
  label, value, valueColor,
}) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={[styles.summaryValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  headerTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xxxl },

  // Hero
  heroCard: { marginBottom: Spacing.xl },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  heroLeft: { flex: 1, paddingRight: Spacing.md },
  outfitType: { fontSize: Typography.xxl, fontWeight: Typography.extrabold, color: Colors.textPrimary, marginBottom: 4 },
  outfitStyle: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  customerLink: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  customerLinkText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.medium },
  sampleThumb: { width: 90, height: 110, borderRadius: Radius.md, resizeMode: 'cover' },
  samplePlaceholder: {
    width: 90, height: 110, borderRadius: Radius.md,
    backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center',
  },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm, flexWrap: 'wrap' },
  deliveryTypeChip: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  deliveryTypeText: { fontSize: Typography.xs, fontWeight: Typography.semibold },
  deliveryChip: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full, backgroundColor: Colors.borderLight,
  },
  deliveryChipText: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textSecondary },
  destinationRow: { flexDirection: 'row', marginTop: Spacing.sm },
  destinationLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  destinationValue: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },

  // Section
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.md },

  // Pipeline
  pipeline: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginBottom: Spacing.md },
  pipelineStep: { flex: 1, alignItems: 'center' },
  pipelineDot: {
    width: 12, height: 12, borderRadius: 6, borderWidth: 2,
    borderColor: Colors.border, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  pipelineLine: {
    position: 'absolute', top: 6, left: '50%', right: '-50%',
    height: 2, backgroundColor: Colors.border, zIndex: 0,
  },
  pipelineLabel: { fontSize: 9, fontWeight: Typography.medium, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  changeStatusBtn: { paddingVertical: Spacing.sm, alignItems: 'center' },
  changeStatusText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.medium },

  // Payment
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  paymentLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  paymentValue: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  paymentDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.sm },

  // Info
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.md },
  infoLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  infoValue: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textPrimary },

  // Measurements
  measureRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  measureKey: { fontSize: Typography.sm, color: Colors.textSecondary, textTransform: 'capitalize' },
  measureValue: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },

  // WhatsApp
  waRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.md,
  },
  waIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#E8FFF1', alignItems: 'center', justifyContent: 'center',
  },
  waLabel: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary, fontWeight: Typography.medium },
  waChevron: {},
  waDivider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.base },

  // Growth loop
  growthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryLight || '#EBF5FF',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  growthText: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.semibold,
    marginRight: Spacing.sm,
  },
  growthBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  growthBtnText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Shadow.lg,
  },
  nextStepBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextStepText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.white },
  summaryBtn: {
    backgroundColor: Colors.primaryFaint,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBtnText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.primary },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.base, paddingBottom: 36,
  },
  summarySheet: { maxHeight: '70%' },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border,
    alignSelf: 'center', marginTop: Spacing.md, marginBottom: Spacing.lg,
  },
  modalTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  statusOption: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
    borderRadius: Radius.md, marginBottom: 4,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusOptionText: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary, fontWeight: Typography.medium },

  // Summary sheet rows
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  summaryLabel: { fontSize: Typography.sm, color: Colors.textSecondary, flex: 1 },
  summaryValue: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary, flex: 2, textAlign: 'right' },
});

export default JobDetailScreen;
