import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useStore } from '../../context/store';
import { Typography, Spacing, Radius, Shadow, JOB_STATUSES } from '../../constants/theme';
import { SearchIcon, PlusIcon, JobsIcon, ChevronRightIcon, MenuIcon, CheckIcon } from '../../components/common/Icons';
import { Avatar, StatusBadge, Chip, EmptyState } from '../../components/common/UI';
import { formatDeliveryDate, getDeliveryUrgency } from '../../utils/helpers';
import { Job, JobStatus } from '../../types';
import { useTheme } from '../../context/ThemeContext';

type SortKey = 'urgency' | 'date_asc' | 'date_desc' | 'name_asc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'urgency',   label: 'Urgency (overdue first)' },
  { key: 'date_asc',  label: 'Delivery date ↑ (earliest)' },
  { key: 'date_desc', label: 'Delivery date ↓ (latest)' },
  { key: 'name_asc',  label: 'Customer name A–Z' },
];

const URGENCY_ORDER = { overdue: 0, today: 1, soon: 2, normal: 3 } as const;

function sortJobs(jobs: Job[], key: SortKey): Job[] {
  const list = [...jobs];
  switch (key) {
    case 'urgency':
      return list.sort((a, b) => {
        const ua = URGENCY_ORDER[getDeliveryUrgency(a.deliveryDate)];
        const ub = URGENCY_ORDER[getDeliveryUrgency(b.deliveryDate)];
        if (ua !== ub) return ua - ub;
        return a.deliveryDate.localeCompare(b.deliveryDate);
      });
    case 'date_asc':
      return list.sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate));
    case 'date_desc':
      return list.sort((a, b) => b.deliveryDate.localeCompare(a.deliveryDate));
    case 'name_asc':
      return list.sort((a, b) => a.customerName.localeCompare(b.customerName));
  }
}

const JobListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { jobs } = useStore();
  const { colors: Colors, shadow} = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
    },
    headerTitle: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
    },
    addBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow.sm,
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      marginHorizontal: Spacing.base,
      marginBottom: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      gap: Spacing.sm,
      ...shadow.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: Typography.base,
      color: Colors.textPrimary,
      padding: 0,
    },
    filtersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    filterScroll: { flexGrow: 0, flex: 1 },
    filterList: {
      paddingHorizontal: Spacing.base,
      gap: Spacing.sm,
    },
    sortBtn: {
      marginRight: Spacing.base,
      marginLeft: Spacing.sm,
      width: 34,
      height: 34,
      borderRadius: Radius.lg,
      backgroundColor: Colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
      ...shadow.sm,
    },
    sortBtnText: {
      fontSize: 16,
      color: Colors.textSecondary,
      fontWeight: Typography.bold,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.base,
      marginBottom: Spacing.sm,
    },
    resultCount: {
      fontSize: Typography.xs,
      color: Colors.textTertiary,
      fontWeight: Typography.medium,
    },
    sortLabel: {
      fontSize: Typography.xs,
      color: Colors.primary,
      fontWeight: Typography.medium,
      maxWidth: 180,
    },
    list: {
      paddingHorizontal: Spacing.base,
      paddingBottom: Spacing.xxxl,
      flexGrow: 1,
    },
    jobCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      gap: Spacing.md,
      ...shadow.sm,
    },
    jobInfo: { flex: 1, gap: 3 },
    jobName: {
      fontSize: Typography.base,
      fontWeight: Typography.semibold,
      color: Colors.textPrimary,
    },
    jobDate: {
      fontSize: Typography.xs,
      color: Colors.textSecondary,
      fontWeight: Typography.medium,
    },
    overdueTag: {
      fontSize: Typography.xs,
      color: Colors.overdue,
      fontWeight: Typography.semibold,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
    },
    modalCard: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.xl,
      padding: Spacing.lg,
      width: '100%',
      ...shadow.md,
    },
    modalTitle: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
      marginBottom: Spacing.md,
    },
    modalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      borderRadius: Radius.lg,
      marginBottom: Spacing.sm,
    },
    modalOptionSelected: {
      backgroundColor: Colors.primaryFaint,
    },
    modalOptionText: {
      fontSize: Typography.sm,
      color: Colors.textSecondary,
      fontWeight: Typography.medium,
    },
    modalOptionTextSelected: {
      color: Colors.primary,
      fontWeight: Typography.semibold,
    },
  }), [Colors, shadow]);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<JobStatus | 'All'>('All');
  const [sortKey, setSortKey] = useState<SortKey>('urgency');
  const [showSortModal, setShowSortModal] = useState(false);

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = jobs.filter((j) => {
      const matchesSearch =
        !q ||
        j.customerName.toLowerCase().includes(q) ||
        j.outfitType.toLowerCase().includes(q) ||
        (j.fabric || '').toLowerCase().includes(q) ||
        (j.style || '').toLowerCase().includes(q) ||
        (j.notes || '').toLowerCase().includes(q) ||
        j.status.toLowerCase().includes(q);

      const matchesStatus = filterStatus === 'All' || j.status === filterStatus;

      return matchesSearch && matchesStatus;
    });

    return sortJobs(list, sortKey);
  }, [jobs, search, filterStatus, sortKey]);

  const currentSortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? '';

  const renderItem = ({ item }: { item: Job }) => {
    const urgency = getDeliveryUrgency(item.deliveryDate);
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
        activeOpacity={0.8}
        style={styles.jobCard}
      >
        <Avatar name={item.customerName} size={42} />
        <View style={styles.jobInfo}>
          <Text style={styles.jobName}>
            {item.customerName}'s {item.outfitType}
          </Text>
          <Text
            style={[
              styles.jobDate,
              urgency === 'overdue' && { color: Colors.overdue },
              urgency === 'today' && { color: Colors.overdue },
              urgency === 'soon' && { color: Colors.dueSoon },
            ]}
          >
            Due: {formatDeliveryDate(item.deliveryDate)}
          </Text>
          {urgency === 'overdue' && (
            <Text style={styles.overdueTag}>⚠ Overdue</Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <StatusBadge status={item.status} size="sm" />
          <ChevronRightIcon size={14} color={Colors.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MenuIcon size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Jobs</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('NewOrderFlow', {})}
          style={styles.addBtn}
        >
          <PlusIcon size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* ─── Search ─── */}
      <View style={styles.searchWrap}>
        <SearchIcon size={18} color={Colors.textTertiary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, garment, fabric..."
          placeholderTextColor={Colors.textTertiary}
          style={styles.searchInput}
          autoCapitalize="words"
          clearButtonMode="while-editing"
        />
      </View>

      {/* ─── Filters Row ─── */}
      <View style={styles.filtersRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['All', ...JOB_STATUSES] as (JobStatus | 'All')[]}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <Chip
              label={item}
              selected={filterStatus === item}
              onPress={() => setFilterStatus(item)}
            />
          )}
          style={styles.filterScroll}
        />

        {/* Sort Button */}
        <TouchableOpacity
          onPress={() => setShowSortModal(true)}
          style={styles.sortBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.sortBtnText}>⇅</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Result Summary ─── */}
      <View style={styles.summaryRow}>
        <Text style={styles.resultCount}>
          {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'}
        </Text>
        <TouchableOpacity onPress={() => setShowSortModal(true)} activeOpacity={0.7}>
          <Text style={styles.sortLabel} numberOfLines={1}>
            {currentSortLabel}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── List ─── */}
      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          <EmptyState
            icon={<JobsIcon size={32} color={Colors.primary} />}
            title={search || filterStatus !== 'All' ? 'No jobs found' : 'No jobs yet'}
            subtitle={
              search
                ? 'Try a different search term'
                : filterStatus !== 'All'
                ? `No ${filterStatus} jobs`
                : 'Create your first job to get started'
            }
            action={
              !search && filterStatus === 'All'
                ? {
                    label: 'Start New Order',
                    onPress: () => navigation.navigate('NewOrderFlow', {}),
                  }
                : undefined
            }
          />
        }
      />

      {/* ─── Sort Modal ─── */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSortModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Sort jobs by</Text>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.modalOption, sortKey === opt.key && styles.modalOptionSelected]}
                onPress={() => {
                  setSortKey(opt.key);
                  setShowSortModal(false);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    sortKey === opt.key && styles.modalOptionTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
                {sortKey === opt.key && (
                  <CheckIcon size={16} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default JobListScreen;
