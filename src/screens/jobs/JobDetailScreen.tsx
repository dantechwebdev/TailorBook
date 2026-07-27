import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
  TextInput,
  Switch,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { parseISO, subDays, isAfter, isBefore, format } from 'date-fns';
import { useSpringScale, useEntrance, useShimmerPress } from '../../utils/animations';
import { useStore } from '../../context/store';
import { useTheme } from '../../context/ThemeContext';
import {
  Typography,
  Spacing,
  Radius,
  Shadow,
  getJobStatusConfig,
  JOB_STATUSES,
  ColorPalette,
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
import { formatDeliveryDate, formatDate, formatDateTime, formatNaira, getDeliveryUrgency, getFirstName } from '../../utils/helpers';
import { JobStatus, JobReminder } from '../../types';
import {
  buildWhatsAppUrl,
  buildMessageText,
  buildDirectChatUrl,
  WhatsAppMessageType,
} from '../../utils/whatsapp';
import { REMINDER_PRESETS, computeReminderDate } from '../../utils/notifications/presets';
import FloatingAssistant from '../../components/ai/FloatingAssistant';
import { useAIContext } from '../../services/ai/context/ContextEngine';

// ─── Improvement #15 — haptic feedback (graceful no-op if expo-haptics not installed) ─────
let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch {}
const hapticLight = () => { try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle?.Light); } catch {} };
const hapticSuccess = () => { try { Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType?.Success); } catch {} };

// ─── Improvement #12 — outfit type emoji map ──────────────────────────────────
const OUTFIT_EMOJI: Record<string, string> = {
  Agbada: '👘', Senator: '🥻', Suit: '🤵', Shirt: '👔',
  Trouser: '👖', Gown: '👗', Kaftan: '🧥', Skirt: '👗',
  Blouse: '👚', Other: '🪡',
};

// ─── Auto-reminder schedule (derived from delivery date) ──────────────────────

const AUTO_REMINDER_DAYS = [
  { days: 7, label: '7 days before delivery' },
  { days: 3, label: '3 days before delivery' },
  { days: 1, label: '1 day before delivery' },
  { days: 0, label: 'On delivery day' },
];

// ─── Next Step Config ─────────────────────────────────────────────────────────

const STATUS_ORDER: JobStatus[] = [
  'Pending', 'Cutting', 'Sewing', 'Finishing', 'Ready', 'Delivered',
];

