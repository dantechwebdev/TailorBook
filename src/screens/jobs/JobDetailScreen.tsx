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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStore } from '../../context/store';
import { Colors, Typography, Spacing, Radius, Shadow, JOB_STATUS_CONFIG, JOB_STATUSES } from '../../constants/theme';
import { BackIcon, EditIcon, TrashIcon, CheckIcon, CustomersIcon, MeasurementsIcon, ScissorsIcon } from '../../components/common/Icons';
import { Avatar, StatusBadge, Card, Button } from '../../components/common/UI';
import { formatDeliveryDate, formatDate, formatNaira, getDeliveryUrgency } from '../../utils/helpers';
import { JobStatus } from '../../types';

const JobDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { jobId } = route.params;

  const { getJob, getCustomer, updateJobStatus, deleteJob, getMeasurementsByCustomer } = useStore();
  const job = getJob(jobId);
  const customer = job ? getCustomer(job.customerId) : null;

  const [showStatusPicker, setShowStatusPicker] = useState(false);
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
  const statusConfig = JOB_STATUS_CONFIG[job.status];
  const measurements = job.measurementId
    ? getMeasurementsByCustomer(job.customerId).find((m) => m.id === job.measurementId)
    : null;

  const handleStatusChange = async (newStatus: JobStatus) => {
    setStatusLoading(true);
    setShowStatusPicker(false);
    await updateJobStatus(job.id, newStatus);
    setStatusLoading(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Job',
      `Remove this ${job.outfitType} job for ${job.customerName}? This cannot be undone.`,
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

  // Status pipeline — next logical statuses
  const STATUS_ORDER: JobStatus[] = ['Pending', 'Cutting', 'Sewing', 'Finishing', 'Ready', 'Delivered'];
  const currentIndex = STATUS_ORDER.indexOf(job.status);
  const nextStatus = currentIndex < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIndex + 1] : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <BackIcon size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('JobEdit', { jobId })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <EditIcon size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <TrashIcon size={20} color={Colors.overdue} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ─── Hero Section ─── */}
        <Card style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroLeft}>
              <Text style={styles.outfitType}>{job.outfitType}</Text>
              {job.style && <Text style={styles.outfitStyle}>{job.style}</Text>}
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('CustomerDetail', { customerId: job.customerId })
                }
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

          {/* Status + Delivery */}
          <View style={styles.heroBadgeRow}>
            <StatusBadge status={job.status} />
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
        </Card>

        {/* ─── Status Pipeline ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <Card>
            <StatusPipeline currentStatus={job.status} />
            <View style={styles.pipelineActions}>
              {nextStatus && (
                <Button
                  label={`Mark as ${nextStatus}`}
                  onPress={() => handleStatusChange(nextStatus)}
                  loading={statusLoading}
                  size="sm"
                  fullWidth={false}
                  style={{ flex: 1 }}
                />
              )}
              <Button
                label="Change Status"
                onPress={() => setShowStatusPicker(true)}
                variant="secondary"
                size="sm"
                fullWidth={false}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>

        {/* ─── Payment Summary ─── */}
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

        {/* ─── Job Info ─── */}
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

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      {/* ─── Status Picker Modal ─── */}
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
            <Button
              label="Cancel"
              onPress={() => setShowStatusPicker(false)}
              variant="ghost"
              style={{ marginTop: Spacing.md }}
            />
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
        const isFuture = idx > currentIdx;
        return (
          <View key={s} style={styles.pipelineStep}>
            <View
              style={[
                styles.pipelineDot,
                isPast && { backgroundColor: Colors.ready, borderColor: Colors.ready },
                isCurrent && { backgroundColor: config.color, borderColor: config.color, width: 16, height: 16 },
                isFuture && { backgroundColor: Colors.white, borderColor: Colors.border },
              ]}
            >
              {isPast && <CheckIcon size={8} color={Colors.white} strokeWidth={3} />}
            </View>
            {idx < STATUS_PIPELINE.length - 1 && (
              <View style={[styles.pipelineLine, isPast && { backgroundColor: Colors.ready }]} />
            )}
            <Text
              style={[
                styles.pipelineLabel,
                isCurrent && { color: config.color, fontWeight: Typography.bold },
                isFuture && { color: Colors.textTertiary },
              ]}
            >
              {s}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const PaymentRow: React.FC<{
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
}> = ({ label, value, valueColor = Colors.textPrimary, bold = false }) => (
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
  headerTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xxxl },
  heroCard: { marginBottom: Spacing.xl },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  heroLeft: { flex: 1, paddingRight: Spacing.md },
  outfitType: {
    fontSize: Typography.xxl,
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  outfitStyle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  customerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  customerLinkText: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.medium,
  },
  sampleThumb: {
    width: 90,
    height: 110,
    borderRadius: Radius.md,
    resizeMode: 'cover',
  },
  samplePlaceholder: {
    width: 90,
    height: 110,
    borderRadius: Radius.md,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  deliveryChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.borderLight,
  },
  deliveryChipText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  // Pipeline
  pipeline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  pipelineStep: {
    flex: 1,
    alignItems: 'center',
  },
  pipelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  pipelineLine: {
    position: 'absolute',
    top: 6,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: Colors.border,
    zIndex: 0,
  },
  pipelineLabel: {
    fontSize: 9,
    fontWeight: Typography.medium,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  pipelineActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  // Payment
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  paymentLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  paymentValue: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  paymentDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.sm,
  },
  // Info
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  infoLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  infoValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
  },
  // Measurements
  measureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  measureKey: { fontSize: Typography.sm, color: Colors.textSecondary, textTransform: 'capitalize' },
  measureValue: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.base,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusOptionText: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
});

export default JobDetailScreen;
