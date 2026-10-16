import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../theme/colors';
import { destinations } from '../data/destinations';
import { useAppState } from '../context/AppState';
import { BUDGET_CATEGORY_LABELS, type BudgetCategory } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES: BudgetCategory[] = ['hotels', 'food', 'transport', 'activities', 'other'];

type DraftItem = { id: string; category: BudgetCategory; label: string };

export default function CreateTripTemplateScreen() {
  const navigation = useNavigation<Nav>();
  const { addTripTemplate } = useAppState();

  const [title, setTitle] = useState('');
  const [destinationId, setDestinationId] = useState(destinations[0].id);
  const [days, setDays] = useState('3');
  const [price, setPrice] = useState('0');
  const [itemCategory, setItemCategory] = useState<BudgetCategory>('hotels');
  const [itemLabel, setItemLabel] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);

  const canSubmit = title.trim().length > 0 && items.length > 0;

  const addItem = () => {
    if (!itemLabel.trim()) return;
    setItems((prev) => [...prev, { id: `draft-${Date.now()}`, category: itemCategory, label: itemLabel.trim() }]);
    setItemLabel('');
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handlePublish = () => {
    if (!canSubmit) return;
    const template = addTripTemplate({
      title: title.trim(),
      destinationId,
      days: Math.max(1, Number(days) || 1),
      price: Math.max(0, Number(price) || 0),
      items: items.map(({ category, label }) => ({ category, label })),
    });
    navigation.replace('TripTemplateDetail', { templateId: template.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>قالب رحلة جديد</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>عنوان القالب</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: نهاية أسبوع بالعلا"
          placeholderTextColor={colors.textFaint}
          value={title}
          onChangeText={setTitle}
          textAlign="right"
        />

        <Text style={styles.label}>الوجهة</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {destinations.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={[styles.chip, destinationId === d.id && styles.chipActive]}
              activeOpacity={0.8}
              onPress={() => setDestinationId(d.id)}
            >
              <Text style={[styles.chipText, destinationId === d.id && styles.chipTextActive]}>{d.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.row}>
          <View style={styles.rowField}>
            <Text style={styles.label}>عدد الأيام</Text>
            <TextInput
              style={styles.input}
              value={days}
              onChangeText={setDays}
              keyboardType="numeric"
              textAlign="right"
            />
          </View>
          <View style={styles.rowField}>
            <Text style={styles.label}>السعر (0 = مجاني)</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              textAlign="right"
            />
          </View>
        </View>

        <Text style={styles.label}>محتوى الخطة</Text>
        {items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <TouchableOpacity onPress={() => removeItem(item.id)} activeOpacity={0.7}>
              <Ionicons name="close-circle-outline" size={18} color={colors.textFaint} />
            </TouchableOpacity>
            <Text style={styles.itemText}>{item.label}</Text>
            <Text style={styles.itemCategory}>{BUDGET_CATEGORY_LABELS[item.category]}</Text>
          </View>
        ))}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, itemCategory === cat && styles.chipActive]}
              activeOpacity={0.8}
              onPress={() => setItemCategory(cat)}
            >
              <Text style={[styles.chipText, itemCategory === cat && styles.chipTextActive]}>
                {BUDGET_CATEGORY_LABELS[cat]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.addRow}>
          <TouchableOpacity style={styles.addButton} activeOpacity={0.85} onPress={addItem}>
            <Ionicons name="add" size={18} color={colors.textOnPrimary} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, styles.flex1]}
            placeholder="مثال: عشاء في مطعم صحارى"
            placeholderTextColor={colors.textFaint}
            value={itemLabel}
            onChangeText={setItemLabel}
            onSubmitEditing={addItem}
            textAlign="right"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
          activeOpacity={0.85}
          disabled={!canSubmit}
          onPress={handlePublish}
        >
          <Text style={styles.submitText}>نشر القالب</Text>
        </TouchableOpacity>
        {!canSubmit ? (
          <Text style={styles.hint}>أضف عنوان وعنصر واحد على الأقل عشان تقدر تنشر</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  chipsRow: { flexDirection: 'row-reverse', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: colors.textOnPrimary },
  row: { flexDirection: 'row-reverse', gap: spacing.md },
  rowField: { flex: 1 },
  itemRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  itemText: { color: colors.text, fontSize: 13, textAlign: 'right', flex: 1 },
  itemCategory: { color: colors.textFaint, fontSize: 11 },
  addRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex1: { flex: 1 },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 14 },
  hint: { color: colors.textFaint, fontSize: 11, textAlign: 'center', marginTop: spacing.sm },
});
