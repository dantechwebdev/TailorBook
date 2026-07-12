import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Typography, Spacing, Radius, Shadow } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';
import { OrderDraft } from './index';

const MAX_PHOTOS = 6;

interface Props {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  onNext: () => void;
}

const StepPhotos: React.FC<Props> = ({ draft, onChange, onNext }) => {
  const { colors: Colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const photos = draft.photoUris || [];

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { paddingBottom: 100 },
    promptBlock: {
      paddingHorizontal: Spacing.base,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.lg,
    },
    question: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: Typography.base,
      color: Colors.textSecondary,
      lineHeight: 22,
    },
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: Spacing.base,
      gap: Spacing.sm,
    },
    photoWrapper: {
      width: '31%',
      aspectRatio: 3 / 4,
      borderRadius: Radius.lg,
      overflow: 'hidden',
      position: 'relative',
    },
    photo: {
      width: '100%',
      height: '100%',
      borderRadius: Radius.lg,
    },
    removeBtn: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeBtnText: { color: Colors.white, fontSize: 11, fontWeight: Typography.bold },
    addMoreCard: {
      width: '31%',
      aspectRatio: 3 / 4,
      borderRadius: Radius.lg,
      backgroundColor: Colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: Colors.borderLight,
      borderStyle: 'dashed',
    },
    addMoreIcon: { fontSize: 28, color: Colors.textTertiary },
    addMoreText: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 4 },
    emptyBlock: {
      alignItems: 'center',
      paddingHorizontal: Spacing.xxl,
      paddingVertical: Spacing.xl,
    },
    emptyIcon: { fontSize: 52, marginBottom: Spacing.md },
    emptyTitle: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: Colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    emptyHint: {
      fontSize: Typography.sm,
      color: Colors.textTertiary,
      textAlign: 'center',
      lineHeight: 20,
    },
    addBtnGroup: {
      flexDirection: 'row',
      gap: Spacing.md,
      paddingHorizontal: Spacing.base,
      marginTop: Spacing.lg,
    },
    addBtn: {
      flex: 1,
      backgroundColor: Colors.primary,
      borderRadius: Radius.xl,
      paddingVertical: Spacing.xl,
      alignItems: 'center',
      ...Shadow.sm,
      gap: Spacing.sm,
    },
    addBtnIcon: { fontSize: 32 },
    addBtnLabel: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: Colors.white,
    },
    footer: {
      padding: Spacing.base,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.xxl,
    },
    nextBtn: {
      backgroundColor: Colors.primary,
      paddingVertical: Spacing.md + 2,
      borderRadius: Radius.lg,
      alignItems: 'center',
    },
    nextBtnText: {
      fontSize: Typography.base,
      color: Colors.white,
      fontWeight: Typography.bold,
    },
  }), [Colors]);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'web') return true;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  };

  const requestGalleryPermission = async () => {
    if (Platform.OS === 'web') return true;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const addPhoto = (uri: string) => {
    if (photos.length >= MAX_PHOTOS) return;
    onChange({ photoUris: [...photos, uri] });
  };

  const removePhoto = (index: number) => {
    onChange({ photoUris: photos.filter((_, i) => i !== index) });
  };

  const handleCamera = async () => {
    setLoading(true);
    try {
      const ok = await requestCameraPermission();
      if (!ok) {
        Alert.alert('Permission needed', 'Camera access is required to take photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.75,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets[0]) {
        addPhoto(result.assets[0].uri);
      }
    } catch {}
    setLoading(false);
  };

  const handleGallery = async () => {
    setLoading(true);
    try {
      const ok = await requestGalleryPermission();
      if (!ok) {
        Alert.alert('Permission needed', 'Gallery access is required to pick photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.75,
        allowsMultipleSelection: Platform.OS !== 'web',
        selectionLimit: MAX_PHOTOS - photos.length,
      });
      if (!result.canceled && result.assets) {
        const uris = result.assets.map((a) => a.uri).slice(0, MAX_PHOTOS - photos.length);
        onChange({ photoUris: [...photos, ...uris] });
      }
    } catch {}
    setLoading(false);
  };

  const canAddMore = photos.length < MAX_PHOTOS;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.promptBlock}>
        <Text style={styles.question}>Add reference photos</Text>
        <Text style={styles.subtitle}>
          Take or upload photos of the style, fabric, or inspiration.{'\n'}
          Up to {MAX_PHOTOS} photos — this step is optional.
        </Text>
      </View>

      {/* ─── Photo Grid ─── */}
      {photos.length > 0 && (
        <View style={styles.photoGrid}>
          {photos.map((uri, index) => (
            <View key={index} style={styles.photoWrapper}>
              <Image source={{ uri }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removePhoto(index)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          {canAddMore && (
            <TouchableOpacity
              style={styles.addMoreCard}
              onPress={handleGallery}
              activeOpacity={0.8}
            >
              <Text style={styles.addMoreIcon}>+</Text>
              <Text style={styles.addMoreText}>Add more</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ─── Empty Prompt ─── */}
      {photos.length === 0 && (
        <View style={styles.emptyBlock}>
          <Text style={styles.emptyIcon}>📷</Text>
          <Text style={styles.emptyTitle}>No photos yet</Text>
          <Text style={styles.emptyHint}>
            Photos help you and your team remember the exact style, fabric pattern, or client design inspiration.
          </Text>
        </View>
      )}

      {/* ─── Add buttons ─── */}
      {canAddMore && photos.length === 0 && (
        <View style={styles.addBtnGroup}>
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              onPress={handleCamera}
              style={styles.addBtn}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={styles.addBtnIcon}>📷</Text>
              <Text style={styles.addBtnLabel}>Take Photo</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleGallery}
            style={[styles.addBtn, { backgroundColor: Colors.surface }]}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.addBtnIcon}>🖼️</Text>
            <Text style={[styles.addBtnLabel, { color: Colors.textPrimary }]}>
              {Platform.OS === 'web' ? 'Upload Photo' : 'From Gallery'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Footer ─── */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={onNext}
          style={styles.nextBtn}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {photos.length > 0
              ? `Continue with ${photos.length} photo${photos.length > 1 ? 's' : ''} →`
              : 'Skip — no photos →'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default StepPhotos;
