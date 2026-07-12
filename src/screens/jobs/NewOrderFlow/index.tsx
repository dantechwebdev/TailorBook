import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Typography, Spacing, Radius } from '../../../constants/theme';
import { BackIcon } from '../../../components/common/Icons';
import { Customer, DeliveryType, MeasurementTemplate, OutfitType } from '../../../types';
import { useStore } from '../../../context/store';
import { useTheme } from '../../../context/ThemeContext';
import StepCustomer from './StepCustomer';
import StepGarment from './StepGarment';
import StepPhotos from './StepPhotos';
import StepMeasurements from './StepMeasurements';
import StepDelivery from './StepDelivery';
import StepPayment from './StepPayment';
import StepReview from './StepReview';

// ─── Flow State ───────────────────────────────────────────────────────────────

export interface DraftMeasurement {
  template: MeasurementTemplate;
  data: Record<string, string>;
  label: string;
}

export interface OrderDraft {
  customer: Customer | null;
  isNewCustomer: boolean;
  newCustomerName: string;
  newCustomerPhone: string;
  outfitType: string;
  style: string;
  fabric: string;
  photoUris: string[];
  deliveryDate: string;
  deliveryType: DeliveryType;
  deliveryAddress: string;
  price: string;
  deposit: string;
  notes: string;
  measurementId: string;
  draftMeasurement: DraftMeasurement | null;
}

const STEPS = ['Customer', 'Garment', 'Photos', 'Measurements', 'Delivery', 'Payment', 'Review'];

// ─── NewOrderFlow ─────────────────────────────────────────────────────────────

const NewOrderFlow: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { settings } = useStore();
  const { colors: Colors } = useTheme();

  const initialStep = route.params?.step ?? 0;
  const prefilledCustomerId = route.params?.customerId;

  const [step, setStep] = useState(initialStep);
  const [draft, setDraft] = useState<OrderDraft>(() => ({
    customer: null,
    isNewCustomer: false,
    newCustomerName: '',
    newCustomerPhone: '',
    outfitType: (settings.defaultApparel as OutfitType) || '',
    style: '',
    fabric: '',
    photoUris: [],
    deliveryDate: '',
    deliveryType: 'pickup',
    deliveryAddress: '',
    price: '',
    deposit: '',
    notes: '',
    measurementId: '',
    draftMeasurement: null,
  }));

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
    },
    backBtn: { width: 40, alignItems: 'flex-start' },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: {
      fontSize: Typography.md,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
    },
    headerStep: {
      fontSize: Typography.xs,
      color: Colors.textSecondary,
      marginTop: 2,
    },
    progressTrack: {
      height: 3,
      backgroundColor: Colors.borderLight,
      marginHorizontal: Spacing.base,
      borderRadius: Radius.full,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: Colors.primary,
      borderRadius: Radius.full,
    },
    content: { flex: 1 },
  }), [Colors]);

  const updateDraft = (patch: Partial<OrderDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const goNext = () => {
    if (step < STEPS.length - 1) setStep((s: number) => s + 1);
  };

  const goBack = () => {
    if (step === 0) {
      navigation.goBack();
    } else {
      setStep((s: number) => s - 1);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <StepCustomer
            draft={draft}
            onChange={updateDraft}
            onNext={goNext}
            prefilledCustomerId={prefilledCustomerId}
          />
        );
      case 1:
        return (
          <StepGarment draft={draft} onChange={updateDraft} onNext={goNext} />
        );
      case 2:
        return (
          <StepPhotos draft={draft} onChange={updateDraft} onNext={goNext} />
        );
      case 3:
        return (
          <StepMeasurements draft={draft} onChange={updateDraft} onNext={goNext} />
        );
      case 4:
        return (
          <StepDelivery draft={draft} onChange={updateDraft} onNext={goNext} />
        );
      case 5:
        return (
          <StepPayment draft={draft} onChange={updateDraft} onNext={goNext} />
        );
      case 6:
        return (
          <StepReview
            draft={draft}
            onChange={updateDraft}
            onDone={(jobId) => {
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: 'JobsStack',
                    state: {
                      routes: [
                        { name: 'JobList' },
                        { name: 'JobDetail', params: { jobId } },
                      ],
                    },
                  },
                ],
              });
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goBack}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <BackIcon size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>New Order</Text>
          <Text style={styles.headerStep}>
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* ─── Progress Bar ─── */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${((step + 1) / STEPS.length) * 100}%` },
          ]}
        />
      </View>

      {/* ─── Step Content ─── */}
      <View style={styles.content}>{renderStep()}</View>
    </SafeAreaView>
  );
};

export default NewOrderFlow;
