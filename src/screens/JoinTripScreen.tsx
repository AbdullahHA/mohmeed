import React, { useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  type TextInputInstance,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fontSize, radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { heroDestination } from '../data/destinations';
import { formatTripDateRange } from '../lib/tripDates';
import type { RootStackParamList } from '../navigation/types';
import type { TripPreview } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CODE_LENGTH = 8;

export default function JoinTripScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { joinTripByCode, previewTripByCode } = useAppState();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<TripPreview | null>(null);
  const [looking, setLooking] = useState(false);
  const [joining, setJoining] = useState(false);
  const boxRefs = useRef<Array<TextInputInstance | null>>([]);

  const code = digits.join('');

  const lookUp = async (fullCode: string) => {
    setLooking(true);
    setError('');
    setPreview(null);
    const { preview: found, error: lookupError } = await previewTripByCode(fullCode);
    setLooking(false);
    if (lookupError || !found) {
      setError(lookupError ?? 'ما لقينا رحلة بهذا الرمز');
      return;
    }
    setPreview(found);
  };

  const handleChangeDigit = (index: number, raw: string) => {
    const value = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setPreview(null);
    setError('');
    if (value && index < CODE_LENGTH - 1) {
      boxRefs.current[index + 1]?.focus();
    }
    const joined = next.join('');
    if (joined.length === CODE_LENGTH) {
      lookUp(joined);
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      boxRefs.current[index - 1]?.focus();
    }
  };

  const handleJoin = async () => {
    if (!preview || joining) return;
    if (preview.alreadyMember) {
      navigation.replace('TripDetail', { tripId: preview.tripId });
      return;
    }
    setJoining(true);
    const { tripId, error: joinError } = await joinTripByCode(code);
    setJoining(false);
    if (joinError || !tripId) {
      setError(joinError ?? 'ما قدرنا نضمك للرحلة، جرّب مرة ثانية');
      return;
    }
    navigation.replace('TripDetail', { tripId });
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

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.body}>
          {looking ? (
            <View style={styles.lookingCard}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : preview ? (
            <View style={styles.previewCard}>
              <Text style={styles.previewInvite}>
                <Text style={styles.previewInviteName}>{preview.ownerName}</Text> دعاك تنضم لرحلته
              </Text>
              <Image
                source={preview.coverImageUrl ? { uri: preview.coverImageUrl } : heroDestination.image}
                style={styles.previewImage}
              />
              <View style={styles.previewInfo}>
                <Text style={styles.previewTitle}>{preview.title}</Text>
                <View style={styles.previewMetaRow}>
                  {preview.startDate !== '—' ? (
                    <View style={styles.previewMetaChip}>
                      <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                      <Text style={styles.previewMetaText}>
                        {formatTripDateRange(preview.startDate, preview.endDate)}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.previewMetaChip}>
                    <Ionicons name="people-outline" size={13} color={colors.textMuted} />
                    <Text style={styles.previewMetaText}>{preview.memberCount} أعضاء</Text>
                  </View>
                  {preview.itineraryCount > 0 ? (
                    <View style={styles.previewMetaChip}>
                      <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                      <Text style={styles.previewMetaText}>{preview.itineraryCount} مكان بالجدول</Text>
                    </View>
                  ) : null}
                </View>
                {preview.memberNames.length > 0 ? (
                  <Text style={styles.previewMembers}>{preview.memberNames.join('، ')}</Text>
                ) : null}
              </View>
            </View>
          ) : (
            <Text style={styles.label}>رمز دعوة الرحلة</Text>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {!preview ? (
            <>
              <Text style={styles.hint}>أو اكتب رمز الدعوة</Text>
              <View style={styles.codeRow}>
                {digits.map((d, i) => (
                  <TextInput
                    key={i}
                    ref={(r) => {
                      boxRefs.current[i] = r;
                    }}
                    style={[styles.codeBox, d && styles.codeBoxFilled]}
                    value={d}
                    onChangeText={(t) => handleChangeDigit(i, t)}
                    onKeyPress={(e) => handleKeyPress(i, e.nativeEvent.key)}
                    maxLength={1}
                    autoCapitalize="characters"
                    textAlign="center"
                    autoFocus={i === 0}
                  />
                ))}
              </View>
              <Text style={styles.note}>هذا الرمز تحصله من صديقك اللي شاركه معك من تفاصيل الرحلة.</Text>
            </>
          ) : null}

          {preview ? (
            <>
              {preview.alreadyMember ? (
                <Text style={styles.note}>أنت عضو في هذي الرحلة بالفعل.</Text>
              ) : null}
              <TouchableOpacity style={styles.submitButton} activeOpacity={0.85} disabled={joining} onPress={handleJoin}>
                {joining ? (
                  <ActivityIndicator color={colors.textOnPrimary} />
                ) : (
                  <Text style={styles.submitText}>{preview.alreadyMember ? 'افتح الرحلة' : 'انضم للرحلة'}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setPreview(null);
                  setDigits(Array(CODE_LENGTH).fill(''));
                  setError('');
                  setTimeout(() => boxRefs.current[0]?.focus(), 50);
                }}
              >
                <Text style={styles.changeCodeText}>رمز ثاني</Text>
              </TouchableOpacity>
              <Text style={styles.note}>تقدر تطلع من الرحلة بأي وقت.</Text>
            </>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700' },
  body: { padding: spacing.lg },
  label: { color: colors.textMuted, fontSize: fontSize.body, fontWeight: '600', textAlign: 'right', marginBottom: spacing.xs },
  hint: { color: colors.textMuted, fontSize: fontSize.base, fontWeight: '600', textAlign: 'center', marginTop: spacing.lg, marginBottom: spacing.sm },
  codeRow: { flexDirection: 'row-reverse', gap: spacing.xs, justifyContent: 'center' },
  codeBox: {
    width: 38,
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },
  codeBoxFilled: { borderColor: colors.primary },
  error: {
    color: colors.red,
    fontSize: fontSize.base,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  note: {
    color: colors.textFaint,
    fontSize: fontSize.base,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  lookingCard: { alignItems: 'center', paddingVertical: spacing.xl },
  previewCard: { marginBottom: spacing.sm },
  previewInvite: { color: colors.text, fontSize: fontSize.bodyLg, textAlign: 'center', marginBottom: spacing.md },
  previewInviteName: { fontWeight: '700' },
  previewImage: { width: '100%', height: 140, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  previewInfo: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 0,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
    padding: spacing.md,
    marginTop: -2,
  },
  previewTitle: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700', textAlign: 'right' },
  previewMetaRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  previewMetaChip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  previewMetaText: { color: colors.textMuted, fontSize: fontSize.base },
  previewMembers: { color: colors.textFaint, fontSize: fontSize.small, textAlign: 'right', marginTop: spacing.sm },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  submitText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: fontSize.bodyLg },
  changeCodeText: { color: colors.primary, fontSize: fontSize.body, fontWeight: '600', textAlign: 'center', marginTop: spacing.md },
});
