import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
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

const STATUS_LABEL = { pending: 'قيد المراجعة', approved: 'تمت الموافقة ✓', rejected: 'مرفوض' } as const;

export default function CommunityRequestScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { communityRequests, submitCommunityRequest } = useAppState();
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [emoji, setEmoji] = useState('🧭');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasPending = communityRequests.some((r) => r.status === 'pending');

  const handleSubmit = async () => {
    if (!name.trim() || !tagline.trim() || !reason.trim() || submitting) return;
    setSubmitting(true);
    const { error } = await submitCommunityRequest({ name, tagline, emoji, reason });
    setSubmitting(false);
    if (error) {
      Alert.alert('تعذّر إرسال الطلب', error);
      return;
    }
    setName('');
    setTagline('');
    setEmoji('🧭');
    setReason('');
    Alert.alert('تم إرسال الطلب', 'راح نراجع طلبك ونرد عليك قريبًا');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>اطلب إنشاء مجتمع</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.intro}>
          يراجع فريق «يلا نسافر» طلبك. إذا تمت الموافقة، راح تصير مشرف المجتمع الجديد.
        </Text>

        {communityRequests.length > 0 ? (
          <View style={styles.requestsList}>
            {communityRequests.map((r) => (
              <View key={r.id} style={styles.requestRow}>
                <Text style={styles.requestEmoji}>{r.emoji}</Text>
                <Text style={styles.requestName} numberOfLines={1}>{r.name}</Text>
                <Text
                  style={[
                    styles.requestStatus,
                    r.status === 'approved' && styles.requestStatusApproved,
                    r.status === 'rejected' && styles.requestStatusRejected,
                  ]}
                >
                  {STATUS_LABEL[r.status]}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {hasPending ? (
          <View style={styles.pendingNotice}>
            <Text style={styles.pendingNoticeText}>عندك طلب قيد المراجعة حاليًا. راح نرد عليك قبل ما تقدر ترسل طلب جديد.</Text>
          </View>
        ) : (
          <>
            <Field label="اسم المجتمع">
              <TextInput style={styles.input} value={name} onChangeText={setName} textAlign="right" />
            </Field>
            <Field label="وصف قصير">
              <TextInput style={styles.input} value={tagline} onChangeText={setTagline} textAlign="right" />
            </Field>
            <Field label="إيموجي">
              <TextInput style={styles.input} value={emoji} onChangeText={setEmoji} textAlign="right" />
            </Field>
            <Field label="ليش تبي تنشئ هذا المجتمع؟">
              <TextInput
                style={[styles.input, styles.multiline]}
                value={reason}
                onChangeText={setReason}
                textAlign="right"
                multiline
              />
            </Field>

            <TouchableOpacity
              style={[styles.submitButton, (!name.trim() || !tagline.trim() || !reason.trim()) && styles.submitDisabled]}
              disabled={!name.trim() || !tagline.trim() || !reason.trim() || submitting}
              onPress={handleSubmit}
              activeOpacity={0.85}
            >
              {submitting ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={styles.submitText}>إرسال الطلب</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={{ fontSize: 12, fontWeight: '700', textAlign: 'right', marginBottom: spacing.xs }}>{label}</Text>
      {children}
    </View>
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
  },
  headerTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  intro: { color: colors.textMuted, fontSize: 12, textAlign: 'right', lineHeight: 18, marginBottom: spacing.lg },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 14,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: colors.textOnPrimary, fontSize: 14, fontWeight: '700' },
  requestsList: { marginBottom: spacing.lg, gap: spacing.sm },
  requestRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  requestEmoji: { fontSize: 16 },
  requestName: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  requestStatus: { color: colors.accentDark, fontSize: 11, fontWeight: '700' },
  requestStatusApproved: { color: colors.success },
  requestStatusRejected: { color: colors.red },
  pendingNotice: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  pendingNoticeText: { color: colors.accentDark, fontSize: 12, textAlign: 'right', lineHeight: 18 },
});
