import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, Alert } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

interface Props {
  onSelect: (name: string, phone: string) => void;
  label?: string;
}

const ContactPickerButton: React.FC<Props> = ({ onSelect, label = 'From Contacts' }) => {
  if (Platform.OS === 'web') return null;

  const handlePress = async () => {
    try {
      const Contacts = await import('expo-contacts');
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Contacts access is required to pick a contact.');
        return;
      }
      const result = await Contacts.presentContactPickerAsync();
      if (!result) return;
      const contact = result as any;
      const name: string = contact.name || contact.displayName || '';
      const phones: any[] = contact.phoneNumbers || [];
      const phone: string = phones[0]?.number || phones[0]?.digits || '';
      if (!name && !phone) return;
      onSelect(name, phone);
    } catch (err) {
      console.warn('ContactPicker error:', err);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.btn} activeOpacity={0.8}>
      <Text style={styles.icon}>👤</Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryFaint,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  icon: { fontSize: 14 },
  label: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
});

export default ContactPickerButton;
