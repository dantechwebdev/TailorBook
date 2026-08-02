import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useStore } from '../../context/store';
import { Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { MenuIcon, NotepadIcon, PlusIcon, TrashIcon, CheckIcon, CloseIcon } from '../../components/common/Icons';
import { ScratchNote } from '../../types';
import { useTheme } from '../../context/ThemeContext';

// ─── Reminder presets ─────────────────────────────────────────────────────────

interface Preset { label: string; emoji: string; getDate: () => Date }

const PRESETS: Preset[] = [
  {
    label: 'In 1 hour', emoji: '⏰',
    getDate: () => { const d = new Date(); d.setHours(d.getHours() + 1); return d; },
  },
  {
    label: 'Tonight 6 pm', emoji: '🌆',
    getDate: () => {
      const d = new Date();
      d.setHours(18, 0, 0, 0);
      if (d <= new Date()) d.setDate(d.getDate() + 1);
      return d;
    },
  },
  {
    label: 'Tomorrow 8 am', emoji: '🌅',
    getDate: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(8, 0, 0, 0); return d; },
  },
  {
    label: 'In 3 days', emoji: '📅',
    getDate: () => { const d = new Date(); d.setDate(d.getDate() + 3); d.setHours(8, 0, 0, 0); return d; },
  },
  {
    label: 'In 1 week', emoji: '🗓️',
    getDate: () => { const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(8, 0, 0, 0); return d; },
  },
];

function formatReminderLabel(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    if (diff < 0) return 'Reminder passed';
    const diffH = Math.round(diff / 3600000);
    if (diffH < 2) return 'In less than an hour';
    if (diffH < 24) return `In ${diffH} hours`;
    const diffD = Math.round(diff / 86400000);
    if (diffD === 1) return 'Tomorrow';
    return `In ${diffD} days`;
  } catch { return ''; }
}

