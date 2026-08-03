import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TopBar from '../components/TopBar';
import TripCard from '../components/TripCard';
import EmptyState from '../components/EmptyState';
import { colors, radius, spacing } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { trips, addTrip, type Trip } from '../data/trips';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const emptyForm = { title: '', destination: '', startDate: '', endDate: '', budget: '' };

export default function TripsScreen() {
  const navigation = useNavigation<Nav>();
  const [tripsList, setTripsList] = useState<Trip[]>(trips);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const canSubmit = form.title.trim().length > 0 && form.destination.trim().length > 0;

  const createTrip = () => {
    if (!canSubmit) return;
    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      title: form.title.trim(),
      destination: form.destination.trim(),
      startDate: form.startDate.trim() || '—',
      endDate: form.endDate.trim() || '—',
      budgetTotal: Number(form.budget) || 0,
      currency: 'ر.س',
      friends: [],
      itinerary: [],
      budgetBreakdown: [],
    };
    addTrip(newTrip);
    setTripsList([...trips]);
    setForm(emptyForm);
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="رحلاتي" subtitle="أهلاً بك، خطط رحلتك القادمة" />

      <TouchableOpacity
        style={styles.newTripButton}
        activeOpacity={0.85}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={18} color={colors.onPrimary} />
        <Text style={styles.newTripText}>رحلة جديدة</Text>
      </TouchableOpacity>

      <FlatList
        data={tripsList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TripCard trip={item} onPress={() => navigation.navigate('TripDetail', { tripId: item.id })} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="airplane-outline"
            title="لا توجد رحلات مخططة بعد"
            subtitle="أنشئ أول رحلة وابدأ التخطيط مع أصدقائك."
          />
        }
      />

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>رحلة جديدة</Text>
            </View>

            <Text style={styles.fieldLabel}>اسم الرحلة</Text>
            <TextInput
              style={styles.input}
              placeholder="صيف مع الشباب"
              placeholderTextColor={colors.textFaint}
              value={form.title}
              onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
              textAlign="right"
            />

            <Text style={styles.fieldLabel}>الوجهة</Text>
            <TextInput
              style={styles.input}
              placeholder="تبليسي، جورجيا"
              placeholderTextColor={colors.textFaint}
              value={form.destination}
              onChangeText={(v) => setForm((f) => ({ ...f, destination: v }))}
              textAlign="right"
            />

            <View style={styles.rowFields}>
              <View style={styles.rowField}>
                <Text style={styles.fieldLabel}>من</Text>
                <TextInput
                  style={styles.input}
                  placeholder="١٢ أغسطس"
                  placeholderTextColor={colors.textFaint}
                  value={form.startDate}
                  onChangeText={(v) => setForm((f) => ({ ...f, startDate: v }))}
                  textAlign="right"
                />
              </View>
              <View style={styles.rowField}>
                <Text style={styles.fieldLabel}>إلى</Text>
                <TextInput
                  style={styles.input}
                  placeholder="١٦ أغسطس"
                  placeholderTextColor={colors.textFaint}
                  value={form.endDate}
                  onChangeText={(v) => setForm((f) => ({ ...f, endDate: v }))}
                  textAlign="right"
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>الميزانية (ر.س)</Text>
            <TextInput
              style={styles.input}
              placeholder="8000"
              placeholderTextColor={colors.textFaint}
              value={form.budget}
              onChangeText={(v) => setForm((f) => ({ ...f, budget: v.replace(/[^0-9]/g, '') }))}
              keyboardType="number-pad"
              textAlign="right"
            />

            <TouchableOpacity
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
              activeOpacity={0.85}
              onPress={createTrip}
              disabled={!canSubmit}
            >
              <Text style={styles.submitText}>إنشاء الرحلة</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  newTripButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  newTripText: {
    color: colors.onPrimary,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  list: {
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.semiBold,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontFamily: fonts.regular,
    marginBottom: spacing.md,
  },
  rowFields: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  rowField: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: colors.onPrimary,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
});
