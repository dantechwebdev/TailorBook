/**
 * TailorStudioScreen
 *
 * TailorBook's dedicated AI design workspace — deliberately separate from
 * the FloatingAssistant. The Assistant is for productivity (estimates,
 * documents, reminders); Studio is for creativity: generating, iterating,
 * and versioning garment design concepts.
 *
 * Reached two ways:
 *   1. From JobDetailScreen's "Studio" button — arrives with jobId/customerId
 *      route params, so every concept generated here is automatically scoped
 *      to that job and can be saved into its gallery with one tap.
 *   2. From the drawer, with no job context — a free-standing workspace for
 *      exploring ideas before a job even exists yet.
 *
 * All actual generation work is delegated to GenerateDesignPreviewTool via
 * the AIOrchestrator — this screen never calls ImageGenerationService
 * directly, keeping the "AI never touches state directly" rule intact even
 * from the creative surface.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius, Shadow, ColorPalette } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useStore } from '../../context/store';
import { MenuIcon, SparkleIcon, BackIcon } from '../../components/common/Icons';
import { Card } from '../../components/common/UI';
import { aiOrchestrator } from '../../services/ai/AIOrchestrator';
import { contextEngine, useAIContext } from '../../services/ai/context/ContextEngine';
import * as db from '../../utils/database';
import { StudioConcept, GeneratedImage } from '../../types';

type StyleMode = 'luxury' | 'minimalist' | 'traditional' | 'modern' | 'streetwear';

const STYLE_MODES: { key: StyleMode; label: string; emoji: string }[] = [
  { key: 'modern', label: 'Modern', emoji: '✨' },
  { key: 'traditional', label: 'Traditional', emoji: '🪘' },
  { key: 'luxury', label: 'Luxury', emoji: '💎' },
  { key: 'minimalist', label: 'Minimalist', emoji: '⚪' },
  { key: 'streetwear', label: 'Streetwear', emoji: '🧢' },
];

const TailorStudioScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const jobId = route.params?.jobId as string | undefined;
  const customerId = route.params?.customerId as string | undefined;

  const { getJob, getCustomer, getMeasurementsByCustomer } = useStore();
  const job = jobId ? getJob(jobId) : undefined;
  const customer = customerId ? getCustomer(customerId) : (job ? getCustomer(job.customerId) : undefined);
  const measurements = customer ? getMeasurementsByCustomer(customer.id) : [];

  // Register with the Context Engine so the AI (including the Assistant,
  // if opened from here) always knows Studio is the active surface and
  // which job/customer it's working on.
  useAIContext({ screen: 'TailorStudio', job, customer, measurements });

  const [styleNotes, setStyleNotes] = useState('');
  const [styleMode, setStyleMode] = useState<StyleMode>('modern');
  const [isGenerating, setIsGenerating] = useState(false);
  const [concepts, setConcepts] = useState<StudioConcept[]>([]);
  const [activeConceptId, setActiveConceptId] = useState<string | null>(null);

  // ── Load version history for this job/customer ─────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const history = jobId
          ? await db.getStudioConceptsByJob(jobId)
          : customerId
            ? await db.getStudioConceptsByCustomer(customerId)
            : [];
        if (mounted) setConcepts(history);
      } catch {
        // Non-critical — Studio still works for a fresh session with no history
      }
    })();
    return () => { mounted = false; };
  }, [jobId, customerId]);

  const activeConcept = concepts.find((c) => c.id === activeConceptId) ?? null;

  // ── Generate a new concept (fresh, not an iteration) ────────────────────
  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const response = await aiOrchestrator.runTool('GenerateDesignPreviewTool', {
        styleNotes: styleNotes.trim() || undefined,
        styleMode,
        count: 3,
      });

      const images = response.toolResult?.data?.images as GeneratedImage[] | undefined;
      const prompt = response.toolResult?.data?.prompt as string | undefined;

      if (!response.toolResult?.success || !images?.length) {
        Alert.alert('Design Generation', response.reply || 'Could not generate concepts right now.');
        return;
      }

      const concept: StudioConcept = {
        id: `concept_${Date.now()}`,
        jobId,
        customerId: customer?.id,
        prompt: prompt ?? styleNotes,
        images,
        outfitType: job?.outfitType,
        colorNotes: styleNotes || undefined,
        styleMode,
        createdAt: new Date().toISOString(),
      };

      await db.createStudioConcept(concept);
      setConcepts((prev) => [concept, ...prev]);
      setActiveConceptId(concept.id);
      contextEngine.logAction(`Generated ${images.length} design concept(s) in Studio`);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, styleNotes, styleMode, jobId, customer, job]);

  // ── Iterate on the active concept (versioned — creates a new concept
  //    linked via parentConceptId, original stays in history unchanged) ───
  const handleIterate = useCallback(async () => {
    if (!activeConcept || isGenerating) return;
    setIsGenerating(true);
    try {
      const iterationNotes = styleNotes.trim()
        ? `${activeConcept.colorNotes ?? ''} — iteration: ${styleNotes.trim()}`
        : `${activeConcept.colorNotes ?? ''} — a fresh variation on this concept`;

      const response = await aiOrchestrator.runTool('GenerateDesignPreviewTool', {
        styleNotes: iterationNotes,
        styleMode: activeConcept.styleMode ?? styleMode,
        count: 3,
      });

      const images = response.toolResult?.data?.images as GeneratedImage[] | undefined;
      if (!response.toolResult?.success || !images?.length) {
        Alert.alert('Iteration', response.reply || 'Could not generate a new version right now.');
        return;
      }

      const iteration: StudioConcept = {
        id: `concept_${Date.now()}`,
        jobId,
        customerId: customer?.id,
        parentConceptId: activeConcept.id,
        prompt: iterationNotes,
        images,
        outfitType: activeConcept.outfitType,
        colorNotes: iterationNotes,
        styleMode: activeConcept.styleMode ?? styleMode,
        createdAt: new Date().toISOString(),
      };

      await db.createStudioConcept(iteration);
      setConcepts((prev) => [iteration, ...prev]);
      setActiveConceptId(iteration.id);
      contextEngine.logAction('Iterated on a design concept in Studio');
    } finally {
      setIsGenerating(false);
    }
  }, [activeConcept, isGenerating, styleNotes, styleMode, jobId, customer]);

  // ── Save a specific generated image into the job's Approved Designs ────
  const handleSaveToJob = useCallback(async (image: GeneratedImage, concept: StudioConcept) => {
    if (!jobId) {
      Alert.alert('No Active Job', 'Open Studio from a specific job to save designs into it.');
      return;
    }
    const response = await aiOrchestrator.runTool('AttachImageToJobTool', {
      uri: image.uri,
      category: 'approved_design',
      sourceConceptId: concept.id,
    });
    Alert.alert(response.toolResult?.success ? 'Saved' : 'Could Not Save', response.reply);
  }, [jobId]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (jobId ? navigation.goBack() : navigation.dispatch(DrawerActions.openDrawer()))}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {jobId ? <BackIcon size={22} color={colors.textPrimary} /> : <MenuIcon size={22} color={colors.textPrimary} />}
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>TailorStudio</Text>
          {job && <Text style={styles.headerSubtitle}>{job.customerName}'s {job.outfitType}</Text>}
        </View>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ─── Prompt Composer ─── */}
        <Card style={styles.composerCard}>
          <View style={styles.composerHeaderRow}>
            <SparkleIcon size={18} color={colors.primary} />
            <Text style={styles.composerLabel}>
              {job ? `Design concepts for ${job.outfitType}` : 'Describe a garment concept'}
            </Text>
          </View>

          <TextInput
            style={styles.composerInput}
            placeholder={
              job
                ? 'e.g. navy blue with gold embroidery on the collar'
                : 'e.g. a modern agbada in emerald green with subtle embroidery'
            }
            placeholderTextColor={colors.textTertiary}
            value={styleNotes}
            onChangeText={setStyleNotes}
            multiline
          />

          {/* Style mode selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleModeRow}>
            {STYLE_MODES.map((mode) => {
              const isActive = styleMode === mode.key;
              return (
                <TouchableOpacity
                  key={mode.key}
                  onPress={() => setStyleMode(mode.key)}
                  style={[
                    styles.styleModeChip,
                    { borderColor: isActive ? colors.primary : colors.border, backgroundColor: isActive ? colors.primaryFaint : colors.surface },
                  ]}
                >
                  <Text style={styles.styleModeEmoji}>{mode.emoji}</Text>
                  <Text style={[styles.styleModeText, { color: isActive ? colors.primary : colors.textSecondary }]}>{mode.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            onPress={handleGenerate}
            disabled={isGenerating}
            style={[styles.generateBtn, { backgroundColor: colors.primary }, isGenerating && { opacity: 0.7 }]}
            activeOpacity={0.85}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <SparkleIcon size={16} color="#FFFFFF" />
                <Text style={styles.generateBtnText}>Generate Concepts</Text>
              </>
            )}
          </TouchableOpacity>
        </Card>

        {/* ─── Active Concept — large preview + iterate ─── */}
        {activeConcept && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Current Concept</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              {activeConcept.images.map((img) => (
                <View key={img.id} style={styles.previewCard}>
                  <Image source={{ uri: img.uri }} style={styles.previewImage} resizeMode="cover" />
                  <TouchableOpacity
                    onPress={() => handleSaveToJob(img, activeConcept)}
                    style={[styles.previewSaveBtn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.previewSaveBtnText}>Save to Job</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={handleIterate}
              disabled={isGenerating}
              style={[styles.iterateBtn, { borderColor: colors.primary }]}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={16} color={colors.primary} />
              <Text style={[styles.iterateBtnText, { color: colors.primary }]}>Iterate on this concept</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Version History ─── */}
        {concepts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Version History</Text>
            {concepts.map((concept) => (
              <TouchableOpacity
                key={concept.id}
                onPress={() => setActiveConceptId(concept.id)}
                style={[
                  styles.historyRow,
                  activeConceptId === concept.id && { borderColor: colors.primary, borderWidth: 1.5 },
                ]}
                activeOpacity={0.8}
              >
                {concept.images[0] && (
                  <Image source={{ uri: concept.images[0].uri }} style={styles.historyThumb} resizeMode="cover" />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyTitle} numberOfLines={1}>
                    {concept.parentConceptId ? 'Iteration' : 'Original concept'} · {concept.images.length} image{concept.images.length !== 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.historySubtitle} numberOfLines={1}>
                    {concept.colorNotes || concept.prompt}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!job && !customer && (
          <Text style={styles.footnote}>
            Open Studio from a job's detail page to save concepts directly into that job's Approved Designs gallery.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    },
    headerTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: colors.textPrimary },
    headerSubtitle: { fontSize: Typography.xs, color: colors.textSecondary, marginTop: 1 },
    content: { padding: Spacing.base, paddingBottom: Spacing.xxxl },

    composerCard: { marginBottom: Spacing.lg },
    composerHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
    composerLabel: { fontSize: Typography.base, fontWeight: Typography.semibold, color: colors.textPrimary, flex: 1 },
    composerInput: {
      borderWidth: 1, borderColor: colors.border, borderRadius: Radius.md,
      padding: Spacing.md, fontSize: Typography.base, color: colors.textPrimary,
      minHeight: 72, textAlignVertical: 'top', marginBottom: Spacing.md,
    },
    styleModeRow: { marginBottom: Spacing.md },
    styleModeChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
      borderRadius: Radius.full, borderWidth: 1.5, marginRight: Spacing.sm,
    },
    styleModeEmoji: { fontSize: 14 },
    styleModeText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
    generateBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
      paddingVertical: Spacing.md, borderRadius: Radius.md, ...Shadow.sm,
    },
    generateBtnText: { color: '#FFFFFF', fontSize: Typography.base, fontWeight: Typography.bold },

    section: { marginBottom: Spacing.xl },
    sectionLabel: {
      fontSize: Typography.sm, fontWeight: Typography.semibold, color: colors.textSecondary,
      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.md,
    },

    previewCard: { width: 220, marginRight: Spacing.md },
    previewImage: { width: 220, height: 280, borderRadius: Radius.lg, marginBottom: Spacing.sm },
    previewSaveBtn: { paddingVertical: Spacing.sm, borderRadius: Radius.md, alignItems: 'center' },
    previewSaveBtnText: { color: '#FFFFFF', fontSize: Typography.sm, fontWeight: Typography.bold },

    iterateBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
      paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5,
    },
    iterateBtnText: { fontSize: Typography.base, fontWeight: Typography.semibold },

    historyRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: colors.surface, borderRadius: Radius.md,
      padding: Spacing.sm, marginBottom: Spacing.sm, borderWidth: 1, borderColor: colors.border,
    },
    historyThumb: { width: 48, height: 58, borderRadius: Radius.sm },
    historyTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: colors.textPrimary },
    historySubtitle: { fontSize: Typography.xs, color: colors.textSecondary, marginTop: 2 },

    footnote: {
      fontSize: Typography.xs, color: colors.textTertiary, textAlign: 'center',
      marginTop: Spacing.lg, paddingHorizontal: Spacing.lg, lineHeight: 17,
    },
  });

export default TailorStudioScreen;
