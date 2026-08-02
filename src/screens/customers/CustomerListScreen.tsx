import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useStore } from '../../context/store';
import { Typography, Spacing, Radius, Shadow, getJobStatusConfig } from '../../constants/theme';
import { SearchIcon, PlusIcon, CustomersIcon, ChevronRightIcon, MenuIcon } from '../../components/common/Icons';
import { Avatar, EmptyState } from '../../components/common/UI';
import { formatPhone, formatNaira } from '../../utils/helpers';
import { Customer, Job } from '../../types';
import * as db from '../../utils/database';
import { useTheme } from '../../context/ThemeContext';

const CustomerListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { customers, refreshCustomers, getJobsByCustomer } = useStore();
  const { colors: C, shadow} = useTheme();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [searchResults, setSearchResults] = useState<Customer[] | null>(null);
  const styles = useMemo(() => makeStyles(C, shadow), [C, shadow]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCustomers();
    setRefreshing(false);
  }, [refreshCustomers]);

  const handleSearch = async (text: string) => {
    setSearch(text);
    if (!text.trim()) { setSearchResults(null); return; }
    setSearchResults(await db.searchCustomers(text.trim()));
  };

  const displayList = searchResults ?? customers;

  const renderItem = useCallback(({ item }: { item: Customer }) => {
    const jobs = getJobsByCustomer(item.id);
    const activeJobs = jobs.filter((j: Job) => j.status !== 'Delivered');
    const mostUrgent = activeJobs[0];
    const totalBalance = activeJobs.reduce((s: number, j: Job) => s + (j.balance || 0), 0);
    // Recomputed from the live palette on every theme change (C is a hook dep below)
    const statusConfig = getJobStatusConfig(C);

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })}
        activeOpacity={0.8}
        style={styles.card}
      >
        <Avatar name={item.name} size={46} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.phone}>{formatPhone(item.phone)}</Text>
          {/* Improvement #4 — most urgent active job shown inline */}
          {mostUrgent ? (
            <View style={styles.jobPreview}>
              <View style={[styles.jobDot, { backgroundColor: statusConfig[mostUrgent.status]?.color ?? C.primary }]} />
              <Text style={styles.jobPreviewText} numberOfLines={1}>
                {mostUrgent.outfitType} · {mostUrgent.status}
              </Text>
            </View>
          ) : jobs.length > 0 ? (
            <Text style={styles.allDoneText}>All jobs delivered ✓</Text>
          ) : null}
        </View>
        <View style={styles.right}>
          {jobs.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{jobs.length} job{jobs.length !== 1 ? 's' : ''}</Text>
            </View>
          )}
          {totalBalance > 0 && (
            <Text style={styles.balance}>{formatNaira(totalBalance)}</Text>
          )}
          <ChevronRightIcon size={16} color={C.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  }, [getJobsByCustomer, navigation, styles, C]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MenuIcon size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customers</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CustomerCreate')} style={styles.addBtn}>
          <PlusIcon size={18} color={C.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <SearchIcon size={18} color={C.textTertiary} />
        <TextInput
          value={search} onChangeText={handleSearch}
          placeholder="Search by name or phone..." placeholderTextColor={C.textTertiary}
          style={styles.searchInput} autoCapitalize="words"
        />
      </View>

      <FlatList
        data={displayList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12} maxToRenderPerBatch={8} windowSize={5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          <EmptyState
            icon={<CustomersIcon size={36} color={C.primary} />}
            title={search ? 'No customers found' : 'Your customer book is empty'}
            subtitle={
              search
                ? `No match for "${search}". Try a phone number instead.`
                : 'Every job starts with a customer. Tap + to register your first one.'
            }
            action={!search ? { label: 'Register First Customer', onPress: () => navigation.navigate('CustomerCreate') } : undefined}
          />
        }
      />
    </SafeAreaView>
  );
};

function makeStyles(C: any, shadow: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
    headerTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: C.textPrimary },
    addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', ...shadow.sm },
    searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: Radius.lg, marginHorizontal: Spacing.base, marginBottom: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: 12, gap: Spacing.sm, ...shadow.sm },
    searchInput: { flex: 1, fontSize: Typography.base, color: C.textPrimary, padding: 0 },
    list: { paddingHorizontal: Spacing.base, paddingBottom: 120, flexGrow: 1 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.md, ...shadow.sm },
    info: { flex: 1, gap: 2 },
    name: { fontSize: Typography.base, fontWeight: Typography.semibold, color: C.textPrimary },
    phone: { fontSize: Typography.sm, color: C.textSecondary },
    jobPreview: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
    jobDot: { width: 6, height: 6, borderRadius: 3 },
    jobPreviewText: { fontSize: Typography.xs, color: C.textSecondary, fontWeight: Typography.medium, flex: 1 },
    allDoneText: { fontSize: Typography.xs, color: C.ready, fontWeight: Typography.medium, marginTop: 3 },
    right: { alignItems: 'flex-end', gap: 4 },
    countBadge: { backgroundColor: C.primaryFaint, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
    countText: { fontSize: Typography.xs, color: C.primary, fontWeight: Typography.semibold },
    balance: { fontSize: Typography.xs, color: C.overdue, fontWeight: Typography.semibold },
  });
}

export default CustomerListScreen;
