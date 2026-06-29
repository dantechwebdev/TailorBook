import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../../context/store';
import { Colors, Typography, Spacing, Radius, OUTFIT_TYPES } from '../../constants/theme';
import {
  BackIcon,
  CameraIcon,
  ImageIcon,
  ChevronDownIcon,
  MeasurementsIcon,
  CheckIcon,
} from '../../components/common/Icons';
import { Button, InputField, Chip, Avatar } from '../../components/common/UI';
import {
  addDaysISO,
  formatDeliveryDate,
  parseNaira,
  formatNaira,
} from '../../utils/helpers';
import { OutfitType, JobStatus, Customer } from '../../types';

const DELIVERY_PRESETS = [
  { label: 'Tomorrow', getValue: () => addDaysISO(1) },
  { label: '3 Days', getValue: () => addDaysISO(3) },
  { label: '1 Week', getValue: () => addDaysISO(7) },
  { label: '2 Weeks', getValue: () => addDaysISO(14) },
];

const JobEditScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { jobId } = route.params || {};

  const { getJob, updateJob, customers, getMeasurementsByCustomer } = useStore();
  const job = getJob(jobId);

  const isCustomOutfit = !!job && !OUTFIT_TYPES.includes(job.outfitType as any);
  const [outfitType, setOutfitType] = useState<string>(isCustomOutfit ? 'Other' : (job?.outfitType || 'Senator'));
  const [customOutfitType, setCustomOutfitType] = useState(isCustomOutfit ? (job?.outfitType || '') : '');
  const [showCustomOutfit, setShowCustomOutfit] = useState(isCustomOutfit);
  const [style, setStyle] = useState(job?.style || '');
  const [fabric, setFabric] = useState(job?.fabric || '');
  const [deliveryDate, setDeliveryDate] = useState(job?.deliveryDate || addDaysISO(7));
  const [price, setPrice] = useState(job?.price ? String(job.price) : '');
  const [deposit, setDeposit] = useState(job?.deposit ? String(job.deposit) : '');
  const [notes, setNotes] = useState(job?.notes || '');
  const [samplePhotoUri, setSamplePhotoUri] = useState<string | undefined>(job?.photoUris?.[0]);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | undefined>(job?.measurementId);
  const [loading, setLoading] = useState(false);

  const customerMeasurements = job ? getMeasurementsByCustomer(job.customerId) : [];

  const balance = useMemo(() => {
    const p = parseNaira(price);
    const d = parseNaira(deposit);
    return Math.max(0, p - d);
  }, [price, deposit]);

  if (!job) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <BackIcon size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.textSecondary }}>Job not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled) setSamplePhotoUri(result.assets[0].uri);
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled) setSamplePhotoUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const priceNum = parseNaira(price);
      const depositNum = parseNaira(deposit);

      const finalOutfitType = outfitType === 'Other' ? (customOutfitType.trim() || 'Other') : outfitType;
      await updateJob({
        ...job,
        outfitType: finalOutfitType,
        style: style.trim() || undefined,
        fabric: fabric.trim() || undefined,
        deliveryDate,
        price: priceNum,
        deposit: depositNum,
        balance: Math.max(0, priceNum - depositNum),
        measurementId: selectedMeasurementId,
        photoUris: samplePhotoUri ? [samplePhotoUri] : (job.photoUris || []),
        notes: notes.trim() || undefined,
      });

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Could not update job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <BackIcon size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Job</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Customer (read-only) */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Customer</Text>
            <View style={[styles.selectorRow, { opacity: 0.7 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <Avatar name={job.customerName} size={32} />
                <Text style={styles.selectorValue}>{job.customerName}</Text>
              </View>
              <Text style={{ fontSize: Typography.xs, color: Colors.textTertiary }}>Locked</Text>
            </View>
          </View>

          {/* Outfit Type */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Outfit Type</Text>
            <View style={styles.chipWrap}>
              {OUTFIT_TYPES.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  selected={outfitType === type}
                  onPress={() => {
                    setOutfitType(type);
                    if (type === 'Other') {
                      setShowCustomOutfit(true);
                    } else {
                      setShowCustomOutfit(false);
                      setCustomOutfitType('');
                    }
                  }}
                />
              ))}
            </View>
            {showCustomOutfit && (
              <View style={styles.customOutfitWrap}>
                <Text style={styles.customOutfitLabel}>Garment name</Text>
                <TextInput
                  style={styles.customOutfitInput}
                  placeholder="e.g. Babariga, Jumpsuit, Corset..."
                  placeholderTextColor={Colors.textTertiary}
                  value={customOutfitType}
                  onChangeText={setCustomOutfitType}
                  autoCapitalize="words"
                  autoFocus
                />
              </View>
            )}
          </View>

          {/* Style & Fabric */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Details</Text>
            <InputField label="Style" value={style} onChangeText={setStyle} placeholder="e.g. Classic Agbada" />
            <InputField label="Fabric" value={fabric} onChangeText={setFabric} placeholder="e.g. Cashmere, Ankara" />
          </View>

          {/* Delivery Date */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Delivery Date</Text>
            <View style={styles.presetRow}>
              {DELIVERY_PRESETS.map((preset) => {
                const val = preset.getValue();
                return (
                  <TouchableOpacity
                    key={preset.label}
                    onPress={() => setDeliveryDate(val)}
                    style={[styles.presetBtn, deliveryDate === val && styles.presetBtnActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.presetText, deliveryDate === val && styles.presetTextActive]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.dateDisplayRow}>
              <Text style={styles.dateLabel}>Selected:</Text>
              <Text style={styles.dateValue}>{formatDeliveryDate(deliveryDate)}</Text>
            </View>
          </View>

          {/* Measurements */}
          {customerMeasurements.length > 0 && (
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Measurements</Text>
              {customerMeasurements.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setSelectedMeasurementId(selectedMeasurementId === m.id ? undefined : m.id)}
                  style={[styles.measureRow, selectedMeasurementId === m.id && styles.measureRowActive]}
                  activeOpacity={0.8}
                >
                  <MeasurementsIcon size={16} color={selectedMeasurementId === m.id ? Colors.primary : Colors.textTertiary} />
                  <Text style={[styles.measureLabel, selectedMeasurementId === m.id && { color: Colors.primary }]}>
                    {m.label || m.template}
                  </Text>
                  {selectedMeasurementId === m.id && <CheckIcon size={16} color={Colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Sample Photo */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Sample Reference</Text>
            {samplePhotoUri ? (
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Sample Photo', '', [
                    { text: 'Take New Photo', onPress: handleTakePhoto },
                    { text: 'Choose from Gallery', onPress: handlePickPhoto },
                    { text: 'Remove Photo', style: 'destructive', onPress: () => setSamplePhotoUri(undefined) },
                    { text: 'Cancel', style: 'cancel' },
                  ])
                }
                activeOpacity={0.85}
              >
                <Image source={{ uri: samplePhotoUri }} style={styles.photoPreview} />
                <Text style={styles.photoChangeHint}>Tap to change</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.photoRow}>
                <TouchableOpacity onPress={handleTakePhoto} style={styles.photoBtn} activeOpacity={0.8}>
                  <CameraIcon size={20} color={Colors.textSecondary} />
                  <Text style={styles.photoBtnText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePickPhoto} style={styles.photoBtn} activeOpacity={0.8}>
                  <ImageIcon size={20} color={Colors.textSecondary} />
                  <Text style={styles.photoBtnText}>From Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Payment */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Payment</Text>
            <InputField label="Total Price (₦)" value={price} onChangeText={setPrice} placeholder="e.g. 45000" keyboardType="numeric" />
            <InputField label="Deposit Paid (₦)" value={deposit} onChangeText={setDeposit} placeholder="e.g. 20000" keyboardType="numeric" />
            {parseNaira(price) > 0 && (
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Balance Remaining</Text>
                <Text style={[styles.balanceValue, balance > 0 && { color: Colors.overdue }]}>
                  {formatNaira(balance)}
                </Text>
              </View>
            )}
          </View>

          {/* Notes */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Notes</Text>
            <InputField
              label=""
              value={notes}
              onChangeText={setNotes}
              placeholder="Special instructions..."
              multiline
              numberOfLines={3}
              autoCapitalize="sentences"
            />
          </View>

          <Button
            label="Save Changes"
            onPress={handleSave}
            loading={loading}
            size="lg"
            style={{ marginTop: Spacing.sm, marginBottom: Spacing.xxxl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl },
  formSection: { marginBottom: Spacing.xl },
  formSectionTitle: {
    fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md,
  },
  selectorRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    justifyContent: 'space-between',
  },
  selectorValue: { fontSize: Typography.base, color: Colors.textPrimary, fontWeight: Typography.medium },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  customOutfitWrap: {
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    padding: Spacing.md,
  },
  customOutfitLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  customOutfitInput: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  presetRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, flexWrap: 'wrap' },
  presetBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  presetBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryFaint },
  presetText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  presetTextActive: { color: Colors.primary, fontWeight: Typography.semibold },
  dateDisplayRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.sm },
  dateLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  dateValue: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.primary },
  measureRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface, marginBottom: Spacing.sm,
  },
  measureRowActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryFaint },
  measureLabel: { flex: 1, fontSize: Typography.base, color: Colors.textSecondary, fontWeight: Typography.medium },
  photoRow: { flexDirection: 'row', gap: Spacing.md },
  photoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.md, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', backgroundColor: Colors.surface,
  },
  photoBtnText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  photoPreview: { width: '100%', height: 200, borderRadius: Radius.lg, resizeMode: 'cover' },
  photoChangeHint: { fontSize: Typography.xs, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.sm },
  balanceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
    backgroundColor: Colors.borderLight, borderRadius: Radius.md, marginBottom: Spacing.md,
  },
  balanceLabel: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  balanceValue: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.ready },
});

export default JobEditScreen;
