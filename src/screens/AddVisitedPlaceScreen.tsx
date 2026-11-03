import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AddVisitedPlaceScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { addManualVisitedPlace } = useAppState();
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    addManualVisitedPlace(name.trim());
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إضافة ختم جديد</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.label}>دولة أو مدينة سبق وزرتها</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: مدريد، إسبانيا"
          placeholderTextColor={colors.textFaint}
          value={name}
          onChangeText={setName}
          textAlign="right"
          autoFocus
        />
        <Text style={styles.hint}>يُضاف كختم بملفك الشخصي — جزء من جواز رحلاتك الخاص</Text>
        <TouchableOpacity
          style={[styles.submitButton, !name.trim() && styles.submitDisabled]}
          activeOpacity={0.85}
          disabled={!name.trim()}
          onPress={handleAdd}
        >
          <Text style={styles.submitText}>إضافة الختم</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  body: { padding: spacing.lg },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600', textAlign: 'right', marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 14,
    textAlign: 'right',
  },
  hint: { color: colors.textFaint, fontSize: 11, textAlign: 'right', marginTop: spacing.sm, lineHeight: 16 },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 14 },
});
