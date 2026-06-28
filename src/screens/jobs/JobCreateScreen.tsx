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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../../context/store';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { OUTFIT_TYPES, JOB_STATUSES } from '../../constants/theme';
import {
  BackIcon,
  CameraIcon,
  ImageIcon,
  ChevronDownIcon,
  MeasurementsIcon,
  CustomersIcon,
  CheckIcon,
} from '../../components/common/Icons';
import { Button, InputField, Chip, Avatar, Card } from '../../components/common/UI';
import {
  addDaysISO,
  getTodayISO,
  formatDeliveryDate,
  parseNaira,
  formatNaira,
} from '../../utils/helpers';
import { OutfitType, JobStatus, Customer } from '../../types';

// ─── Delivery Quick Select ─────────────────────────────────────────────────────

const DELIVERY_PRESETS = [
  { label: 'Tomorrow', getValue: () => addDaysISO(1) },
  { label: '3 Days', getValue: () => addDaysISO(3) },
  { label: '1 Week', getValue: () => addDaysISO(7) },
  { label: '2 Weeks', getValue: () => addDaysISO(14) },
];

// ─── Job Create Screen ────────────────────────────────────────────────────────

const JobCreateScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const prefilledCustomerId = route.params?.customerId;

  const { customers, addJob, getMeasurementsByCustomer } = useStore();

  // ─── Form State ───────────────────────────────────────────────────────────
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(prefilledCustomerId || '');
  const [outfitType, setOutfitType] = useState<OutfitType>('Senator');
  const [style, setStyle] = useState('');
  const [fabric, setFabric] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(addDaysISO(7));
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUris: samplePhotoUri ? [samplePhotoUri] : [], setSamplePhotoUri] = useState<string | undefined>();
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | undefined>();
  const [status] = useState<JobStatus>('Pending');
  const [loading, setLoading] = useState(false);

  // ─── Modals ───────────────────────────────────────────────────────────────
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const customerMeasurements = selectedCustomerId
    ? getMeasurementsByCustomer(selectedCustomerId)
    : [];

  const balance = useMemo(() => {
    const p = parseNaira(price);
    const d = parseNaira(deposit);
    return Math.max(0, p - d);
  }, [price, deposit]);

  // ─── Photo Picker ─────────────────────────────────────────────────────────

  const handleTakePhoto = async () => {
    const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (camStatus !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is needed to take outfit photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled) setSamplePhotoUri(result.assets[0].uri);
  };

  const handlePickPhoto = async () => {
    const { status: libStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (libStatus !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is needed to select outfit photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled) setSamplePhotoUri(result.assets[0].uri);
  };

  const handlePhotoOptions = () => {
    Alert.alert('Sample Photo', 'Add a reference photo for this outfit', [
      { text: 'Take Photo', onPress: handleTakePhoto },
      { text: 'Choose from Gallery', onPress: handlePickPhoto },
      samplePhotoUri ? { text: 'Remove Photo', style: 'destructive', onPress: () => setSamplePhotoUri(undefined) } : null,
      { text: 'Cancel', style: 'cancel' },
    ].filter(Boolean) as any);
  };

  // ─── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!selectedCustomerId) {
      Alert.alert('Select a customer', 'Please choose a customer for this job.');
      return;
    }
    if (!outfitType) {
      Alert.alert('Select outfit type', 'Please pick an outfit type.');
      return;
    }
    if (!deliveryDate) {
      Alert.alert('Set delivery date', 'Please set a delivery date.');
      return;
    }

    setLoading(true);
    try {
      const priceNum = parseNaira(price);
      const depositNum = parseNaira(deposit);

      const job = await addJob({
        customerId: selectedCustomerId,
        customerName: selectedCustomer!.name,
        outfitType,
        style: style.trim() || undefined,
        fabric: fabric.trim() || undefined,
        deliveryDate,
        price: priceNum,
        deposit: depositNum,
        balance: Math.max(0, priceNum - depositNum),
        status,
        measurementId: selectedMeasurementId,
        photoUris: samplePhotoUri ? [samplePhotoUri] : [],
        notes: notes.trim() || undefined,
      });

      navigation.replace('JobDetail', { jobId: job.id });
    } catch (error) {
      Alert.alert('Error', 'Could not save job. Please try again.');
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
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <BackIcon size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create New Job</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Customer Selector ─── */}
          <FormSection title="Customer">
            <TouchableOpacity
              onPress={() => setShowCustomerPicker(true)}
              style={styles.selectorRow}
              activeOpacity={0.8}
            >
              {selectedCustomer ? (
                <View style={styles.selectorSelected}>
                  <Avatar name={selectedCustomer.name} size={32} />
                  <Text style={styles.selectorValue}>{selectedCustomer.name}</Text>
                </View>
              ) : (
                <Text style={styles.selectorPlaceholder}>Select customer</Text>
              )}
              <ChevronDownIcon size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          </FormSection>

          {/* ─── Outfit Type ─── */}
          <FormSection title="Outfit Type">
            <View style={styles.chipWrap}>
              {OUTFIT_TYPES.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  selected={outfitType === type}
                  onPress={() => setOutfitType(type as OutfitType)}
                />
              ))}
            </View>
          </FormSection>

          {/* ─── Style & Fabric ─── */}
          <FormSection title="Details">
            <InputField
              label="Style"
              value={style}
              onChangeText={setStyle}
              placeholder="e.g. Classic Agbada, Slim Fit"
            />
            <InputField
              label="Fabric"
              value={fabric}
              onChangeText={setFabric}
              placeholder="e.g. Cashmere, Ankara, Damask"
            />
          </FormSection>

          {/* ─── Delivery Date ─── */}
          <FormSection title="Delivery Date">
            <View style={styles.presetRow}>
              {DELIVERY_PRESETS.map((preset) => {
                const val = preset.getValue();
                return (
                  <TouchableOpacity
                    key={preset.label}
                    onPress={() => setDeliveryDate(val)}
                    style={[
                      styles.presetBtn,
                      deliveryDate === val && styles.presetBtnActive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        deliveryDate === val && styles.presetTextActive,
                      ]}
                    >
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
          </FormSection>

          {/* ─── Measurements ─── */}
          {selectedCustomerId && (
            <FormSection title="Measurements">
              {customerMeasurements.length > 0 ? (
                <View>
                  <Text style={styles.measureHint}>Use saved measurements</Text>
                  {customerMeasurements.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() =>
                        setSelectedMeasurementId(
                          selectedMeasurementId === m.id ? undefined : m.id
                        )
                      }
                      style={[
                        styles.measureRow,
                        selectedMeasurementId === m.id && styles.measureRowActive,
                      ]}
                      activeOpacity={0.8}
                    >
                      <MeasurementsIcon
                        size={16}
                        color={selectedMeasurementId === m.id ? Colors.primary : Colors.textTertiary}
                      />
                      <Text
                        style={[
                          styles.measureLabel,
                          selectedMeasurementId === m.id && { color: Colors.primary },
                        ]}
                      >
                        {m.label || m.template}
                      </Text>
                      {selectedMeasurementId === m.id && (
                        <CheckIcon size={16} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('MeasurementForm', {
                        customerId: selectedCustomerId,
                      })
                    }
                    style={styles.addMeasureBtn}
                  >
                    <Text style={styles.addMeasureText}>+ Add new measurements</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Button
                  label="Add Measurements"
                  onPress={() =>
                    navigation.navigate('MeasurementForm', {
                      customerId: selectedCustomerId,
                    })
                  }
                  variant="secondary"
                  icon={<MeasurementsIcon size={16} color={Colors.primary} />}
                />
              )}
            </FormSection>
          )}

          {/* ─── Sample Photo ─── */}
          <FormSection title="Sample Reference">
            {samplePhotoUri ? (
              <TouchableOpacity onPress={handlePhotoOptions} activeOpacity={0.85}>
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
          </FormSection>

          {/* ─── Financials ─── */}
          <FormSection title="Payment">
            <InputField
              label="Total Price (₦)"
              value={price}
              onChangeText={setPrice}
              placeholder="e.g. 45000"
              keyboardType="numeric"
            />
            <InputField
              label="Deposit Paid (₦)"
              value={deposit}
              onChangeText={setDeposit}
              placeholder="e.g. 20000"
              keyboardType="numeric"
            />
            {(parseNaira(price) > 0) && (
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Balance Remaining</Text>
                <Text style={[styles.balanceValue, balance > 0 && { color: Colors.overdue }]}>
                  {formatNaira(balance)}
                </Text>
              </View>
            )}
          </FormSection>

          {/* ─── Notes ─── */}
          <FormSection title="Notes">
            <InputField
              label=""
              value={notes}
              onChangeText={setNotes}
              placeholder="Any special instructions or requirements..."
              multiline
              numberOfLines={3}
              autoCapitalize="sentences"
            />
          </FormSection>

          {/* ─── Save ─── */}
          <Button
            label="Save Job"
            onPress={handleSave}
            loading={loading}
            size="lg"
            style={{ marginTop: Spacing.sm, marginBottom: Spacing.xxxl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Customer Picker Modal ─── */}
      <CustomerPickerModal
        visible={showCustomerPicker}
        customers={customers}
        selectedId={selectedCustomerId}
        onSelect={(id) => {
          setSelectedCustomerId(id);
          setSelectedMeasurementId(undefined);
          setShowCustomerPicker(false);
        }}
        onClose={() => setShowCustomerPicker(false)}
        onCreateNew={() => {
          setShowCustomerPicker(false);
          navigation.navigate('CustomerCreate');
        }}
      />
    </SafeAreaView>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <View style={styles.formSection}>
    <Text style={styles.formSectionTitle}>{title}</Text>
    {children}
  </View>
);

interface CustomerPickerModalProps {
  visible: boolean;
  customers: Customer[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  onCreateNew: () => void;
}

const CustomerPickerModal: React.FC<CustomerPickerModalProps> = ({
  visible,
  customers,
  selectedId,
  onSelect,
  onClose,
  onCreateNew,
}) => (
  <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
    <View style={styles.modalOverlay}>
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Select Customer</Text>

        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          style={{ maxHeight: 400 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => onSelect(item.id)}
              style={styles.modalItem}
              activeOpacity={0.8}
            >
              <Avatar name={item.name} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={styles.modalItemName}>{item.name}</Text>
                <Text style={styles.modalItemPhone}>{item.phone}</Text>
              </View>
              {selectedId === item.id && <CheckIcon size={18} color={Colors.primary} />}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.borderLight }} />}
          ListEmptyComponent={
            <Text style={styles.modalEmpty}>No customers yet. Create one first.</Text>
          }
        />

        <View style={styles.modalActions}>
          <Button label="+ New Customer" onPress={onCreateNew} variant="secondary" />
          <Button label="Cancel" onPress={onClose} variant="ghost" />
        </View>
      </View>
    </View>
  </Modal>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  formSection: {
    marginBottom: Spacing.xl,
  },
  formSectionTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },
  selectorSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  selectorValue: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
  selectorPlaceholder: {
    fontSize: Typography.base,
    color: Colors.textTertiary,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  presetRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  presetBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  presetBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaint,
  },
  presetText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  presetTextActive: {
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  dateDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  dateLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  dateValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },
  measureHint: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
  },
  measureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
  },
  measureRowActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaint,
  },
  measureLabel: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  addMeasureBtn: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  addMeasureText: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  photoRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.surface,
  },
  photoBtnText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: Radius.lg,
    resizeMode: 'cover',
  },
  photoChangeHint: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  balanceLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  balanceValue: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.ready,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.base,
    paddingBottom: 36,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  modalItemName: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  modalItemPhone: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  modalEmpty: {
    textAlign: 'center',
    padding: Spacing.xl,
    color: Colors.textTertiary,
    fontSize: Typography.sm,
  },
  modalActions: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
});

export default JobCreateScreen;
