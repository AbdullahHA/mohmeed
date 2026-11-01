import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, cardShadow, type ThemeColors } from '../theme/colors';
import { useTheme, type ThemeMode } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  getBiometricLockEnabled,
  isBiometricAvailable,
  setBiometricLockEnabled,
} from '../lib/biometric';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const APPEARANCE_OPTIONS: Array<{ value: ThemeMode; label: string }> = [
  { value: 'system', label: 'تلقائي' },
  { value: 'light', label: 'فاتح' },
  { value: 'dark', label: 'داكن' },
];

type MenuRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
};

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, deleteAccount } = useAuth();
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteAccount = () => {
    Alert.alert(
      'حذف الحساب نهائيًا؟',
      'بيُحذف حسابك وكل بياناتك (رحلاتك، تقييماتك، اهتماماتك، صداقاتك، محادثاتك) بشكل نهائي ولا يمكن التراجع عنه.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف الحساب',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const { error: deleteError } = await deleteAccount();
            setDeleting(false);
            if (deleteError) {
              Alert.alert('صار خطأ', 'تعذّر حذف الحساب، حاول مرة ثانية لاحقًا.');
            }
          },
        },
      ]
    );
  };

  const MenuRow = ({ icon, label, onPress, danger }: MenuRowProps) => (
    <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={onPress}>
      <Ionicons name="chevron-back" size={16} color={colors.textFaint} />
      <Text style={[styles.menuRowText, danger && styles.menuRowTextDanger]}>{label}</Text>
      <Ionicons name={icon} size={18} color={danger ? colors.red : colors.textMuted} />
    </TouchableOpacity>
  );

  const Divider = () => <View style={styles.divider} />;

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
            <Text style={styles.sectionTitle}>إدارة الحساب</Text>
            <View style={styles.card}>
              <MenuRow icon="person-outline" label="البيانات الشخصية" onPress={() => navigation.navigate('PersonalInfo')} />
              <Divider />
              <MenuRow icon="pencil-outline" label="تعديل الملف الشخصي" onPress={() => navigation.navigate('EditProfile')} />
              <Divider />
              <MenuRow icon="people-outline" label="أصدقائي" onPress={() => navigation.navigate('Friends')} />
            </View>

            <Text style={styles.sectionTitle}>الأمان</Text>
            <View style={styles.card}>
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
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.guestNote}>سجّل دخولك عشان تقدر تعدّل معلومات حسابك</Text>
        )}

        <Text style={styles.sectionTitle}>التفضيلات</Text>
        <View style={styles.card}>
          <View style={styles.preferenceBlock}>
            <Text style={styles.preferenceLabel}>المظهر</Text>
            <View style={styles.chipsRow}>
              {APPEARANCE_OPTIONS.map((option) => {
                const active = mode === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.chip, active && styles.chipActive]}
                    activeOpacity={0.85}
                    onPress={() => setMode(option.value)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <Divider />
          <View style={styles.preferenceBlock}>
            <Text style={styles.preferenceLabel}>لغة التطبيق</Text>
            <View style={styles.chipsRow}>
              <View style={[styles.chip, styles.chipActive]}>
                <Text style={[styles.chipText, styles.chipTextActive]}>العربية</Text>
              </View>
              <View style={[styles.chip, styles.chipDisabled]}>
                <Text style={styles.chipTextDisabled}>English — قريبًا</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>معلومات ومساعدة</Text>
        <View style={styles.card}>
          <MenuRow icon="information-circle-outline" label="من نحن" onPress={() => navigation.navigate('About')} />
          <Divider />
          <MenuRow icon="document-text-outline" label="الشروط والأحكام" onPress={() => navigation.navigate('Terms')} />
          <Divider />
          <MenuRow icon="shield-checkmark-outline" label="سياسة الخصوصية" onPress={() => navigation.navigate('PrivacyPolicy')} />
        </View>

        {profile ? (
          <>
            <Text style={styles.sectionTitle}>الخصوصية والأمور القانونية</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={handleDeleteAccount} disabled={deleting}>
                {deleting ? (
                  <ActivityIndicator color={colors.red} style={{ flex: 1 }} />
                ) : (
                  <>
                    <Ionicons name="chevron-back" size={16} color={colors.textFaint} />
                    <Text style={[styles.menuRowText, styles.menuRowTextDanger]}>حذف الحساب نهائيًا</Text>
                    <Ionicons name="trash-outline" size={18} color={colors.red} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : null}
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
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...cardShadow,
  },
  divider: { height: 1, backgroundColor: colors.border },
  menuRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  menuRowText: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600', textAlign: 'right' },
  menuRowTextDanger: { color: colors.red },
  switchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  switchTextWrap: { flex: 1 },
  switchLabel: { color: colors.text, fontSize: 14, fontWeight: '600', textAlign: 'right' },
  switchHint: { color: colors.textFaint, fontSize: 11, textAlign: 'right', marginTop: 2, lineHeight: 16 },
  guestNote: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: spacing.lg, lineHeight: 20 },
  preferenceBlock: { padding: spacing.lg },
  preferenceLabel: { color: colors.text, fontSize: 14, fontWeight: '600', textAlign: 'right', marginBottom: spacing.sm },
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
});