function formatTimeAgo(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const diffM = Math.round(diff / 60000);
    if (diffM < 1) return 'just now';
    if (diffM < 60) return `${diffM}m ago`;
    const diffH = Math.round(diff / 3600000);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.round(diff / 86400000);
    if (diffD === 1) return 'yesterday';
    return `${diffD}d ago`;
  } catch { return ''; }
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const ScratchPadScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { scratchNotes, addScratchNote, updateScratchNote, toggleScratchNote, deleteScratchNote } = useStore();
  const { colors: Colors, shadow} = useTheme();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<ScratchNote | null>(null);
  const [draftText, setDraftText] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const activeNotes = useMemo(() => scratchNotes.filter((n) => !n.isDone), [scratchNotes]);
  const doneNotes = useMemo(() => scratchNotes.filter((n) => n.isDone), [scratchNotes]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    },
    headerTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
    scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },

    // ── Empty state ──
    emptyState: {
      alignItems: 'center', justifyContent: 'center',
      paddingTop: 80, gap: Spacing.md,
    },
    emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.textSecondary },
    emptySub: { fontSize: Typography.sm, color: Colors.textTertiary, textAlign: 'center', paddingHorizontal: Spacing.xxl },

    // ── Note card ──
    card: {
      flexDirection: 'row', alignItems: 'flex-start',
      backgroundColor: Colors.surface, borderRadius: Radius.lg,
      padding: Spacing.md, marginBottom: Spacing.md,
      gap: Spacing.md, ...shadow.sm,
    },
    cardDone: { opacity: 0.6 },
    checkBtn: { paddingTop: 2 },
    checkCircle: {
      width: 22, height: 22, borderRadius: 11,
      borderWidth: 2, borderColor: Colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    checkCircleDone: { backgroundColor: Colors.ready, borderColor: Colors.ready },
    cardBody: { flex: 1, gap: 4 },
    cardText: { fontSize: Typography.base, color: Colors.textPrimary, lineHeight: 22 },
    cardTextDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },
    cardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.sm, marginTop: 2 },
    cardTime: { fontSize: Typography.xs, color: Colors.textTertiary },
    reminderBadge: {
      backgroundColor: Colors.primaryFaint, borderRadius: Radius.full,
      paddingHorizontal: Spacing.sm, paddingVertical: 2,
    },
    reminderBadgeText: { fontSize: Typography.xs, color: Colors.primary, fontWeight: Typography.medium },
    deleteBtn: { paddingTop: 3 },

    // ── Done section ──
    doneSection: { marginTop: Spacing.md },
    doneSectionHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: Spacing.sm, marginBottom: Spacing.sm,
    },
    doneSectionTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    doneSectionChevron: { fontSize: Typography.xs, color: Colors.textTertiary },

    // ── FAB ──
    fab: {
      position: 'absolute', right: Spacing.xl, bottom: Spacing.xl,
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: Colors.primary,
      alignItems: 'center', justifyContent: 'center',
      ...shadow.md,
    } as any,

    // ── Modal / Sheet ──
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
    sheetWrap: { position: 'absolute', bottom: 0, left: 0, right: 0 },
    sheet: {
      backgroundColor: Colors.surface,
      borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
      padding: Spacing.xl, paddingBottom: 40, gap: Spacing.md,
    },
    sheetHandle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.sm,
    },
    sheetTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sheetTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
    textInput: {
      backgroundColor: Colors.background, borderRadius: Radius.lg,
      padding: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary,
      minHeight: 100, maxHeight: 180,
      borderWidth: 1, borderColor: Colors.border,
    },
    charCount: { fontSize: Typography.xs, color: Colors.textTertiary, textAlign: 'right', marginTop: -8 },
    reminderLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary },
    existingReminder: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: Colors.primaryFaint, borderRadius: Radius.md,
      padding: Spacing.md,
    },
    existingReminderText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.medium },
    clearReminderBtn: { paddingHorizontal: Spacing.sm },
    clearReminderText: { fontSize: Typography.sm, color: Colors.overdue, fontWeight: Typography.semibold },
    presetRow: { marginHorizontal: -Spacing.xl, paddingHorizontal: Spacing.xl },
    presetChip: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
      borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full,
      paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
      marginRight: Spacing.sm, backgroundColor: Colors.surface,
    },
    presetChipActive: { backgroundColor: Colors.primaryFaint, borderColor: Colors.primary },
    presetEmoji: { fontSize: 14 },
    presetText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
    presetTextActive: { color: Colors.primary, fontWeight: Typography.semibold },
    presetConfirm: { fontSize: Typography.xs, color: Colors.primary, fontStyle: 'italic' },
    saveBtn: {
      backgroundColor: Colors.primary, borderRadius: Radius.lg,
      paddingVertical: Spacing.md + 2, alignItems: 'center', marginTop: Spacing.sm,
    },
    saveBtnDisabled: { opacity: 0.4 },
    saveBtnText: { color: Colors.white, fontSize: Typography.base, fontWeight: Typography.bold },
  }), [Colors, shadow]);

  const openAdd = () => {
    setEditingNote(null);
    setDraftText('');
    setSelectedPreset(null);
    setModalVisible(true);
  };

  const openEdit = (note: ScratchNote) => {
    setEditingNote(note);
    setDraftText(note.text);
    setSelectedPreset(null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingNote(null);
    setDraftText('');
    setSelectedPreset(null);
  };

  const handleSave = async () => {
    const text = draftText.trim();
    if (!text) return;
    setSaving(true);
    try {
      const reminderDate = selectedPreset ? selectedPreset.getDate() : undefined;
      if (editingNote) {
        await updateScratchNote(
          { ...editingNote, text },
          selectedPreset ? reminderDate : undefined
        );
      } else {
        await addScratchNote(text, reminderDate);
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleClearReminder = async () => {
    if (!editingNote) return;
    setSaving(true);
    try {
      await updateScratchNote(editingNote, null);
      setEditingNote((prev) => prev ? { ...prev, reminderAt: undefined, notifIdentifier: undefined } : null);
    } finally {
      setSaving(false);
    }
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
        <Text style={styles.headerTitle}>Scratch Pad</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Empty state ─── */}
        {activeNotes.length === 0 && doneNotes.length === 0 && (
          <View style={styles.emptyState}>
            <NotepadIcon size={52} color={Colors.border} />
            <Text style={styles.emptyTitle}>Nothing jotted down yet</Text>
            <Text style={styles.emptySub}>Tap the + button to add a quick note or reminder</Text>
          </View>
        )}

        {/* ─── Active notes ─── */}
        {activeNotes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            styles={styles}
            Colors={Colors}
            onToggle={() => toggleScratchNote(note.id)}
            onEdit={() => openEdit(note)}
            onDelete={() => deleteScratchNote(note.id)}
          />
        ))}

        {/* ─── Done section ─── */}
        {doneNotes.length > 0 && (
          <View style={styles.doneSection}>
            <TouchableOpacity
              onPress={() => setShowDone((v) => !v)}
              style={styles.doneSectionHeader}
              activeOpacity={0.7}
            >
              <Text style={styles.doneSectionTitle}>
                Completed ({doneNotes.length})
              </Text>
              <Text style={styles.doneSectionChevron}>{showDone ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showDone && doneNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                styles={styles}
                Colors={Colors}
                done
                onToggle={() => toggleScratchNote(note.id)}
                onEdit={() => openEdit(note)}
                onDelete={() => deleteScratchNote(note.id)}
              />
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ─── FAB ─── */}
      <TouchableOpacity style={styles.fab} onPress={openAdd} activeOpacity={0.85}>
        <PlusIcon size={26} color={Colors.white} />
      </TouchableOpacity>

      {/* ─── Add / Edit Modal ─── */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <Pressable style={styles.overlay} onPress={closeModal} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetWrap}
        >
          <View style={styles.sheet}>
            {/* Handle */}
            <View style={styles.sheetHandle} />

            {/* Title row */}
            <View style={styles.sheetTitleRow}>
              <Text style={styles.sheetTitle}>
                {editingNote ? 'Edit note' : 'New note'}
              </Text>
              <TouchableOpacity onPress={closeModal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <CloseIcon size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Text input */}
            <TextInput
              style={styles.textInput}
              multiline
              placeholder="Write something…"
              placeholderTextColor={Colors.textTertiary}
              value={draftText}
              onChangeText={setDraftText}
              autoFocus
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{draftText.length}/500</Text>

            {/* ── Reminder section ── */}
            <Text style={styles.reminderLabel}>🔔 Set a reminder (optional)</Text>

            {/* Show existing reminder on edit */}
            {editingNote?.reminderAt && !selectedPreset && (
              <View style={styles.existingReminder}>
                <Text style={styles.existingReminderText}>
                  ⏰ {formatReminderLabel(editingNote.reminderAt)}
                </Text>
                <TouchableOpacity onPress={handleClearReminder} style={styles.clearReminderBtn}>
                  <Text style={styles.clearReminderText}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetRow}>
              {PRESETS.map((p) => {
                const active = selectedPreset?.label === p.label;
                return (
                  <TouchableOpacity
                    key={p.label}
                    onPress={() => setSelectedPreset(active ? null : p)}
                    style={[styles.presetChip, active && styles.presetChipActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.presetEmoji}>{p.emoji}</Text>
                    <Text style={[styles.presetText, active && styles.presetTextActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedPreset && (
              <Text style={styles.presetConfirm}>
                Reminder set: {selectedPreset.label} ({selectedPreset.getDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </Text>
            )}

            {/* Save button */}
            <TouchableOpacity
              style={[styles.saveBtn, (!draftText.trim() || saving) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!draftText.trim() || saving}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save note'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Note Card ────────────────────────────────────────────────────────────────

const NoteCard: React.FC<{
  note: ScratchNote;
  done?: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  styles: any;
  Colors: any;
}> = ({ note, done, onToggle, onEdit, onDelete, styles, Colors }) => (
  <TouchableOpacity style={[styles.card, done && styles.cardDone]} onPress={onEdit} activeOpacity={0.85}>
    <TouchableOpacity onPress={onToggle} style={styles.checkBtn} activeOpacity={0.8}>
      <View style={[styles.checkCircle, done && styles.checkCircleDone]}>
        {done && <CheckIcon size={12} color={Colors.white} />}
      </View>
    </TouchableOpacity>
    <View style={styles.cardBody}>
      <Text style={[styles.cardText, done && styles.cardTextDone]} numberOfLines={3}>
        {note.text}
      </Text>
      <View style={styles.cardMeta}>
        <Text style={styles.cardTime}>{formatTimeAgo(note.createdAt)}</Text>
        {note.reminderAt && !note.isDone && (
          <View style={styles.reminderBadge}>
            <Text style={styles.reminderBadgeText}>
              🔔 {formatReminderLabel(note.reminderAt)}
            </Text>
          </View>
        )}
      </View>
    </View>
    <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <TrashIcon size={16} color={Colors.textTertiary} />
    </TouchableOpacity>
  </TouchableOpacity>
);

export default ScratchPadScreen;
