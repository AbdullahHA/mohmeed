import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../theme/colors';
import { useAppState } from '../context/AppState';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function JoinTripScreen() {
  const navigation = useNavigation<Nav>();
  const { trips, currentUser, addMember } = useAppState();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    const trip = trips.find((t) => t.shareCode.toUpperCase() === trimmed);
    if (!trip) {
      setError('ما لقينا رحلة بهذا الرمز. تأكد منه مع اللي أرسل لك الدعوة.');
      return;
    }
    if (!trip.memberIds.includes(currentUser.id)) {
      addMember(trip.id, currentUser.id);
    }
    navigation.replace('TripDetail', { tripId: trip.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الانضمام لرحلة</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.label}>رمز دعوة الرحلة</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: ALULA-8F2K"
          placeholderTextColor={colors.textFaint}
          value={code}
          onChangeText={(text) => {
            setCode(text);
            setError('');
          }}
          autoCapitalize="characters"
          textAlign="right"
          autoFocus
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.note}>
          هذا الرمز تحصله من صديقك اللي شاركه معك من تفاصيل الرحلة. حاليًا البحث يشمل الرحلات
          المخزّنة على جهازك فقط — لما يصير عندنا حساب مشترك بين الأجهزة بيشتغل مباشرة بين أي
          شخصين.
        </Text>

        <TouchableOpacity
          style={[styles.submitButton, !code.trim() && styles.submitDisabled]}
          activeOpacity={0.85}
          disabled={!code.trim()}
          onPress={handleJoin}
        >
          <Text style={styles.submitText}>انضم للرحلة</Text>
        </TouchableOpacity>
      </View>
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
  error: {
    color: colors.red,
    fontSize: 12,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  note: {
    color: colors.textFaint,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
    marginTop: spacing.lg,
  },
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
