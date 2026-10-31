import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme, type ThemeMode } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  getBiometricLockEnabled,
  isBiometricAvailable,
  setBiometricLockEnabled,
} from '../lib/biometric';
import CountryPickerModal from '../components/CountryPickerModal';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const APPEARANCE_OPTIONS: Array<{ value: ThemeMode; label: string }> = [
  { value: 'system', label: 'تلقائي' },
  { value: 'light', label: 'فاتح' },
  { value: 'dark', label: 'داكن' },
];

const TITLE_OPTIONS = ['السيد', 'السيدة'];
const GENDER_OPTIONS = ['ذكر', 'أنثى'];
const MARITAL_OPTIONS = ['أعزب', 'متزوج', 'مطلّق', 'أرمل'];

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, updateProfile } = useAuth();

  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [title, setTitle] = useState(profile?.title ?? '');
  const [firstName, setFirstName] = useState(profile?.firstName ?? '');
  const [lastName, setLastName] = useState(profile?.lastName ?? '');
  const [gender, setGender] = useState(profile?.gender ?? '');
  const [birthDate, setBirthDate] = useState<Date | null>(
    profile?.birthDate ? new Date(profile.birthDate) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [nationality, setNationality] = useState(profile?.nationality ?? '');
  const [countryOfResidence, setCountryOfResidence] = useState(profile?.countryOfResidence ?? '');
  const [pickerOpen, setPickerOpen] = useState<'nationality' | 'residence' | null>(null);
  const [maritalStatus, setMaritalStatus] = useState(profile?.maritalStatus ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedTick, setSavedTick] = useState(false);

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [available, enabled] = await Promise.all([isBiometricAvailable(), getBiometricLockEnabled()]);
      setBiometricAvailable(available);
      setBiometricEnabled(available && enabled);
      setBiometricLoading(false);
    })();
  }, []);

  const handleToggleBiometric = async (value: boolean) => {
    setBiometricEnabled(value);
    await setBiometricLockEnabled(value);
  };

  const handleSaveInfo = async () => {
    if (!profile || saving) return;
    setSaving(true);
    setSaveError(null);
    setSavedTick(false);
    const { error } = await updateProfile({
      phone: phone.trim() || null,
      title: title || null,
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      gender: gender || null,
      birth_date: birthDate ? formatDate(birthDate) : null,
      nationality: nationality.trim() || null,
      country_of_residence: countryOfResidence.trim() || null,
      marital_status: maritalStatus || null,
    });
    setSaving(false);
    if (error) {
      setSaveError('تعذّر الحفظ، حاول مرة ثانية');
      return;
    }
    setSavedTick(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الإعدادات</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {profile ? (
          <>
            <Text style={styles.sectionTitle}>معلومات الحساب</Text>

            <Text style={styles.label}>البريد الإلكتروني</Text>
            <View style={styles.readonlyRow}>
              <Text style={styles.readonlyText}>{profile.email ?? '—'}</Text>
            </View>

            <Text style={styles.label}>رقم الجوال</Text>
            <TextInput
              style={styles.input}
              placeholder="05xxxxxxxx"
              placeholderTextColor={colors.textFaint}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              textAlign="right"
            />

            <Text style={styles.label}>اللقب</Text>
            <View style={styles.chipsRow}>
              {TITLE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.chip, title === option && styles.chipActive]}
                  activeOpacity={0.8}
                  onPress={() => setTitle(title === option ? '' : option)}
                >
                  <Text style={[styles.chipText, title === option && styles.chipTextActive]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>الاسم الأول</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={colors.textFaint}
              value={firstName}
              onChangeText={setFirstName}
              textAlign="right"
            />

            <Text style={styles.label}>اسم العائلة</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={colors.textFaint}
              value={lastName}
              onChangeText={setLastName}
              textAlign="right"
            />

            <Text style={styles.label}>الجنس</Text>
            <View style={styles.chipsRow}>
              {GENDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.chip, gender === option && styles.chipActive]}
                  activeOpacity={0.8}
                  onPress={() => setGender(gender === option ? '' : option)}
                >
                  <Text style={[styles.chipText, gender === option && styles.chipTextActive]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>تاريخ الميلاد</Text>
            <TouchableOpacity style={styles.input} activeOpacity={0.8} onPress={() => setShowDatePicker(true)}>
              <Text style={birthDate ? styles.dateValue : styles.datePlaceholder}>
                {birthDate ? formatDate(birthDate) : 'اختر التاريخ'}
              </Text>
            </TouchableOpacity>
            {showDatePicker ? (
              <DateTimePicker
                value={birthDate ?? new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                locale="ar"
                maximumDate={new Date()}
                onChange={(_event, selected) => {
                  if (Platform.OS === 'android') setShowDatePicker(false);
                  if (selected) setBirthDate(selected);
                }}
              />
            ) : null}
            {showDatePicker && Platform.OS === 'ios' ? (
              <TouchableOpacity style={styles.pickerDoneButton} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.pickerDoneText}>تم</Text>
              </TouchableOpacity>
            ) : null}

            <Text style={styles.label}>الجنسية</Text>
            <TouchableOpacity style={styles.input} activeOpacity={0.8} onPress={() => setPickerOpen('nationality')}>
              <Text style={nationality ? styles.dateValue : styles.datePlaceholder}>
                {nationality || 'اختر الجنسية'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>بلد الإقامة</Text>
            <TouchableOpacity style={styles.input} activeOpacity={0.8} onPress={() => setPickerOpen('residence')}>
              <Text style={countryOfResidence ? styles.dateValue : styles.datePlaceholder}>
                {countryOfResidence || 'اختر بلد الإقامة'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>الحالة الاجتماعية</Text>
            <View style={styles.chipsRow}>
              {MARITAL_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.chip, maritalStatus === option && styles.chipActive]}
                  activeOpacity={0.8}
                  onPress={() => setMaritalStatus(maritalStatus === option ? '' : option)}
                >
                  <Text style={[styles.chipText, maritalStatus === option && styles.chipTextActive]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
            {savedTick ? <Text style={styles.savedText}>تم الحفظ ✓</Text> : null}

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              activeOpacity={0.85}
              disabled={saving}
              onPress={handleSaveInfo}
            >
              {saving ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={styles.saveButtonText}>حفظ المعلومات</Text>}
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>الأمان</Text>
            <View style={styles.switchRow}>
              <Switch
                value={biometricEnabled}
                onValueChange={handleToggleBiometric}
                disabled={biometricLoading || !biometricAvailable}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
              <View style={styles.switchTextWrap}>
                <Text style={styles.switchLabel}>تفعيل بصمة الوجه / الإصبع</Text>
                {!biometricLoading && !biometricAvailable ? (
                  <Text style={styles.switchHint}>جهازك ما يدعم بصمة الوجه أو الإصبع، أو ما فيه بصمة مسجّلة</Text>
                ) : (
                  <Text style={styles.switchHint}>يطلب فتح قفل جهازك كل ما تفتح التطبيق</Text>
                )}
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.guestNote}>سجّل دخولك عشان تقدر تعدّل معلومات حسابك</Text>
        )}

        <Text style={styles.sectionTitle}>المظهر</Text>
        <View style={styles.appearanceRow}>
          {APPEARANCE_OPTIONS.map((option) => {
            const active = mode === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.appearanceChip, active && styles.appearanceChipActive]}
                activeOpacity={0.85}
                onPress={() => setMode(option.value)}
              >
                <Text style={[styles.appearanceChipText, active && styles.appearanceChipTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>لغة التطبيق</Text>
        <View style={styles.chipsRow}>
          <View style={[styles.chip, styles.chipActive]}>
            <Text style={[styles.chipText, styles.chipTextActive]}>العربية</Text>
          </View>
          <View style={[styles.chip, styles.chipDisabled]}>
            <Text style={styles.chipTextDisabled}>English — قريبًا</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>معلومات</Text>
        <TouchableOpacity style={styles.linkRow} activeOpacity={0.8} onPress={() => navigation.navigate('About')}>
          <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
          <Text style={styles.linkRowText}>من نحن</Text>
          <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} activeOpacity={0.8} onPress={() => navigation.navigate('Terms')}>
          <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
          <Text style={styles.linkRowText}>الشروط والأحكام</Text>
          <Ionicons name="document-text-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} activeOpacity={0.8} onPress={() => navigation.navigate('PrivacyPolicy')}>
          <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
          <Text style={styles.linkRowText}>سياسة الخصوصية</Text>
          <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>

      <CountryPickerModal
        visible={pickerOpen !== null}
        title={pickerOpen === 'nationality' ? 'اختر الجنسية' : 'اختر بلد الإقامة'}
        onSelect={(country) => {
          if (pickerOpen === 'nationality') setNationality(country);
          else if (pickerOpen === 'residence') setCountryOfResidence(country);
        }}
        onClose={() => setPickerOpen(null)}
      />
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
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
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
  readonlyRow: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  readonlyText: { color: colors.textMuted, fontSize: 14, textAlign: 'right' },
  dateValue: { color: colors.text, fontSize: 14, textAlign: 'right' },
  datePlaceholder: { color: colors.textFaint, fontSize: 14, textAlign: 'right' },
  pickerDoneButton: { alignSelf: 'flex-end', paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  pickerDoneText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  chipsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: colors.textOnPrimary },
  chipDisabled: { backgroundColor: colors.surfaceAlt, opacity: 0.7 },
  chipTextDisabled: { color: colors.textFaint, fontSize: 13, fontWeight: '600' },
  error: { color: colors.red, fontSize: 12, textAlign: 'right', marginTop: spacing.md },
  savedText: { color: colors.success, fontSize: 12, fontWeight: '700', textAlign: 'right', marginTop: spacing.md },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 14 },
  switchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  switchTextWrap: { flex: 1 },
  switchLabel: { color: colors.text, fontSize: 14, fontWeight: '600', textAlign: 'right' },
  switchHint: { color: colors.textFaint, fontSize: 11, textAlign: 'right', marginTop: 2, lineHeight: 16 },
  guestNote: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: spacing.lg, lineHeight: 20 },
  appearanceRow: { flexDirection: 'row-reverse', gap: spacing.sm },
  appearanceChip: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
  },
  appearanceChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  appearanceChipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  appearanceChipTextActive: { color: colors.textOnPrimary },
  linkRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  linkRowText: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600', textAlign: 'right' },
});
