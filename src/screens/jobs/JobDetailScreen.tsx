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
import { Ionicons } from '@expo/vector-icons';
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
import { formatDeliveryDate, formatDate, formatNaira, getDeliveryUrgency, getFirstName } from '../../utils/helpers';
import { JobStatus } from '../../types';
import {
  buildWhatsAppUrl,
  buildMessageText,
  buildDirectChatUrl,
  WhatsAppMessageType,
} from '../../utils/whatsapp';

// ─── Next Step Config ─────────────────────────────────────────────────────────

const STATUS_ORDER: JobStatus[] = [
  'Pending', 'Cutting', 'Sewing', 'Finishing', 'Ready', 'Delivered',
];

function getNextStep(
  status: JobStatus,
  deliveryType: 'pickup' | 'waybill'
): { label: string; icon: string } | null {
  switch (status) {
    case 'Pending':   return { label: 'Start Cutting',    icon: 'cut-outline' };
    case 'Cutting':   return { label: 'Move to Sewing',   icon: 'git-commit-outline' };
    case 'Sewing':    return { label: 'Move to Finishing', icon: 'layers-outline' };
    case 'Finishing': return { label: 'Mark as Ready',    icon: 'checkmark-circle-outline' };
    case 'Ready':
      return deliveryType === 'waybill'
        ? { label: 'Mark Dispatched', icon: 'cube-outline' }
        : { label: 'Mark Delivered',  icon: 'checkmark-done-outline' };
    case 'Delivered': return null;
    default:          return null;
  }
}

function getNextStatus(status: JobStatus): JobStatus | null {
  const idx = STATUS_ORDER.indexOf(status);
  return idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : null;
}

// ─── WhatsApp Preview State ───────────────────────────────────────────────────

interface WaPreview {
  visible: boolean;
  type: WhatsAppMessageType;
  messageText: string;
  url: string;
  recipientName: string;
  phone: string;
}

// ─── JobDetailScreen ──────────────────────────────────────────────────────────

const JobDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { jobId } = route.params;

  const { getJob, getCustomer, updateJobStatus, deleteJob, getMeasurementsByCustomer, settings } = useStore();
  const job = getJob(jobId);
  const customer = job ? getCustomer(job.customerId) : null;
  const currency = settings?.currency || '₦';

  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [waPreview, setWaPreview] = useState<WaPreview | null>(null);

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
  const nextStep = getNextStep(job.status, job.deliveryType || 'pickup');
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
    if (!nextStatus || !nextStep) return;
    Alert.alert(
      nextStep.label,
      `Move this job to "${nextStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => handleStatusChange(nextStatus) },
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

  // Show message preview before opening WhatsApp
  const handleWhatsApp = (msgType: WhatsAppMessageType) => {
    const phone = customer?.phone || job.customerPhone || '';
    if (!phone) {
      Alert.alert('No phone number', 'This customer has no phone number saved.');
      return;
    }
    const messageText = buildMessageText(msgType, job, currency);
    const url = buildWhatsAppUrl(phone, msgType, job, currency);
    setWaPreview({
      visible: true,
      type: msgType,
      messageText,
      url,
      recipientName: getFirstName(job.customerName),
      phone,
    });
  };

  const handleConfirmSend = () => {
    if (!waPreview?.url) return;
    Linking.openURL(waPreview.url).catch(() => {
      Alert.alert(
        'WhatsApp not available',
        'Could not open WhatsApp. Make sure it is installed on your device.'
      );
    });
    setWaPreview(null);
  };

  // Determine the context-appropriate "primary" WhatsApp action
  const primaryWaType: WhatsAppMessageType =
    job.status === 'Ready'
      ? job.deliveryType === 'waybill' ? 'ready_waybill' : 'ready_pickup'
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

        {/* ─── Contextual "Notify" banner (only when Ready) ─── */}
        {job.status === 'Ready' && (
          <TouchableOpacity
            onPress={() => handleWhatsApp(primaryWaType)}
            activeOpacity={0.88}
            style={styles.notifyBanner}
          >
            <View style={styles.notifyBannerLeft}>
              <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
              <View style={{ flex: 1 }}>
                <Text style={styles.notifyBannerTitle}>
                  Notify {getFirstName(job.customerName)} — order is ready!
                </Text>
                <Text style={styles.notifyBannerSub}>
                  {job.deliveryType === 'waybill' ? 'Send dispatch notice via WhatsApp' : 'Send pickup notice via WhatsApp'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#25D366" />
          </TouchableOpacity>
        )}

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
            {job.photoUris?.[0] ? (
              <Image source={{ uri: job.photoUris[0] }} style={styles.sampleThumb} />
            ) : (
              <View style={styles.samplePlaceholder}>
                <ScissorsIcon size={24} color={Colors.textTertiary} />
              </View>
            )}
          </View>

          {/* Status + Delivery badges */}
          <View style={styles.heroBadgeRow}>
            <StatusBadge status={job.status} />
            <View
              style={[
                styles.deliveryTypeChip,
                job.deliveryType === 'waybill'
                  ? { backgroundColor: '#E8F2FF' }
                  : { backgroundColor: Colors.readyLight },
              ]}
            >
              <Ionicons
                name={job.deliveryType === 'waybill' ? 'cube-outline' : 'storefront-outline'}
                size={11}
                color={job.deliveryType === 'waybill' ? Colors.cutting : Colors.ready}
              />
              <Text
                style={[
                  styles.deliveryTypeText,
                  { color: job.deliveryType === 'waybill' ? Colors.cutting : Colors.ready },
                ]}
              >
                {job.deliveryType === 'waybill' ? 'Waybill' : 'Pickup'}
              </Text>
            </View>
            <View
              style={[
                styles.deliveryChip,
                urgency === 'overdue' && { backgroundColor: Colors.overdueLight },
                urgency === 'today'   && { backgroundColor: Colors.overdueLight },
                urgency === 'soon'    && { backgroundColor: Colors.dueSoonLight },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={11}
                color={
                  urgency === 'overdue' || urgency === 'today'
                    ? Colors.overdue
                    : urgency === 'soon'
                    ? Colors.dueSoon
                    : Colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.deliveryChipText,
                  urgency === 'overdue' && { color: Colors.overdue },
                  urgency === 'today'   && { color: Colors.overdue },
                  urgency === 'soon'    && { color: Colors.dueSoon },
                ]}
              >
                {formatDeliveryDate(job.deliveryDate)}
              </Text>
            </View>
          </View>

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
            <PaymentRow label="Total Price"      value={formatNaira(job.price)} />
            <PaymentRow label="Deposit Paid"     value={formatNaira(job.deposit)} valueColor={Colors.ready} />
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
            {job.fabric && <InfoRow label="Fabric"   value={job.fabric} />}
            <InfoRow label="Created"  value={formatDate(job.createdAt)} />
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
              label="Order confirmation"
              subtitle="Acknowledge receipt of this order"
              iconName="document-text-outline"
              onPress={() => handleWhatsApp('job_created')}
            />
            <View style={styles.waDivider} />
            <WhatsAppRow
              label={job.deliveryType === 'waybill' ? 'Ready to dispatch' : 'Ready for pickup'}
              subtitle={job.deliveryType === 'waybill' ? 'Notify customer to expect shipment' : 'Tell customer their outfit is ready'}
              iconName={job.deliveryType === 'waybill' ? 'cube-outline' : 'bag-check-outline'}
              highlight={job.status === 'Ready'}
              onPress={() => handleWhatsApp(primaryWaType)}
            />
            <View style={styles.waDivider} />
            <WhatsAppRow
              label="Payment reminder"
              subtitle={job.balance > 0 ? `Balance: ${formatNaira(job.balance)}` : 'No outstanding balance'}
              iconName="wallet-outline"
              disabled={job.balance === 0}
              onPress={() => handleWhatsApp('payment_reminder')}
            />
            <View style={styles.waDivider} />
            <WhatsAppRow
              label="Delivery complete"
              subtitle="Thank customer after handoff"
              iconName="checkmark-done-outline"
              onPress={() => handleWhatsApp('delivery_complete')}
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
        {nextStep ? (
          <TouchableOpacity
            onPress={handleNextStep}
            disabled={statusLoading}
            activeOpacity={0.88}
            style={[styles.nextStepBtn, statusLoading && { opacity: 0.7 }]}
          >
            <Ionicons name={nextStep.icon as any} size={18} color={Colors.white} />
            <Text style={styles.nextStepText}>{nextStep.label}</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.nextStepBtn, { backgroundColor: Colors.delivered }]}>
            <Ionicons name="checkmark-done" size={18} color={Colors.white} />
            <Text style={styles.nextStepText}>Delivered</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => setShowSummary(true)}
          style={styles.summaryBtn}
        >
          <Text style={styles.summaryBtnText}>Summary</Text>
        </TouchableOpacity>
      </View>

      {/* ─── WhatsApp Message Preview Modal ─── */}
      {waPreview && (
        <Modal
          visible={waPreview.visible}
          transparent
          animationType="slide"
          presentationStyle="overFullScreen"
          onRequestClose={() => setWaPreview(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, styles.previewSheet]}>
              <View style={styles.modalHandle} />

              <View style={styles.previewHeader}>
                <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={styles.previewTitle}>Preview message</Text>
                  <Text style={styles.previewRecipient}>
                    To: {waPreview.recipientName} · {waPreview.phone}
                  </Text>
                </View>
              </View>

              <View style={styles.previewBubbleWrap}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.previewBubble}>
                    <Text style={styles.previewBubbleText}>{waPreview.messageText}</Text>
                  </View>
                </ScrollView>
              </View>

              <TouchableOpacity
                onPress={handleConfirmSend}
                style={styles.sendWaBtn}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-whatsapp" size={18} color={Colors.white} />
                <Text style={styles.sendWaBtnText}>Open in WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setWaPreview(null)}
                style={styles.cancelPreviewBtn}
              >
                <Text style={styles.cancelPreviewText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

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
              <SummaryItem label="Outfit"   value={`${job.outfitType}${job.style ? ' · ' + job.style : ''}`} />
              <SummaryItem label="Status"   value={job.status} />
              <SummaryItem
                label="Delivery"
                value={`${job.deliveryType === 'waybill' ? 'Waybill' : 'Pickup'} · ${formatDeliveryDate(job.deliveryDate)}`}
              />
              {job.deliveryAddress && (
                <SummaryItem label="Destination" value={job.deliveryAddress} />
              )}
              <SummaryItem label="Price"   value={formatNaira(job.price)} />
              <SummaryItem label="Deposit" value={formatNaira(job.deposit)} />
              <SummaryItem
                label="Balance"
                value={formatNaira(job.balance)}
                valueColor={job.balance > 0 ? Colors.overdue : Colors.ready}
              />
              {job.fabric && <SummaryItem label="Fabric" value={job.fabric} />}
              {job.notes  && <SummaryItem label="Notes"  value={job.notes} />}
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
        const isPast    = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <View key={s} style={styles.pipelineStep}>
            <View
              style={[
                styles.pipelineDot,
                isPast    && { backgroundColor: Colors.ready, borderColor: Colors.ready },
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

const WhatsAppRow: React.FC<{
  label: string;
  subtitle?: string;
  iconName: string;
  highlight?: boolean;
  disabled?: boolean;
  onPress: () => void;
}> = ({ label, subtitle, iconName, highlight = false, disabled = false, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.waRow, highlight && styles.waRowHighlight, disabled && styles.waRowDisabled]}
    activeOpacity={disabled ? 1 : 0.8}
    disabled={disabled}
  >
    <View style={[styles.waIcon, highlight && { backgroundColor: '#25D366' }]}>
      <Ionicons name={iconName as any} size={20} color={highlight ? Colors.white : '#25D366'} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.waLabel, disabled && { color: Colors.textTertiary }]}>{label}</Text>
      {subtitle ? (
        <Text style={[styles.waSubLabel, disabled && { color: Colors.borderLight }]}>{subtitle}</Text>
      ) : null}
    </View>
    <Ionicons
      name="chevron-forward"
      size={16}
      color={disabled ? Colors.borderLight : highlight ? '#25D366' : Colors.textTertiary}
    />
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

  // Notify banner
  notifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF7',
    borderWidth: 1.5,
    borderColor: '#25D36640',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  notifyBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  notifyBannerTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: '#1a7a3f',
  },
  notifyBannerSub: {
    fontSize: Typography.xs,
    color: '#1a7a3f99',
    marginTop: 2,
  },

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
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  deliveryTypeText: { fontSize: Typography.xs, fontWeight: Typography.semibold },
  deliveryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
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

  // WhatsApp rows
  waRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md + 2, gap: Spacing.md,
  },
  waRowHighlight: { backgroundColor: '#F0FFF7' },
  waRowDisabled: { opacity: 0.5 },
  waIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#E8FFF1', alignItems: 'center', justifyContent: 'center',
  },
  waLabel: { fontSize: Typography.base, color: Colors.textPrimary, fontWeight: Typography.medium },
  waSubLabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  waDivider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.base },

  // Growth loop
  growthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: '#EBF5FF',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  growthText: { flex: 1, fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semibold, marginRight: Spacing.sm },
  growthBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md },
  growthBtnText: { color: Colors.white, fontSize: Typography.sm, fontWeight: Typography.bold },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 24 : Spacing.base,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.md,
  },
  nextStepBtn: {
    flex: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, paddingVertical: Spacing.md,
    borderRadius: Radius.lg, gap: Spacing.sm,
  },
  nextStepText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.white },
  summaryBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  summaryBtnText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },

  // Modals shared
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.base, paddingBottom: 32,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.lg, fontWeight: Typography.bold,
    color: Colors.textPrimary, marginBottom: Spacing.lg,
  },

  // WhatsApp preview modal
  previewSheet: { maxHeight: '85%' },
  previewHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  previewTitle: {
    fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary,
  },
  previewRecipient: {
    fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2,
  },
  previewBubbleWrap: {
    maxHeight: 220, marginBottom: Spacing.lg,
  },
  previewBubble: {
    backgroundColor: '#E8FFF1',
    borderRadius: Radius.lg, borderTopLeftRadius: 4,
    padding: Spacing.base,
  },
  previewBubbleText: {
    fontSize: Typography.base, color: '#1a4a2e', lineHeight: 22,
  },
  sendWaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#25D366', borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2, gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sendWaBtnText: {
    fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.white,
  },
  cancelPreviewBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  cancelPreviewText: { fontSize: Typography.base, color: Colors.textSecondary },

  // Status picker
  statusOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.base,
    borderRadius: Radius.md, marginBottom: 4, gap: Spacing.md,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusOptionText: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary },

  // Summary sheet
  summarySheet: { maxHeight: '75%' },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  summaryLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  summaryValue: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textPrimary, maxWidth: '60%', textAlign: 'right' },
});

export default JobDetailScreen;