function getNextStep(
  status: JobStatus,
  deliveryType: 'pickup' | 'waybill'
): { label: string; icon: string } | null {
  switch (status) {
    case 'Pending':   return { label: 'Start Cutting',     icon: 'cut-outline' };
    case 'Cutting':   return { label: 'Move to Sewing',    icon: 'git-commit-outline' };
    case 'Sewing':    return { label: 'Move to Finishing', icon: 'layers-outline' };
    case 'Finishing': return { label: 'Mark as Ready',     icon: 'checkmark-circle-outline' };
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

  const {
    getJob, getCustomer, updateJobStatus, deleteJob,
    getMeasurementsByCustomer, settings,
    addJobReminder, removeJobReminder, getJobReminders,
  } = useStore();

  const job = getJob(jobId);
  const customer = job ? getCustomer(job.customerId) : null;
  const currency = settings?.currency || '₦';
  const customReminders = job ? getJobReminders(jobId) : [];

  // ── AI Context Engine registration ──────────────────────────────────────
  // Every tool the assistant can run on this screen (estimate fabric, send
  // WhatsApp, generate an invoice, etc.) reads this live context instead of
  // asking the tailor which job/customer they mean.
  const allCustomerMeasurements = customer ? getMeasurementsByCustomer(customer.id) : [];
  useAIContext({
    screen: 'JobDetail',
    job: job ?? undefined,
    customer: customer ?? undefined,
    measurements: allCustomerMeasurements,
  });

  // ── Theme — live palette, reactive to Light/Dark/System instantly ──────
  const { colors: Colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);
  const statusConfig = useMemo(() => getJobStatusConfig(Colors), [Colors]);

  // ── Entrance animations ────────────────────────────────────────────────
  const heroAnim    = useEntrance(0,   10);  // hero card slides up first
  const contentAnim = useEntrance(120, 8);   // sections follow

  // ── Status badge scale — pulses on milestone ───────────────────────────
  const { style: badgeScaleStyle, pulse: pulseBadge } = useSpringScale(1, 1, 0);

  // ─── Core state
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [waPreview, setWaPreview] = useState<WaPreview | null>(null);

  // ─── Reminder state
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [reminderMode, setReminderMode] = useState<'before_delivery' | 'specific_date'>('before_delivery');
  const [reminderDaysBefore, setReminderDaysBefore] = useState(3);
  const [reminderRepeatEvery, setReminderRepeatEvery] = useState(0);
  const [specificDate, setSpecificDate] = useState('');
  const [specificHour, setSpecificHour] = useState(8);
  const [reminderLabel, setReminderLabel] = useState('');
  const [addingReminder, setAddingReminder] = useState(false);
  const [selectedPresetKey, setSelectedPresetKey] = useState(REMINDER_PRESETS[REMINDER_PRESETS.length - 4]?.key ?? REMINDER_PRESETS[0].key);
  const [overdueToggleLoading, setOverdueToggleLoading] = useState(false);

  const selectedPreset = REMINDER_PRESETS.find((p) => p.key === selectedPresetKey) ?? REMINDER_PRESETS[0];
  const overdueReminderOn = false; // placeholder — store does not yet expose hasRecurringOverdueReminder

  const handleToggleOverdueReminder = async (_value: boolean) => {
    setOverdueToggleLoading(true);
    try {
      // setRecurringOverdueReminder not yet in store — no-op for now
    } finally {
      setOverdueToggleLoading(false);
    }
  };

  // ─── Computed reminder preview date
  const computedReminderDate = useMemo<Date | null>(() => {
    if (!job) return null;
    if (reminderMode === 'before_delivery') {
      try {
        const d = subDays(parseISO(job.deliveryDate), reminderDaysBefore);
        d.setHours(8, 0, 0, 0);
        return d;
      } catch { return null; }
    } else {
      if (!specificDate) return null;
      try {
        const d = parseISO(specificDate);
        if (isNaN(d.getTime())) return null;
        d.setHours(specificHour, 0, 0, 0);
        return d;
      } catch { return null; }
    }
  }, [reminderMode, reminderDaysBefore, specificDate, specificHour, job]);

  // ─── Repeat-generated dates (preview)
  const repeatGeneratedDates = useMemo<Date[]>(() => {
    if (!job || reminderMode !== 'before_delivery' || reminderRepeatEvery === 0) return [];
    try {
      const deliveryDate = parseISO(job.deliveryDate);
      const dates: Date[] = [];
      let d = reminderDaysBefore;
      while (d >= 0) {
        const date = subDays(deliveryDate, d);
        date.setHours(8, 0, 0, 0);
        dates.push(new Date(date));
        d -= reminderRepeatEvery;
        if (d < 0) break;
      }
      return dates;
    } catch { return []; }
  }, [job, reminderMode, reminderDaysBefore, reminderRepeatEvery]);

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

  // ─── Handlers

  const handleStatusChange = async (newStatus: JobStatus) => {
    setStatusLoading(true);
    setShowStatusPicker(false);
    hapticLight(); // #15 — immediate tactile response on status tap
    await updateJobStatus(job.id, newStatus);
    if (newStatus === 'Ready' || newStatus === 'Delivered') {
      hapticSuccess(); // #15 — celebratory pulse for key milestones
      pulseBadge();   // badge scale animation on milestone
    }
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
      Alert.alert('WhatsApp not available', 'Could not open WhatsApp. Make sure it is installed on your device.');
    });
    setWaPreview(null);
  };

  const handleDeleteReminder = async (reminderId: string) => {
    Alert.alert(
      'Delete Reminder',
      'Remove this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeJobReminder(reminderId) },
      ]
    );
  };

  const handleSaveReminder = async () => {
    if (addingReminder) return;
    setAddingReminder(true);
    try {
      if (reminderMode === 'before_delivery') {
        const date = computeReminderDate(parseISO(job.deliveryDate), selectedPreset.minutesBefore);
        if (!isAfter(date, new Date())) {
          Alert.alert('Date has passed', 'This reminder date is already in the past. Choose a shorter time before delivery.');
          return;
        }
        const label = reminderLabel || selectedPreset.label;
        await addJobReminder(job.id, date, label, selectedPreset.minutesBefore);
      } else {
        // Specific date
        if (!specificDate) {
          Alert.alert('No date', 'Please enter a date in YYYY-MM-DD format.');
          return;
        }
        const date = parseISO(specificDate);
        if (isNaN(date.getTime())) {
          Alert.alert('Invalid date', 'Please enter a valid date like 2025-07-15.');
          return;
        }
        date.setHours(specificHour, 0, 0, 0);
        if (!isAfter(date, new Date())) {
          Alert.alert('Date has passed', 'Please choose a future date and time.');
          return;
        }
        await addJobReminder(job.id, date, reminderLabel);
      }

      // Reset modal
      setShowAddReminder(false);
      setReminderLabel('');
      setReminderDaysBefore(3);
      setReminderRepeatEvery(0);
      setSpecificDate('');
      setSpecificHour(8);
      setReminderMode('before_delivery');
      setSelectedPresetKey(REMINDER_PRESETS[REMINDER_PRESETS.length - 4]?.key ?? REMINDER_PRESETS[0].key);
    } finally {
      setAddingReminder(false);
    }
  };

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
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <BackIcon size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.navigate('HomeTab')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <HomeIcon size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('JobEdit', { jobId })} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <EditIcon size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <TrashIcon size={20} color={Colors.overdue} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ─── Contextual Notify Banner (Ready) ─── */}
        {job.status === 'Ready' && (
          <TouchableOpacity onPress={() => handleWhatsApp(primaryWaType)} activeOpacity={0.88} style={styles.notifyBanner}>
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

        {/* ─── Hero — slides up on mount ─── */}
        <Animated.View style={heroAnim.style}>
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
                {/* Improvement #12 — meaningful outfit emoji, not a generic scissors */}
                <Text style={{ fontSize: 36 }}>{OUTFIT_EMOJI[job.outfitType] ?? '🪡'}</Text>
              </View>
            )}
          </View>

          <View style={styles.heroBadgeRow}>
            {/* Status badge with scale pulse on milestone ─── */}
            <Animated.View style={badgeScaleStyle}>
              <StatusBadge status={job.status} />
            </Animated.View>
            <View style={[styles.deliveryTypeChip, job.deliveryType === 'waybill' ? { backgroundColor: Colors.cuttingLight } : { backgroundColor: Colors.readyLight }]}>
              <Ionicons
                name={job.deliveryType === 'waybill' ? 'cube-outline' : 'storefront-outline'}
                size={11}
                color={job.deliveryType === 'waybill' ? Colors.cutting : Colors.ready}
              />
              <Text style={[styles.deliveryTypeText, { color: job.deliveryType === 'waybill' ? Colors.cutting : Colors.ready }]}>
                {job.deliveryType === 'waybill' ? 'Waybill' : 'Pickup'}
              </Text>
            </View>
            <View style={[
              styles.deliveryChip,
              urgency === 'overdue' && { backgroundColor: Colors.overdueLight },
              urgency === 'today'   && { backgroundColor: Colors.overdueLight },
              urgency === 'soon'    && { backgroundColor: Colors.dueSoonLight },
            ]}>
              <Ionicons
                name="calendar-outline" size={11}
                color={urgency === 'overdue' || urgency === 'today' ? Colors.overdue : urgency === 'soon' ? Colors.dueSoon : Colors.textSecondary}
              />
              <Text style={[styles.deliveryChipText, urgency === 'overdue' && { color: Colors.overdue }, urgency === 'today' && { color: Colors.overdue }, urgency === 'soon' && { color: Colors.dueSoon }]}>
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
        </Animated.View>

        {/* ─── All content sections — enter 120ms after hero ─── */}
        <Animated.View style={contentAnim.style}>

        {/* ─── Progress — Improvement #3: tappable inline status rail ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <Card>
            <StatusRail
              currentStatus={job.status}
              onChangeStatus={handleStatusChange}
              loading={statusLoading}
              colors={Colors}
              styles={styles}
            />
          </Card>
        </View>

        {/* ─── Payment ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <Card>
            <PaymentRow label="Total Price"      value={formatNaira(job.price)} colors={Colors} styles={styles} />
            <PaymentRow label="Deposit Paid"     value={formatNaira(job.deposit)} valueColor={Colors.ready} colors={Colors} styles={styles} />
            <View style={styles.paymentDivider} />
            <PaymentRow label="Balance Remaining" value={formatNaira(job.balance)} valueColor={job.balance > 0 ? Colors.overdue : Colors.ready} bold colors={Colors} styles={styles} />
          </Card>
        </View>

        {/* ─── Details ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <Card>
            {job.fabric && <InfoRow label="Fabric"   value={job.fabric} colors={Colors} styles={styles} />}
            <InfoRow label="Created"  value={formatDate(job.createdAt)} colors={Colors} styles={styles} />
            <InfoRow label="Delivery" value={formatDeliveryDate(job.deliveryDate)} last colors={Colors} styles={styles} />
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

        {/* ─── Reminders ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminders</Text>
          <Card padding={0}>
            {/* Auto-scheduled reminders (from delivery date) */}
            {AUTO_REMINDER_DAYS.map(({ days, label }, idx) => {
              const triggerDate = subDays(parseISO(job.deliveryDate), days);
              triggerDate.setHours(8, 0, 0, 0);
              const isPast = isBefore(triggerDate, new Date());
              return (
                <View key={days}>
                  <View style={[styles.reminderRow, isPast && styles.reminderRowPast]}>
                    <View style={[styles.reminderIconWrap, { backgroundColor: isPast ? Colors.borderLight : Colors.cuttingLight }]}>
                      <Ionicons
                        name={isPast ? 'checkmark' : 'time-outline'}
                        size={14}
                        color={isPast ? Colors.textTertiary : Colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.reminderLabel, isPast && { color: Colors.textTertiary }]}>{label}</Text>
                      <Text style={styles.reminderDate}>
                        {format(triggerDate, 'EEE d MMM')} at 8:00 AM
                      </Text>
                    </View>
                    <View style={styles.reminderAutoTag}>
                      <Text style={styles.reminderAutoText}>Auto</Text>
                    </View>
                  </View>
                  {(idx < AUTO_REMINDER_DAYS.length - 1 || customReminders.length > 0) && (
                    <View style={styles.waDivider} />
                  )}
                </View>
              );
            })}

            {/* Custom reminders */}
            {customReminders.map((r, idx) => {
              const date = new Date(r.scheduledAt);
              const isPast = isBefore(date, new Date());
              return (
                <View key={r.id}>
                  <View style={[styles.reminderRow, isPast && styles.reminderRowPast]}>
                    <View style={[styles.reminderIconWrap, { backgroundColor: isPast ? Colors.borderLight : Colors.dueSoonLight }]}>
                      <Ionicons
                        name={isPast ? 'checkmark' : 'notifications-outline'}
                        size={14}
                        color={isPast ? Colors.textTertiary : Colors.dueSoon}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.reminderLabel, isPast && { color: Colors.textTertiary }]}>
                        {r.label || 'Custom reminder'}
                      </Text>
                      <Text style={styles.reminderDate}>
                        {format(date, 'EEE d MMM')} at {format(date, 'h:mm a')}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteReminder(r.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="trash-outline" size={16} color={Colors.overdue} />
                    </TouchableOpacity>
                  </View>
                  {idx < customReminders.length - 1 && <View style={styles.waDivider} />}
                </View>
              );
            })}

            {/* Add reminder button */}
            {customReminders.length > 0 && <View style={styles.waDivider} />}
            <TouchableOpacity onPress={() => setShowAddReminder(true)} style={styles.addReminderBtn}>
              <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.addReminderText}>Add Custom Reminder</Text>
            </TouchableOpacity>
          </Card>

          {job.status !== 'Ready' && job.status !== 'Delivered' && (
            <View style={styles.overdueToggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.overdueToggleLabel}>Remind me daily while overdue</Text>
                <Text style={styles.overdueToggleSub}>Gets a daily nudge until job is marked Ready</Text>
              </View>
              <Switch
                value={overdueReminderOn}
                onValueChange={handleToggleOverdueReminder}
                disabled={overdueToggleLoading}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          )}
        </View>

        {/* ─── WhatsApp Actions ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WhatsApp</Text>
          <Card padding={0}>
            <WhatsAppRow
              label="Order confirmation"
              subtitle="Acknowledge receipt of this order"
              iconName="document-text-outline"
              onPress={() => handleWhatsApp('job_created')}
              colors={Colors}
              styles={styles}
            />
            <View style={styles.waDivider} />
            <WhatsAppRow
              label={job.deliveryType === 'waybill' ? 'Ready to dispatch' : 'Ready for pickup'}
              subtitle={job.deliveryType === 'waybill' ? 'Notify customer to expect shipment' : 'Tell customer their outfit is ready'}
              iconName={job.deliveryType === 'waybill' ? 'cube-outline' : 'bag-check-outline'}
              highlight={job.status === 'Ready'}
              onPress={() => handleWhatsApp(primaryWaType)}
              colors={Colors}
              styles={styles}
            />
            <View style={styles.waDivider} />
            <WhatsAppRow
              label="Payment reminder"
              subtitle={job.balance > 0 ? `Balance: ${formatNaira(job.balance)}` : 'No outstanding balance'}
              iconName="wallet-outline"
              disabled={job.balance === 0}
              onPress={() => handleWhatsApp('payment_reminder')}
              colors={Colors}
              styles={styles}
            />
            <View style={styles.waDivider} />
            <WhatsAppRow
              label="Delivery complete"
              subtitle="Thank customer after handoff"
              iconName="checkmark-done-outline"
              onPress={() => handleWhatsApp('delivery_complete')}
              colors={Colors}
              styles={styles}
            />
          </Card>
        </View>

        {/* ─── Studio ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Studio</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('TailorStudio', { jobId: job.id, customerId: job.customerId })}
            activeOpacity={0.85}
            style={styles.studioCard}
            accessibilityLabel="Open TailorStudio"
            accessibilityRole="button"
          >
            <View style={styles.studioLeft}>
              <Text style={styles.studioEmoji}>🧵</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.studioTitle}>TailorStudio</Text>
                <Text style={styles.studioSubtitle}>Generate design concepts for this job</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
        </Animated.View>
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

      {/* ─── Bottom Bar: Next Step ─── */}
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
        <TouchableOpacity onPress={() => setShowSummary(true)} style={styles.summaryBtn}>
          <Text style={styles.summaryBtnText}>Summary</Text>
        </TouchableOpacity>
      </View>

      {/* ─── WhatsApp Message Preview Modal ─── */}
      {waPreview && (
        <Modal visible={waPreview.visible} transparent animationType="slide" presentationStyle="overFullScreen" onRequestClose={() => setWaPreview(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, styles.previewSheet]}>
              <View style={styles.modalHandle} />
              <View style={styles.previewHeader}>
                <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={styles.previewTitle}>Preview message</Text>
                  <Text style={styles.previewRecipient}>To: {waPreview.recipientName} · {waPreview.phone}</Text>
                </View>
              </View>
              <View style={styles.previewBubbleWrap}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.previewBubble}>
                    <Text style={styles.previewBubbleText}>{waPreview.messageText}</Text>
                  </View>
                </ScrollView>
              </View>
              <TouchableOpacity onPress={handleConfirmSend} style={styles.sendWaBtn} activeOpacity={0.85}>
                <Ionicons name="logo-whatsapp" size={18} color={Colors.white} />
                <Text style={styles.sendWaBtnText}>Open in WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setWaPreview(null)} style={styles.cancelPreviewBtn}>
                <Text style={styles.cancelPreviewText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ─── Add Custom Reminder Modal ─── */}
      <Modal visible={showAddReminder} transparent animationType="slide" presentationStyle="overFullScreen" onRequestClose={() => setShowAddReminder(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, styles.reminderSheet]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Reminder</Text>

            {/* Mode selector */}
            <View style={styles.modeTabRow}>
              <TouchableOpacity
                onPress={() => setReminderMode('before_delivery')}
                style={[styles.modeTab, reminderMode === 'before_delivery' && styles.modeTabActive]}
              >
                <Text style={[styles.modeTabText, reminderMode === 'before_delivery' && styles.modeTabTextActive]}>
                  Before delivery
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setReminderMode('specific_date')}
                style={[styles.modeTab, reminderMode === 'specific_date' && styles.modeTabActive]}
              >
                <Text style={[styles.modeTabText, reminderMode === 'specific_date' && styles.modeTabTextActive]}>
                  Specific date
                </Text>
              </TouchableOpacity>
            </View>

            {reminderMode === 'before_delivery' ? (
              <>
                <Text style={styles.reminderSubTitle}>Remind me</Text>
                <View style={styles.chipRow}>
                  {REMINDER_PRESETS.map((preset) => (
                    <TouchableOpacity
                      key={preset.key}
                      style={[styles.chip, selectedPresetKey === preset.key && styles.chipActive]}
                      onPress={() => setSelectedPresetKey(preset.key)}
                    >
                      <Text style={[styles.chipText, selectedPresetKey === preset.key && styles.chipTextActive]}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.reminderSubTitle}>Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.reminderInput}
                  value={specificDate}
                  onChangeText={setSpecificDate}
                  placeholder="e.g. 2025-07-15"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />

                <Text style={styles.reminderSubTitle}>Time</Text>
                <View style={styles.chipRow}>
                  {[6, 7, 8, 9, 10, 12].map((h) => (
                    <TouchableOpacity
                      key={h}
                      onPress={() => setSpecificHour(h)}
                      style={[styles.chip, specificHour === h && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, specificHour === h && styles.chipTextActive]}>
                        {h < 12 ? `${h}am` : '12pm'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {computedReminderDate && (
                  <View style={styles.reminderPreviewBox}>
                    <Text style={styles.reminderPreviewText}>
                      Will remind on: {format(computedReminderDate, 'EEE d MMM yyyy')} at {format(computedReminderDate, 'h:mm a')}
                    </Text>
                  </View>
                )}
              </>
            )}

            <Text style={styles.reminderSubTitle}>Label (optional)</Text>
            <TextInput
              style={styles.reminderInput}
              value={reminderLabel}
              onChangeText={setReminderLabel}
              placeholder="e.g. Check stitching before delivery"
              placeholderTextColor={Colors.textTertiary}
              maxLength={60}
            />

            <TouchableOpacity
              onPress={handleSaveReminder}
              disabled={addingReminder}
              style={[styles.addReminderSaveBtn, addingReminder && { opacity: 0.7 }]}
            >
              <Ionicons name="notifications-outline" size={16} color={Colors.white} />
              <Text style={styles.addReminderSaveBtnText}>
                {addingReminder ? 'Saving…' : 'Add Reminder'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowAddReminder(false)} style={styles.cancelPreviewBtn}>
              <Text style={styles.cancelPreviewText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Status Picker ─── */}
      <Modal visible={showStatusPicker} transparent animationType="slide" presentationStyle="overFullScreen">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Change Status</Text>
            {JOB_STATUSES.map((s) => {
              const config = statusConfig[s as JobStatus];
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

      {/* ─── Floating AI Assistant ─── */}
      <FloatingAssistant
        screen="JobDetail"
        context={{
          screen: 'JobDetail',
          data: {
            outfitType: job.outfitType,
            status: job.status,
            customerName: job.customerName,
            deliveryDate: job.deliveryDate,
            daysUntilDue: Math.ceil(
              (new Date(job.deliveryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            ),
            price: job.price,
            balance: job.balance,
            hasPhoto: (job.photoUris?.length ?? 0) > 0,
            hasMeasurements: !!measurements,
          },
        }}
      />

      {/* ─── Summary Sheet ─── */}
      <Modal visible={showSummary} transparent animationType="slide" presentationStyle="overFullScreen">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, styles.summarySheet]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Job Summary</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <SummaryItem label="Customer" value={job.customerName} styles={styles} />
              <SummaryItem label="Outfit"   value={`${job.outfitType}${job.style ? ' · ' + job.style : ''}`} styles={styles} />
              <SummaryItem label="Status"   value={job.status} styles={styles} />
              <SummaryItem label="Delivery" value={`${job.deliveryType === 'waybill' ? 'Waybill' : 'Pickup'} · ${formatDeliveryDate(job.deliveryDate)}`} styles={styles} />
              {job.deliveryAddress && <SummaryItem label="Destination" value={job.deliveryAddress} styles={styles} />}
              <SummaryItem label="Price"   value={formatNaira(job.price)} styles={styles} />
              <SummaryItem label="Deposit" value={formatNaira(job.deposit)} styles={styles} />
              <SummaryItem label="Balance" value={formatNaira(job.balance)} valueColor={job.balance > 0 ? Colors.overdue : Colors.ready} styles={styles} />
              {job.fabric && <SummaryItem label="Fabric" value={job.fabric} styles={styles} />}
              {job.notes  && <SummaryItem label="Notes"  value={job.notes} styles={styles} />}
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

// ─── Improvement #3 — Tappable Inline Status Rail with animated fill ─────────

const StatusRail: React.FC<{
  currentStatus: JobStatus;
  onChangeStatus: (s: JobStatus) => void;
  loading: boolean;
  colors: ColorPalette;
  styles: ReturnType<typeof createStyles>;
}> = ({ currentStatus, onChangeStatus, loading, colors, styles }) => {
  const currentIdx = STATUS_PIPELINE.indexOf(currentStatus);
  const statusConfig = useMemo(() => getJobStatusConfig(colors), [colors]);

  // Animated fill progress (0 → 1 across the full rail width)
  const fillProgress = useRef(new Animated.Value(0)).current;

  // Dot scale for the active stage — pulses when status changes
  const dotScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate fill to current position
    Animated.timing(fillProgress, {
      toValue: currentIdx / Math.max(STATUS_PIPELINE.length - 1, 1),
      duration: 340,
      useNativeDriver: false, // drives width %
    }).start();

    // Pulse the active dot
    Animated.sequence([
      Animated.spring(dotScale, { toValue: 1.35, useNativeDriver: true, tension: 120, friction: 5 }),
      Animated.spring(dotScale, { toValue: 1,    useNativeDriver: true, tension: 80,  friction: 8 }),
    ]).start();
  }, [currentIdx]);

  return (
    <View>
      {/* Rail track */}
      <View style={styles.railTrack}>
        {/* Animated filled segment */}
        <Animated.View
          style={[
            styles.railFilled,
            {
              backgroundColor: colors.ready,
              width: fillProgress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Dots row — rendered over the track */}
      <View style={styles.rail}>
        {STATUS_PIPELINE.map((s, idx) => {
          const config    = statusConfig[s];
          const isPast    = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isFuture  = idx > currentIdx;

          return (
            <TouchableOpacity
              key={s}
              onPress={() => !loading && onChangeStatus(s as JobStatus)}
              disabled={loading || isCurrent}
              activeOpacity={0.7}
              style={styles.railStep}
              accessibilityLabel={`Set status to ${s}`}
            >
              {/* Dot */}
              <Animated.View
                style={[
                  styles.railDot,
                  isPast    && { backgroundColor: colors.ready, borderColor: colors.ready },
                  isCurrent && {
                    backgroundColor: config.color,
                    borderColor: config.color,
                    width: 18, height: 18, borderRadius: 9,
                    transform: [{ scale: dotScale }],
                  },
                  isFuture  && { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                {isPast && <CheckIcon size={8} color={colors.white} strokeWidth={3} />}
                {isCurrent && (
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.white }} />
                )}
              </Animated.View>

              {/* Label */}
              <Text style={[
                styles.railLabel,
                isCurrent && { color: config.color, fontWeight: Typography.bold },
                isFuture  && { color: colors.textTertiary },
              ]}>
                {s}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.railHint}>Tap any stage to update</Text>
    </View>
  );
};

const StatusPipeline: React.FC<{
  currentStatus: JobStatus;
  colors: ColorPalette;
  styles: ReturnType<typeof createStyles>;
}> = ({ currentStatus, colors, styles }) => {
  const currentIdx = STATUS_PIPELINE.indexOf(currentStatus);
  const statusConfig = useMemo(() => getJobStatusConfig(colors), [colors]);
  return (
    <View style={styles.pipeline}>
      {STATUS_PIPELINE.map((s, idx) => {
        const config = statusConfig[s];
        const isPast    = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <View key={s} style={styles.pipelineStep}>
            <View style={[
              styles.pipelineDot,
              isPast    && { backgroundColor: colors.ready, borderColor: colors.ready },
              isCurrent && { backgroundColor: config.color, borderColor: config.color, width: 16, height: 16 },
            ]}>
              {isPast && <CheckIcon size={8} color={colors.white} strokeWidth={3} />}
            </View>
            {idx < STATUS_PIPELINE.length - 1 && (
              <View style={[styles.pipelineLine, isPast && { backgroundColor: colors.ready }]} />
            )}
            <Text style={[
              styles.pipelineLabel,
              isCurrent && { color: config.color, fontWeight: Typography.bold },
            ]}>{s}</Text>
          </View>
        );
      })}
    </View>
  );
};

const PaymentRow: React.FC<{
  label: string; value: string; valueColor?: string; bold?: boolean;
  colors: ColorPalette; styles: ReturnType<typeof createStyles>;
}> = ({
  label, value, valueColor, bold = false, colors, styles,
}) => (
  <View style={styles.paymentRow}>
    <Text style={styles.paymentLabel}>{label}</Text>
    <Text style={[styles.paymentValue, { color: valueColor ?? colors.textPrimary }, bold && { fontWeight: Typography.bold, fontSize: Typography.md }]}>{value}</Text>
  </View>
);

const InfoRow: React.FC<{
  label: string; value: string; last?: boolean;
  colors: ColorPalette; styles: ReturnType<typeof createStyles>;
}> = ({ label, value, last, colors, styles }) => (
  <View style={[styles.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const WhatsAppRow: React.FC<{
  label: string; subtitle?: string; iconName: string; highlight?: boolean; disabled?: boolean; onPress: () => void;
  colors: ColorPalette; styles: ReturnType<typeof createStyles>;
}> = ({ label, subtitle, iconName, highlight = false, disabled = false, onPress, colors, styles }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.waRow, highlight && styles.waRowHighlight, disabled && styles.waRowDisabled]}
    activeOpacity={disabled ? 1 : 0.8}
    disabled={disabled}
  >
    {/* #25D366 is the fixed WhatsApp brand green — intentionally theme-independent */}
    <View style={[styles.waIcon, highlight && { backgroundColor: '#25D366' }]}>
      <Ionicons name={iconName as any} size={20} color={highlight ? colors.white : '#25D366'} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.waLabel, disabled && { color: colors.textTertiary }]}>{label}</Text>
      {subtitle ? <Text style={[styles.waSubLabel, disabled && { color: colors.borderLight }]}>{subtitle}</Text> : null}
    </View>
    <Ionicons name="chevron-forward" size={16} color={disabled ? colors.borderLight : highlight ? '#25D366' : colors.textTertiary} />
  </TouchableOpacity>
);

const SummaryItem: React.FC<{
  label: string; value: string; valueColor?: string;
  styles: ReturnType<typeof createStyles>;
}> = ({ label, value, valueColor, styles }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={[styles.summaryValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
// Theme-reactive factory. Called via useMemo(() => createStyles(Colors), [Colors])
// inside JobDetailScreen so it re-evaluates instantly on Light/Dark/System change.

const createStyles = (Colors: ColorPalette, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  headerTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xxxl },

  // WhatsApp-tinted notify banner — background/text adapt per theme; brand green stays fixed
  notifyBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.readyLight, borderWidth: 1.5, borderColor: '#25D36640', borderRadius: Radius.lg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, marginBottom: Spacing.md, gap: Spacing.md },
  notifyBannerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  notifyBannerTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.ready },
  notifyBannerSub: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },

  heroCard: { marginBottom: Spacing.xl },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  heroLeft: { flex: 1, paddingRight: Spacing.md },
  outfitType: { fontSize: Typography.xxl, fontWeight: Typography.extrabold, color: Colors.textPrimary, marginBottom: 4 },
  outfitStyle: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  customerLink: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  customerLinkText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.medium },
  sampleThumb: { width: 90, height: 110, borderRadius: Radius.md, resizeMode: 'cover' },
  samplePlaceholder: { width: 90, height: 110, borderRadius: Radius.md, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' },

  // ─── Status Rail track + animated fill ───────────────────────────────────
  railTrack: {
    position: 'absolute',
    top: 22, // vertically centered on dots
    left: '8%',
    right: '8%',
    height: 2,
    backgroundColor: Colors.border,
    borderRadius: 1,
    overflow: 'hidden',
  },
  railFilled: {
    height: '100%',
    borderRadius: 1,
  },

  // ─── Improvement #3 — Status Rail ─────────────────────────────────────────
  rail: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  railStep: {
    alignItems: 'center',
    gap: 5,
    minWidth: 44,
    minHeight: 48,
    justifyContent: 'center',
  },
  railDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 2,
    marginBottom: 18, // align with dot centres
  },
  railLabel: {
    fontSize: 9,
    fontWeight: Typography.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  railHint: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
  },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm, flexWrap: 'wrap' },
  deliveryTypeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  deliveryTypeText: { fontSize: Typography.xs, fontWeight: Typography.semibold },
  deliveryChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, backgroundColor: Colors.borderLight },
  deliveryChipText: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textSecondary },
  destinationRow: { flexDirection: 'row', marginTop: Spacing.sm },
  destinationLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  destinationValue: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },

  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.md },

  pipeline: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginBottom: Spacing.md },
  pipelineStep: { flex: 1, alignItems: 'center' },
  pipelineDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  pipelineLine: { position: 'absolute', top: 6, left: '50%', right: '-50%', height: 2, backgroundColor: Colors.border, zIndex: 0 },
  pipelineLabel: { fontSize: 9, fontWeight: Typography.medium, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  changeStatusBtn: { paddingVertical: Spacing.sm, alignItems: 'center' },
  changeStatusText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.medium },

  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  paymentLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  paymentValue: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  paymentDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.sm },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.md },
  infoLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  infoValue: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textPrimary },

  measureRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  measureKey: { fontSize: Typography.sm, color: Colors.textSecondary, textTransform: 'capitalize' },
  measureValue: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },

  // Reminders
  reminderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.md },
  reminderRowPast: { opacity: 0.55 },
  reminderIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  reminderLabel: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textPrimary },
  reminderDate: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  reminderAutoTag: { backgroundColor: Colors.borderLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  reminderAutoText: { fontSize: 10, color: Colors.textTertiary, fontWeight: Typography.medium },
  addReminderBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  addReminderText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semibold },
  overdueToggleRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, marginTop: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  overdueToggleLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  overdueToggleSub: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },

  // WhatsApp rows
  waRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md + 2, gap: Spacing.md },
  waRowHighlight: { backgroundColor: Colors.readyLight },
  waRowDisabled: { opacity: 0.5 },
  // #E8FFF1/#25D366 → mint tint adapts per theme; icon itself stays WhatsApp brand green when highlighted
  waIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.readyLight, alignItems: 'center', justifyContent: 'center' },
  waLabel: { fontSize: Typography.base, color: Colors.textPrimary, fontWeight: Typography.medium },
  waSubLabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  waDivider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.base },

  growthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, backgroundColor: Colors.cuttingLight, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  growthText: { flex: 1, fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semibold, marginRight: Spacing.sm },
  growthBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md },
  growthBtnText: { color: Colors.white, fontSize: Typography.sm, fontWeight: Typography.bold },

  bottomBar: { flexDirection: 'row', paddingHorizontal: Spacing.base, paddingBottom: Platform.OS === 'ios' ? 24 : Spacing.base, paddingTop: Spacing.sm, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.borderLight, gap: Spacing.md },
  nextStepBtn: { flex: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingVertical: Spacing.md, borderRadius: Radius.lg, gap: Spacing.sm },
  nextStepText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.white },
  summaryBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border },
  summaryBtnText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.background, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.base, paddingBottom: 32 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.lg },

  previewSheet: { maxHeight: '85%' },
  previewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  previewTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary },
  previewRecipient: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  previewBubbleWrap: { maxHeight: 220, marginBottom: Spacing.lg },
  previewBubble: { backgroundColor: Colors.readyLight, borderRadius: Radius.lg, borderTopLeftRadius: 4, padding: Spacing.base },
  previewBubbleText: { fontSize: Typography.base, color: isDark ? '#6FE39B' : '#1a4a2e', lineHeight: 22 },
  sendWaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#25D366', borderRadius: Radius.lg, paddingVertical: Spacing.md + 2, gap: Spacing.sm, marginBottom: Spacing.md },
  sendWaBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.white },
  cancelPreviewBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  cancelPreviewText: { fontSize: Typography.base, color: Colors.textSecondary },

  // Add Reminder modal
  reminderSheet: { maxHeight: '90%' },
  modeTabRow: { flexDirection: 'row', backgroundColor: Colors.borderLight, borderRadius: Radius.md, padding: 3, marginBottom: Spacing.lg },
  modeTab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radius.sm },
  modeTabActive: { backgroundColor: Colors.surface, ...Shadow.sm },
  modeTabText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  modeTabTextActive: { color: Colors.textPrimary, fontWeight: Typography.bold },
  reminderSubTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  chipTextActive: { color: Colors.white, fontWeight: Typography.bold },
  reminderPreviewBox: { marginTop: Spacing.md, backgroundColor: Colors.primaryFaint, borderRadius: Radius.md, padding: Spacing.md },
  reminderPreviewText: { fontSize: Typography.sm, color: Colors.primary, lineHeight: 20 },
  reminderInput: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Platform.OS === 'ios' ? Spacing.md : Spacing.sm, fontSize: Typography.base, color: Colors.textPrimary, backgroundColor: Colors.surface },
  addReminderSaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.md + 2, gap: Spacing.sm, marginTop: Spacing.lg },
  addReminderSaveBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.white },

  statusOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.base, borderRadius: Radius.md, marginBottom: 4, gap: Spacing.md },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusOptionText: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary },

  // Studio
  studioCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.primaryFaint,
  },
  studioLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  studioEmoji: { fontSize: 28 },
  studioTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary },
  studioSubtitle: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },

  summarySheet: { maxHeight: '75%' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  summaryLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  summaryValue: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textPrimary, maxWidth: '60%', textAlign: 'right' },
});

export default JobDetailScreen;
