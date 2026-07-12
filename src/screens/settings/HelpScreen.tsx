import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { ChevronRightIcon, HelpIcon, MenuIcon } from '../../components/common/Icons';
import { Card, Divider } from '../../components/common/UI';
import { useTheme } from '../../context/ThemeContext';

const FAQ_ITEMS = [
  {
    q: 'How do I add a new customer?',
    a: 'Tap "Register New Customer" on the home screen or the + button on the Customers screen. Fill in the name and phone number — that\'s all you need to start.',
  },
  {
    q: 'How do I track job progress?',
    a: 'Open a job and tap "Mark as [Next Status]" to advance it through the pipeline: Pending → Cutting → Sewing → Finishing → Ready → Delivered.',
  },
  {
    q: 'Will I get reminders about delivery dates?',
    a: 'Yes! TailorBook sends local notifications 7 days, 3 days, 1 day before, and on the delivery date itself — all at 8:00 AM.',
  },
  {
    q: 'Can I reuse a customer\'s measurements?',
    a: 'Yes. When creating a job, scroll to the Measurements section and tap "Use existing measurements" to copy a saved set with one tap.',
  },
  {
    q: 'Does the app work without internet?',
    a: 'Completely. TailorBook is 100% offline — all data is stored on your device. No internet, no problem.',
  },
  {
    q: 'How do I add a fabric sample photo?',
    a: 'When creating or editing a job, scroll to "Sample Reference" and tap "Take Photo" or "From Gallery" to attach a reference image.',
  },
  {
    q: 'Can multiple tailors use one account?',
    a: 'The current version is single-user. Multi-user support is coming in a future update with TailorBook Pro.',
  },
];

const HelpScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors: Colors } = useTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
    heroSection: {
      alignItems: 'center',
      paddingVertical: Spacing.xl,
      marginBottom: Spacing.lg,
    },
    heroIcon: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: Colors.primaryFaint,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.md,
    },
    heroTitle: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
      marginBottom: Spacing.sm,
    },
    heroSubtitle: {
      fontSize: Typography.sm,
      color: Colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    section: { marginBottom: Spacing.xl },
    sectionLabel: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      color: Colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: Spacing.sm,
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: Spacing.base,
      gap: Spacing.md,
    },
    contactIcon: { fontSize: 20 },
    contactLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
    contactValue: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.primary, marginTop: 1 },
    faqList: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      overflow: 'hidden',
      ...Shadow.sm,
    },
    faqItem: { paddingHorizontal: Spacing.base },
    faqQuestion: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
    },
    faqQuestionText: {
      flex: 1,
      fontSize: Typography.base,
      fontWeight: Typography.semibold,
      color: Colors.textPrimary,
      paddingRight: Spacing.md,
    },
    faqChevron: {
      fontSize: 20,
      color: Colors.textTertiary,
      fontWeight: Typography.bold,
    },
    faqAnswer: {
      fontSize: Typography.sm,
      color: Colors.textSecondary,
      lineHeight: 22,
      paddingBottom: Spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: Spacing.base,
    },
    infoLabel: { fontSize: Typography.base, color: Colors.textSecondary },
    infoValue: { fontSize: Typography.base, fontWeight: Typography.medium, color: Colors.textPrimary },
    tagline: {
      textAlign: 'center',
      fontSize: Typography.sm,
      color: Colors.textTertiary,
      marginBottom: Spacing.md,
    },
  }), [Colors]);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <HelpIcon size={32} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSubtitle}>
            Find answers to common questions below, or reach out directly.
          </Text>
        </View>

        {/* Quick Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Contact Us</Text>
          <Card padding={0}>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:support@tailorbook.app')} style={styles.contactRow} activeOpacity={0.7}>
              <Text style={styles.contactIcon}>📧</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactLabel}>Email Support</Text>
                <Text style={styles.contactValue}>support@tailorbook.app</Text>
              </View>
              <ChevronRightIcon size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity onPress={() => Linking.openURL('https://twitter.com/tailorbookapp')} style={styles.contactRow} activeOpacity={0.7}>
              <Text style={styles.contactIcon}>🐦</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactLabel}>Twitter / X</Text>
                <Text style={styles.contactValue}>@TailorBookApp</Text>
              </View>
              <ChevronRightIcon size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity onPress={() => Linking.openURL('https://wa.me/2348001245671')} style={styles.contactRow} activeOpacity={0.7}>
              <Text style={styles.contactIcon}>💬</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactLabel}>WhatsApp</Text>
                <Text style={styles.contactValue}>+234 800 TAILOR</Text>
              </View>
              <ChevronRightIcon size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Frequently Asked Questions</Text>
          <View style={styles.faqList}>
            {FAQ_ITEMS.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.faqItem,
                  idx < FAQ_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
                ]}
              >
                <TouchableOpacity
                  onPress={() => toggle(idx)}
                  activeOpacity={0.8}
                  style={styles.faqQuestion}
                >
                  <Text style={styles.faqQuestionText}>{item.q}</Text>
                  <Text
                    style={[
                      styles.faqChevron,
                      openIndex === idx && { transform: [{ rotate: '90deg' }] },
                    ]}
                  >
                    ›
                  </Text>
                </TouchableOpacity>
                {openIndex === idx && (
                  <Text style={styles.faqAnswer}>{item.a}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>App Info</Text>
          <Card padding={0}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            <Divider />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Build</Text>
              <Text style={styles.infoValue}>MVP Release</Text>
            </View>
            <Divider />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Storage</Text>
              <Text style={styles.infoValue}>Local Device</Text>
            </View>
            <Divider />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Notifications</Text>
              <Text style={styles.infoValue}>Local Only</Text>
            </View>
          </Card>
        </View>

        <Text style={styles.tagline}>Made with ❤️ for African tailors</Text>
        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HelpScreen;
