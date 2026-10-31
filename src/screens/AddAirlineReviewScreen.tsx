import React, { useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const RATINGS = [1, 2, 3, 4, 5];

export default function AddAirlineReviewScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { addAirlineReview } = useAppState();

  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [airline, setAirline] = useState('');
  const [note, setNote] = useState('');
  const [rating, setRating] = useState(5);

  const canSubmit = fromCity.trim() && toCity.trim() && airline.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    addAirlineReview({
      fromCity: fromCity.trim(),
      toCity: toCity.trim(),
      airline: airline.trim(),
      note: note.trim(),
      rating,
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تجربة خط طيران</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.row}>
          <View style={styles.rowField}>
            <Text style={styles.label}>إلى مدينة</Text>
            <TextInput
              style={styles.input}
              placeholder="دبي"
              placeholderTextColor={colors.textFaint}
              value={toCity}
              onChangeText={setToCity}
              textAlign="right"
            />
          </View>
          <View style={styles.rowField}>
            <Text style={styles.label}>من مدينة</Text>
            <TextInput
              style={styles.input}
              placeholder="الرياض"
              placeholderTextColor={colors.textFaint}
              value={fromCity}
              onChangeText={setFromCity}
              textAlign="right"
            />
          </View>
        </View>

        <Text style={styles.label}>خط الطيران</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: السعودية، طيران الإمارات..."
          placeholderTextColor={colors.textFaint}
          value={airline}
          onChangeText={setAirline}
          textAlign="right"
        />

        <Text style={styles.label}>تقييمك</Text>
        <View style={styles.starsRow}>
          {RATINGS.map((value) => (
            <TouchableOpacity key={value} onPress={() => setRating(value)} activeOpacity={0.7}>
              <Ionicons
                name={value <= rating ? 'star' : 'star-outline'}
                size={26}
                color={colors.accent}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>ملاحظتك (اختياري)</Text>
        <TextInput
          style={[styles.input, styles.noteInput]}
          placeholder="وش عجبك أو ما عجبك بالرحلة؟"
          placeholderTextColor={colors.textFaint}
          value={note}
          onChangeText={setNote}
          multiline
          textAlign="right"
        />

        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
          activeOpacity={0.85}
          disabled={!canSubmit}
          onPress={handleSubmit}
        >
          <Text style={styles.submitText}>حفظ التجربة</Text>
        </TouchableOpacity>
      </ScrollView>
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
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
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
  noteInput: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row-reverse', gap: spacing.md },
  rowField: { flex: 1 },
  starsRow: { flexDirection: 'row-reverse', gap: spacing.sm },
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
