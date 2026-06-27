import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../context/store';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { SearchIcon, PlusIcon, CustomersIcon, ChevronRightIcon, PhoneIcon } from '../../components/common/Icons';
import { Avatar, EmptyState } from '../../components/common/UI';
import { formatPhone } from '../../utils/helpers';
import { Customer } from '../../types';
import * as db from '../../utils/database';

const CustomerListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { customers, refreshCustomers, getJobsByCustomer } = useStore();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [searchResults, setSearchResults] = useState<Customer[] | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCustomers();
    setRefreshing(false);
  }, []);

  const handleSearch = async (text: string) => {
    setSearch(text);
    if (text.trim().length === 0) {
      setSearchResults(null);
      return;
    }
    const results = await db.searchCustomers(text.trim());
    setSearchResults(results);
  };

  const displayList = searchResults ?? customers;

  const renderItem = ({ item }: { item: Customer }) => {
    const jobCount = getJobsByCustomer(item.id).length;
    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('CustomerDetail', { customerId: item.id })
        }
        activeOpacity={0.8}
        style={styles.customerItem}
      >
        <Avatar name={item.name} size={46} />
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          <Text style={styles.customerPhone}>{formatPhone(item.phone)}</Text>
          {item.notes ? (
            <Text style={styles.customerNote} numberOfLines={1}>
              {item.notes}
            </Text>
          ) : null}
        </View>
        <View style={styles.customerRight}>
          {jobCount > 0 && (
            <View style={styles.jobCountBadge}>
              <Text style={styles.jobCountText}>{jobCount} job{jobCount !== 1 ? 's' : ''}</Text>
            </View>
          )}
          <ChevronRightIcon size={16} color={Colors.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customers</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('CustomerCreate')}
          style={styles.addBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <PlusIcon size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* ─── Search Bar ─── */}
      <View style={styles.searchWrap}>
        <SearchIcon size={18} color={Colors.textTertiary} />
        <TextInput
          value={search}
          onChangeText={handleSearch}
          placeholder="Search customers..."
          placeholderTextColor={Colors.textTertiary}
          style={styles.searchInput}
          autoCapitalize="words"
        />
      </View>

      {/* ─── List ─── */}
      <FlatList
        data={displayList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            icon={<CustomersIcon size={32} color={Colors.primary} />}
            title={search ? 'No customers found' : 'No customers yet'}
            subtitle={
              search
                ? 'Try a different name or phone number'
                : 'Add your first customer to get started'
            }
            action={
              !search
                ? {
                    label: 'Register Customer',
                    onPress: () => navigation.navigate('CustomerCreate'),
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
  list: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxxl,
    flexGrow: 1,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  customerInfo: {
    flex: 1,
    gap: 2,
  },
  customerName: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  customerPhone: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  customerNote: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  customerRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  jobCountBadge: {
    backgroundColor: Colors.primaryFaint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  jobCountText: {
    fontSize: Typography.xs,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  separator: {
    height: Spacing.sm,
  },
});

export default CustomerListScreen;
