import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStore } from '../../context/store';
import { Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { BackIcon, EditIcon, PhoneIcon, BriefcasePlusIcon, TrashIcon, MeasurementsIcon, HomeIcon } from '../../components/common/Icons';
import { Avatar, StatusBadge, Card, Button, EmptyState } from '../../components/common/UI';
import { formatPhone, formatDeliveryDate } from '../../utils/helpers';
import { Job } from '../../types';
import { getJobStatusConfig } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import FloatingAssistant from '../../components/ai/FloatingAssistant';

const CustomerDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { customerId } = route.params;

  const { getCustomer, getJobsByCustomer, getMeasurementsByCustomer, deleteCustomer } = useStore();
  const { colors: Colors, shadow} = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
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
    scroll: {
      paddingHorizontal: Spacing.base,
    },
    profileCard: {
      marginBottom: Spacing.md,
    },
    profileTop: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    profileInfo: {
      flex: 1,
      gap: 4,
    },
    profileName: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      flexWrap: 'wrap',
      marginTop: 2,
    },
    phoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    phoneText: {
      fontSize: Typography.sm,
      color: Colors.primary,
      fontWeight: Typography.medium,
    },
    waBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: Colors.readyLight,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: Radius.full,
    },
    waBtnText: {
      fontSize: Typography.xs,
      color: '#25D366', // fixed WhatsApp brand green
      fontWeight: Typography.semibold,
    },
    notesText: {
      fontSize: Typography.xs,
      color: Colors.textTertiary,
      lineHeight: 18,
      marginTop: 2,
    },
    statsRow: {
      flexDirection: 'row',
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: Colors.borderLight,
    },
    statDivider: {
      width: 1,
      backgroundColor: Colors.borderLight,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    section: {
      marginBottom: Spacing.xl,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      fontSize: Typography.md,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
    },
    addMeasurementText: {
      fontSize: Typography.sm,
      color: Colors.primary,
      fontWeight: Typography.semibold,
    },
    measureRowHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    editMeasureBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: Colors.primaryFaint,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 5,
      borderRadius: Radius.full,
    },
    editMeasureBtnText: {
      fontSize: Typography.xs,
      color: Colors.primary,
      fontWeight: Typography.semibold,
    },
    jobList: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      overflow: 'hidden',
      ...shadow.sm,
    },
    jobRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
    },
    jobRowLeft: {
      flex: 1,
    },
    jobRowName: {
      fontSize: Typography.base,
      fontWeight: Typography.semibold,
      color: Colors.textPrimary,
    },
    jobRowDate: {
      fontSize: Typography.xs,
      color: Colors.textSecondary,
      marginTop: 2,
    },
  }), [Colors, shadow]);

  const customer = getCustomer(customerId);
  const jobs = useMemo(() => getJobsByCustomer(customerId), [customerId]);
  const measurements = useMemo(() => getMeasurementsByCustomer(customerId), [customerId]);

  if (!customer) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <BackIcon size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.textSecondary }}>Customer not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCall = () => {
    Linking.openURL(`tel:${customer.phone}`);
  };

  const handleWhatsApp = () => {
    const phone = customer.whatsappPhone || customer.phone;
    if (!phone) {
      Alert.alert('No phone number', 'This customer has no phone number saved.');
      return;
    }
    const clean = phone.replace(/[\s\-()]/g, '').replace(/^0/, '234').replace(/^\+/, '');
    Linking.openURL(`https://wa.me/${clean}`).catch(() => {
      Alert.alert('WhatsApp not available', 'Could not open WhatsApp.');
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Customer',
      `Remove ${customer.name} and all their jobs? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCustomer(customerId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const activeJobs = jobs.filter((j) => j.status !== 'Delivered');
  const completedJobs = jobs.filter((j) => j.status === 'Delivered');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <BackIcon size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Profile</Text>
        <View style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('HomeTab')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <HomeIcon size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('CustomerEdit', { customerId })}
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
        {/* ─── Profile Card ─── */}
        <Card style={styles.profileCard}>
          <View style={styles.profileTop}>
            <Avatar name={customer.name} size={68} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{customer.name}</Text>
              <View style={styles.contactRow}>
              <TouchableOpacity onPress={handleCall} style={styles.phoneRow}>
                <PhoneIcon size={14} color={Colors.primary} />
                <Text style={styles.phoneText}>{formatPhone(customer.phone)}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleWhatsApp} style={styles.waBtn}>
                <Ionicons name="logo-whatsapp" size={13} color="#25D366" />
                <Text style={styles.waBtnText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
              {customer.notes ? (
                <Text style={styles.notesText} numberOfLines={2}>{customer.notes}</Text>
              ) : null}
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatItem label="Total Jobs" value={String(jobs.length)} Colors={Colors} />
            <View style={styles.statDivider} />
            <StatItem label="Active" value={String(activeJobs.length)} color={Colors.primary} Colors={Colors} />
            <View style={styles.statDivider} />
            <StatItem label="Delivered" value={String(completedJobs.length)} color={Colors.ready} Colors={Colors} />
          </View>
        </Card>

        {/* ─── Quick Actions ─── */}
        <View style={styles.actionsRow}>
          <Button
            label="New Job"
            onPress={() => navigation.navigate('JobsStack', {
              screen: 'NewOrderFlow',
              params: { customerId },
            })}
            variant="primary"
            icon={<BriefcasePlusIcon size={16} color={Colors.white} />}
            style={{ flex: 1 }}
          />
          <Button
            label="Measurements"
            onPress={() =>
              navigation.navigate('MeasurementForm', { customerId, jobId: undefined })
            }
            variant="secondary"
            icon={<MeasurementsIcon size={16} color={Colors.primary} />}
            style={{ flex: 1 }}
          />
        </View>

        {/* ─── Active Jobs ─── */}
        {activeJobs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Jobs</Text>
            <View style={styles.jobList}>
              {activeJobs.map((job, idx) => (
                <JobRow
                  key={job.id}
                  job={job}
                  last={idx === activeJobs.length - 1}
                  onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
                  styles={styles}
                  Colors={Colors}
                />
              ))}
            </View>
          </View>
        )}

        {/* ─── Measurements ─── */}
        {measurements.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Saved Measurements</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('MeasurementForm', { customerId, jobId: undefined })}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.addMeasurementText}>+ Add New</Text>
              </TouchableOpacity>
            </View>
            {measurements.map((m) => (
              <TouchableOpacity
                key={m.id}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('MeasurementForm', {
                  customerId,
                  jobId: undefined,
                  existingMeasurementId: m.id,
                })}
              >
                <Card style={{ marginBottom: Spacing.sm }}>
                  <View style={styles.measureRowHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: Typography.semibold, color: Colors.textPrimary }}>
                        {m.label || m.template}
                      </Text>
                      <Text style={{ fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 }}>
                        {Object.keys(m.data).length} fields · {new Date(m.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={styles.editMeasureBtn}>
                      <EditIcon size={14} color={Colors.primary} />
                      <Text style={styles.editMeasureBtnText}>Edit</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ─── Delivered Jobs ─── */}
        {completedJobs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivered</Text>
            <View style={styles.jobList}>
              {completedJobs.map((job, idx) => (
                <JobRow
                  key={job.id}
                  job={job}
                  last={idx === completedJobs.length - 1}
                  onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
                  styles={styles}
                  Colors={Colors}
                />
              ))}
            </View>
          </View>
        )}

        {jobs.length === 0 && (
          <EmptyState
            icon={<BriefcasePlusIcon size={32} color={Colors.primary} />}
            title="No jobs yet"
            subtitle="Create a job for this customer"
            action={{
              label: 'Create Job',
              onPress: () => navigation.navigate('JobsStack', {
                screen: 'NewOrderFlow',
                params: { customerId },
              }),
            }}
          />
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      {/* ─── Floating AI Assistant ─── */}
      <FloatingAssistant
        screen="CustomerDetail"
        context={{
          screen: 'CustomerDetail',
          data: {
            name: customer.name,
            totalJobs: jobs.length,
            activeJobs: jobs.filter((j) => j.status !== 'Delivered').length,
            outstandingBalance: jobs.reduce((sum, j) => sum + (j.balance || 0), 0),
            lastOrderDate: jobs[0]?.createdAt ?? null,
            topOutfitType: null,
          },
        }}
      />

    </SafeAreaView>
  );
};

const StatItem: React.FC<{ label: string; value: string; color?: string; Colors: any }> = ({
  label,
  value,
  color,
  Colors,
}) => (
  <View style={{ alignItems: 'center', flex: 1 }}>
    <Text style={{ fontSize: Typography.xl, fontWeight: Typography.bold, color: color ?? Colors.textPrimary }}>{value}</Text>
    <Text style={{ fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 }}>{label}</Text>
  </View>
);

const JobRow: React.FC<{ job: Job; last: boolean; onPress: () => void; styles: any; Colors: any }> = ({
  job,
  last,
  onPress,
  styles,
  Colors,
}) => {
  // Derived from the live palette passed down as a prop — never stale.
  const config = getJobStatusConfig(Colors)[job.status];
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.jobRow,
        !last && { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
      ]}
    >
      <View style={styles.jobRowLeft}>
        <Text style={styles.jobRowName}>{job.outfitType}</Text>
        <Text style={styles.jobRowDate}>Due: {formatDeliveryDate(job.deliveryDate)}</Text>
      </View>
      <StatusBadge status={job.status} size="sm" />
    </TouchableOpacity>
  );
};

export default CustomerDetailScreen;
