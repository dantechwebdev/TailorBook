import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../context/store';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { BackIcon, CustomersIcon } from '../common/Icons';
import { Button, InputField, Avatar } from '../common/UI';
import { isValidName, isValidPhone, getAvatarColor } from '../../utils/helpers';

const CustomerCreateScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { addCustomer } = useStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: { name?: string; phone?: string } = {};
    if (!isValidName(name)) newErrors.name = 'Please enter a valid name (at least 2 characters)';
    if (!isValidPhone(phone)) newErrors.phone = 'Please enter a valid phone number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const customer = await addCustomer({
        name: name.trim(),
        phone: phone.trim(),
        notes: notes.trim() || undefined,
        avatar: getAvatarColor(name.trim()),
      });

      // Prompt to create a job for this customer
      Alert.alert(
        `${name.trim()} added! 🎉`,
        'Would you like to create a job for this customer now?',
        [
          {
            text: 'Not now',
            style: 'cancel',
            onPress: () => navigation.navigate('CustomerDetail', { customerId: customer.id }),
          },
          {
            text: 'Create Job',
            onPress: () =>
              navigation.navigate('JobCreate', { customerId: customer.id }),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Could not save customer. Please try again.');
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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <BackIcon size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Register Customer</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Avatar Preview ─── */}
          <View style={styles.avatarSection}>
            <Avatar name={name || 'N'} size={72} />
            {name ? (
              <Text style={styles.avatarName}>{name}</Text>
            ) : (
              <Text style={styles.avatarPlaceholder}>Enter name below</Text>
            )}
          </View>

          {/* ─── Form ─── */}
          <View style={styles.form}>
            <InputField
              label="Customer Name *"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Emeka Johnson"
              error={errors.name}
              autoCapitalize="words"
            />

            <InputField
              label="Phone Number *"
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 0803 123 4567"
              keyboardType="phone-pad"
              error={errors.phone}
              autoCapitalize="none"
            />

            <InputField
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Prefers loose fits, allergic to certain fabrics..."
              multiline
              numberOfLines={3}
              autoCapitalize="sentences"
            />
          </View>

          {/* ─── Save Button ─── */}
          <Button
            label="Save Customer"
            onPress={handleSave}
            loading={loading}
            size="lg"
            style={{ marginTop: Spacing.lg }}
          />

          <Text style={styles.hint}>
            After saving, you'll be prompted to create a job.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  avatarName: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  avatarPlaceholder: {
    fontSize: Typography.sm,
    color: Colors.textTertiary,
  },
  form: {
    gap: Spacing.xs,
  },
  hint: {
    textAlign: 'center',
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.md,
    lineHeight: 18,
  },
});

export default CustomerCreateScreen;
