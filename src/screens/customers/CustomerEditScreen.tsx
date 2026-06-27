import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStore } from '../../context/store';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { BackIcon } from '../../components/common/Icons';
import { Button, InputField, Avatar } from '../../components/common/UI';
import { isValidName, isValidPhone } from '../../utils/helpers';

const CustomerEditScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { customerId } = route.params || {};

  const { getCustomer, updateCustomer } = useStore();
  const existing = getCustomer(customerId);

  const [name, setName] = useState(existing?.name || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!existing) {
      Alert.alert('Error', 'Customer not found.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, []);

  const validate = () => {
    const newErrors: { name?: string; phone?: string } = {};
    if (!isValidName(name)) newErrors.name = 'Please enter a valid name (at least 2 characters)';
    if (!isValidPhone(phone)) newErrors.phone = 'Please enter a valid phone number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!existing) return;
    if (!validate()) return;

    setLoading(true);
    try {
      await updateCustomer({
        ...existing,
        name: name.trim(),
        phone: phone.trim(),
        notes: notes.trim() || undefined,
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Could not update customer. Please try again.');
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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <BackIcon size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Customer</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.avatarSection}>
            <Avatar name={name || 'N'} size={72} />
            {name ? (
              <Text style={styles.avatarName}>{name}</Text>
            ) : (
              <Text style={styles.avatarPlaceholder}>Enter name below</Text>
            )}
          </View>

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
              placeholder="e.g. Prefers loose fits..."
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
            style={{ marginTop: Spacing.lg }}
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
  headerTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xxxl },
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
  form: { gap: Spacing.xs },
});

export default CustomerEditScreen;
