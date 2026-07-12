import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Typography, Spacing, Radius, Shadow, ColorPalette } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { MenuIcon, SparkleIcon, ImageIcon, ScissorsIcon, ReportsIcon } from '../../components/common/Icons';
import { Card } from '../../components/common/UI';

interface PreviewFeature {
  key: string;
  icon: (color: string) => React.ReactNode;
  title: string;
  description: string;
}

const PREVIEW_FEATURES: PreviewFeature[] = [
  {
    key: 'design',
    icon: (color) => <ImageIcon size={22} color={color} />,
    title: 'AI Design Concepts',
    description: 'Generate outfit design ideas from a photo, sketch, or fabric.',
  },
  {
    key: 'fit',
    icon: (color) => <ScissorsIcon size={22} color={color} />,
    title: 'Smart Fit Assist',
    description: 'Catch measurement inconsistencies before you cut fabric.',
  },
  {
    key: 'insights',
    icon: (color) => <ReportsIcon size={22} color={color} />,
    title: 'Business Insights',
    description: 'Ask questions about your orders, revenue, and busiest seasons.',
  },
];

const TailorStudioScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MenuIcon size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TailorStudio</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <SparkleIcon size={30} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Your AI workspace is coming soon</Text>
          <Text style={styles.heroSubtitle}>
            TailorStudio will bring AI-assisted design, fit guidance, and business insights
            directly into TailorBook. We are building it now.
          </Text>
          <View style={styles.comingSoonPill}>
            <Text style={styles.comingSoonPillText}>In development</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>What is coming</Text>
        {PREVIEW_FEATURES.map((feature) => (
          <Card key={feature.key} style={styles.featureCard}>
            <View style={styles.featureIconWrap}>{feature.icon(colors.primary)}</View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          </Card>
        ))}

        <Text style={styles.footnote}>
          Want early access when TailorStudio launches? Keep an eye on your notifications —
          we will let you know the moment it is ready.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
    },
    headerTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: colors.textPrimary },
    content: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
    hero: {
      alignItems: 'center',
      backgroundColor: colors.primaryFaint,
      borderRadius: Radius.xl,
      paddingVertical: Spacing.xxl,
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing.xl,
    },
    heroIconWrap: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: colors.surface,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: Spacing.lg,
      ...Shadow.sm,
    },
    heroTitle: {
      fontSize: Typography.xl, fontWeight: Typography.bold,
      color: colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm,
    },
    heroSubtitle: {
      fontSize: Typography.base, color: colors.textSecondary,
      textAlign: 'center', lineHeight: 21, marginBottom: Spacing.lg,
    },
    comingSoonPill: {
      backgroundColor: colors.surface,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
      borderRadius: Radius.full, ...Shadow.sm,
    },
    comingSoonPillText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: colors.primary },
    sectionLabel: {
      fontSize: Typography.sm, fontWeight: Typography.semibold,
      color: colors.textSecondary, textTransform: 'uppercase',
      letterSpacing: 0.5, marginBottom: Spacing.md,
    },
    featureCard: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md },
    featureIconWrap: {
      width: 44, height: 44, borderRadius: Radius.md,
      backgroundColor: colors.primaryFaint,
      alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
    },
    featureText: { flex: 1 },
    featureTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: colors.textPrimary, marginBottom: 2 },
    featureDescription: { fontSize: Typography.sm, color: colors.textSecondary, lineHeight: 19 },
    footnote: {
      fontSize: Typography.xs, color: colors.textTertiary,
      textAlign: 'center', marginTop: Spacing.lg,
      paddingHorizontal: Spacing.lg, lineHeight: 17,
    },
  });

export default TailorStudioScreen;
