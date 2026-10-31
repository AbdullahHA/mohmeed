import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useContent } from '../context/ContentContext';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'CreateTrip'>;

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function CreateTripScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { friends, createTrip } = useAppState();
  const { destinations } = useContent();

  const preselectedDestinationId = route.params?.destinationId;
  const initialDestinationId =
    preselectedDestinationId && destinations.some((d) => d.id === preselectedDestinationId)
      ? preselectedDestinationId
      : destinations[0].id;

  const [title, setTitle] = useState('');
  const [destinationId, setDestinationId] = useState(initialDestinationId);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
  const [budgetTotal, setBudgetTotal] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  const selectedDestination = destinations.find((d) => d.id === destinationId) ?? destinations[0];

  const toggleFriend = (id: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const canSubmit = title.trim().length > 0;

  const handleCreate = () => {
    if (!canSubmit) return;
    const trip = createTrip({
      title: title.trim(),
      destination: selectedDestination.name,
      coverImage: selectedDestination.image,
      startDate: startDate ? formatDate(startDate) : '—',
      endDate: endDate ? formatDate(endDate) : '—',
      memberIds: selectedFriendIds,
      budgetTotal: Math.max(0, Number(budgetTotal) || 0),
    });
    navigation.replace('TripDetail', { tripId: trip.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>رحلة جديدة</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>اسم الرحلة</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: رحلة العلا مع الشلة"
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
              <Text style={[styles.chipText, destinationId === d.id && styles.chipTextActive]}>
                {d.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text style={styles.label}>تاريخ العودة</Text>
            <TouchableOpacity
              style={styles.input}
              activeOpacity={0.8}
              onPress={() => setActivePicker('end')}
            >
              <Text style={endDate ? styles.dateValue : styles.datePlaceholder}>
                {endDate ? formatDate(endDate) : 'اختر التاريخ'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dateField}>
            <Text style={styles.label}>تاريخ البداية</Text>
            <TouchableOpacity
              style={styles.input}
              activeOpacity={0.8}
              onPress={() => setActivePicker('start')}
            >
              <Text style={startDate ? styles.dateValue : styles.datePlaceholder}>
                {startDate ? formatDate(startDate) : 'اختر التاريخ'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {activePicker ? (
          <DateTimePicker
            value={(activePicker === 'start' ? startDate : endDate) ?? new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            locale="ar"
            minimumDate={activePicker === 'end' && startDate ? startDate : undefined}
            onChange={(_event, selected) => {
              if (Platform.OS === 'android') setActivePicker(null);
              if (!selected) return;
              if (activePicker === 'start') {
                setStartDate(selected);
                if (endDate && endDate < selected) setEndDate(selected);
              } else {
                setEndDate(selected);
              }
            }}
          />
        ) : null}

        {activePicker && Platform.OS === 'ios' ? (
          <TouchableOpacity style={styles.pickerDoneButton} onPress={() => setActivePicker(null)}>
            <Text style={styles.pickerDoneText}>تم</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.label}>الميزانية التقديرية (ريال)</Text>
        <TextInput
          style={styles.input}
          placeholder="5000"
          placeholderTextColor={colors.textFaint}
          value={budgetTotal}
          onChangeText={setBudgetTotal}
          keyboardType="numeric"
          textAlign="right"
        />

        <Text style={styles.label}>ادعُ أصدقاءك</Text>
        <View style={styles.friendsList}>
          {friends.map((friend) => {
            const selected = selectedFriendIds.includes(friend.id);
            return (
              <TouchableOpacity
                key={friend.id}
                style={[styles.friendRow, selected && styles.friendRowActive]}
                activeOpacity={0.8}
                onPress={() => toggleFriend(friend.id)}
              >
                <View style={[styles.friendAvatar, { backgroundColor: friend.color }]}>
                  <Text style={styles.friendEmoji}>{friend.emoji}</Text>
                </View>
                <Text style={styles.friendName}>{friend.name}</Text>
                <Ionicons
                  name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={selected ? colors.primary : colors.textFaint}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
          activeOpacity={0.85}
          disabled={!canSubmit}
          onPress={handleCreate}
        >
          <Text style={styles.submitText}>إنشاء الرحلة</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
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
  dateValue: { color: colors.text, fontSize: 14, textAlign: 'right' },
  datePlaceholder: { color: colors.textFaint, fontSize: 14, textAlign: 'right' },
  pickerDoneButton: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  pickerDoneText: { color: colors.textOnPrimary, fontSize: 13, fontWeight: '700' },
  chipsRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.textOnPrimary,
  },
  dateRow: {
    flexDirection: 'row-reverse',
    gap: spacing.md,
  },
  dateField: {
    flex: 1,
  },
  friendsList: {
    gap: spacing.sm,
  },
  friendRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  friendRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  friendAvatar: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendEmoji: {
    fontSize: 15,
  },
  friendName: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: colors.textOnPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
});
