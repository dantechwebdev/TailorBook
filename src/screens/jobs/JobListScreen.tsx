import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useStore } from '../../context/store';
import { Colors, Typography, Spacing, Radius, Shadow, JOB_STATUS_CONFIG, JOB_STATUSES } from '../../constants/theme';
import { SearchIcon, PlusIcon, JobsIcon, ChevronRightIcon, MenuIcon } from '../../components/common/Icons';
import { Avatar, StatusBadge, Chip, EmptyState } from '../../components/common/UI';
import { formatDeliveryDate, getDeliveryUrgency } from '../../utils/helpers';
import { Job, JobStatus } from '../../types';
import * as db from '../../utils/database';

const JobListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { jobs } = useStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<JobStatus | 'All'>('All');
  const [searchResults, setSearchResults] = useState<Job[] | null>(null);

  const handleSearch = async (text: string) => {
    setSearch(text);
    if (text.trim().length === 0) {
      setSearchResults(null);
      return;
    }
    const results = await db.searchJobs(text.trim());
    setSearchResults(results);
  };

  const baseList = searchResults ?? jobs;
  const filteredJobs =
    filterStatus === 'All'
      ? baseList
      : baseList.filter((j) => j.status === filterStatus);

  // Sort: overdue first, then by delivery date
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const ua = getDeliveryUrgency(a.deliveryDate);
    const ub = getDeliveryUrgency(b.deliveryDate);
    const urgencyOrder = { overdue: 0, today: 1, soon: 2, normal: 3 };
    if (urgencyOrder[ua] !== urgencyOrder[ub]) return urgencyOrder[ua] - urgencyOrder[ub];
    return a.deliveryDate.localeCompare(b.deliveryDate);
  });

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
          onChangeText={handleSearch}
          placeholder="Search jobs..."
          placeholderTextColor={Colors.textTertiary}
          style={styles.searchInput}
          autoCapitalize="words"
        />
      </View>

      {/* ─── Status Filter ─── */}
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

      {/* ─── Job Count ─── */}
      <Text style={styles.resultCount}>
        {sortedJobs.length} {sortedJobs.length === 1 ? 'job' : 'jobs'}
      </Text>

      {/* ─── List ─── */}
      <FlatList
        data={sortedJobs}
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
    ...Shadow.sm,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    padding: 0,
  },
  filterScroll: { flexGrow: 0 },
  filterList: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  resultCount: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    fontWeight: Typography.medium,
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
    ...Shadow.sm,
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
});

export default JobListScreen;
