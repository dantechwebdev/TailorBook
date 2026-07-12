import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { CheckIcon, SubscriptionIcon, MenuIcon } from '../../components/common/Icons';
import { Button } from '../../components/common/UI';
import { useTheme } from '../../context/ThemeContext';

const FREE_FEATURES = [
  'Up to 50 customers',
  'Unlimited jobs',
  'Local notifications',
  'Measurement templates',
  'Sample photo storage',
  'Offline mode',
];

const PRO_FEATURES = [
  'Unlimited customers',
  'Cloud backup & sync',
  'WhatsApp reminders to customers',
  'PDF invoice generation',
  'Multi-device access',
  'Priority support',
  'Revenue reports',
  'Customer birthday tracking',
];

const SubscriptionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors: Colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
    },
    headerTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
    scroll: { paddingHorizontal: Spacing.base },
    currentPlanBadge: {
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    currentPlanLabel: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      color: Colors.textTertiary,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    currentPlanName: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
    },
    proCard: {
      backgroundColor: Colors.primary,
      borderRadius: Radius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
      ...Shadow.lg,
    },
    proCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    proIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    proTitle: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: Colors.white,
    },
    proSubtitle: {
      fontSize: Typography.sm,
      color: 'rgba(255,255,255,0.7)',
      marginTop: 2,
    },
    proPriceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
      marginBottom: 4,
    },
    proPrice: {
      fontSize: 36,
      fontWeight: Typography.extrabold,
      color: Colors.white,
    },
    proPricePer: {
      fontSize: Typography.base,
      color: 'rgba(255,255,255,0.7)',
    },
    proAnnual: {
      fontSize: Typography.xs,
      color: 'rgba(255,255,255,0.6)',
      marginBottom: Spacing.lg,
    },
    upgradeBtn: {
      backgroundColor: Colors.white,
      borderRadius: Radius.lg,
      paddingVertical: 14,
      alignItems: 'center',
    },
    upgradeBtnText: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: Colors.primary,
    },
    section: { marginBottom: Spacing.xl },
    sectionLabel: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      color: Colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: Spacing.md,
    },
    planCard: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.base,
      marginBottom: Spacing.md,
      ...Shadow.sm,
    },
    proCardHighlight: {
      borderWidth: 2,
      borderColor: Colors.primary + '40',
      backgroundColor: Colors.primaryFaint,
    },
    planCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    planCardTitle: {
      fontSize: Typography.md,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
    },
    freeBadge: {
      backgroundColor: Colors.borderLight,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: Radius.full,
    },
    freeBadgeText: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      color: Colors.textSecondary,
      letterSpacing: 1,
    },
    proBadge: {
      backgroundColor: Colors.primaryFaint,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: Colors.primary + '40',
    },
    proBadgeText: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      color: Colors.primary,
      letterSpacing: 0.5,
    },
    planEverythingNote: {
      fontSize: Typography.xs,
      color: Colors.textTertiary,
      fontStyle: 'italic',
      marginBottom: Spacing.sm,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: 5,
    },
    featureText: {
      fontSize: Typography.sm,
      color: Colors.textSecondary,
      flex: 1,
    },
    reassuranceRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.lg,
      flexWrap: 'wrap',
      marginBottom: Spacing.xl,
    },
    reassuranceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    reassuranceText: {
      fontSize: Typography.xs,
      color: Colors.textSecondary,
      fontWeight: Typography.medium,
    },
  }), [Colors]);

  const handleUpgrade = () => {
    Alert.alert(
      'Coming Soon',
      'TailorBook Pro is launching soon! We\'ll notify you when it\'s available.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MenuIcon size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Current Plan Badge */}
        <View style={styles.currentPlanBadge}>
          <Text style={styles.currentPlanLabel}>CURRENT PLAN</Text>
          <Text style={styles.currentPlanName}>Basic (Free)</Text>
        </View>

        {/* Pro Hero Card */}
        <View style={styles.proCard}>
          <View style={styles.proCardTop}>
            <View style={styles.proIconWrap}>
              <SubscriptionIcon size={28} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.proTitle}>TailorBook Pro</Text>
              <Text style={styles.proSubtitle}>Built for serious tailors</Text>
            </View>
          </View>

          <View style={styles.proPriceRow}>
            <Text style={styles.proPrice}>₦2,500</Text>
            <Text style={styles.proPricePer}>/month</Text>
          </View>
          <Text style={styles.proAnnual}>or ₦24,000/year (save 20%)</Text>

          <TouchableOpacity onPress={handleUpgrade} style={styles.upgradeBtn} activeOpacity={0.85}>
            <Text style={styles.upgradeBtnText}>Upgrade to Pro →</Text>
          </TouchableOpacity>
        </View>

        {/* Feature Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>What's included</Text>

          {/* Free */}
          <View style={styles.planCard}>
            <View style={styles.planCardHeader}>
              <Text style={styles.planCardTitle}>Basic (Free)</Text>
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>FREE</Text>
              </View>
            </View>
            {FREE_FEATURES.map((f) => (
              <View key={f} style={styles.featureRow}>
                <CheckIcon size={14} color={Colors.ready} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          {/* Pro */}
          <View style={[styles.planCard, styles.proCardHighlight]}>
            <View style={styles.planCardHeader}>
              <Text style={[styles.planCardTitle, { color: Colors.primary }]}>Pro Plan</Text>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>⭐ PRO</Text>
              </View>
            </View>
            <Text style={styles.planEverythingNote}>Everything in Basic, plus:</Text>
            {PRO_FEATURES.map((f) => (
              <View key={f} style={styles.featureRow}>
                <CheckIcon size={14} color={Colors.primary} />
                <Text style={[styles.featureText, { color: Colors.textPrimary, fontWeight: Typography.medium }]}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Reassurance */}
        <View style={styles.reassuranceRow}>
          {['Cancel anytime', 'Offline always works', 'Data stays yours'].map((t) => (
            <View key={t} style={styles.reassuranceItem}>
              <CheckIcon size={14} color={Colors.ready} />
              <Text style={styles.reassuranceText}>{t}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default SubscriptionScreen;
