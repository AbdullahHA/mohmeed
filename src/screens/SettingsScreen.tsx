import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import Text from '../components/Text';
import { Alert } from '../lib/alert';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, cardShadow, type ThemeColors } from '../theme/colors';
import { useTheme, type ThemeMode } from '../context/ThemeContext';
import { useRegion } from '../context/RegionContext';
import { useAuth } from '../context/AuthContext';
import { useAppState } from '../context/AppState';
import { INTEREST_TAGS } from '../data/destinations';
import PersonAvatar from '../components/PersonAvatar';
import { PreviewCard } from './AppearanceSettingScreen';
import {
  getBiometricLockEnabled,
  isBiometricAvailable,
  setBiometricLockEnabled,
} from '../lib/biometric';
import { getHijriDateEnabled, setHijriDateEnabled } from '../lib/hijriSetting';
import {
  getReminderSettings,
  setReminderEnabled,
  REMINDER_TYPE_LABELS,
  type ReminderType,
} from '../lib/smartReminders';
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
  value?: string;
};

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, deleteAccount, exitGuestMode } = useAuth();
  const { country, currency } = useRegion();
  const { recommendedPlaceIds, followersCount } = useAppState();
  const [deleting, setDeleting] = useState(false);

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(true);
  const [hijriEnabled, setHijriEnabledState] = useState(false);
  const [reminderSettings, setReminderSettingsState] = useState<Record<ReminderType, boolean> | null>(null);

  useEffect(() => {
    (async () => {
      const [available, enabled] = await Promise.all([isBiometricAvailable(), getBiometricLockEnabled()]);
      setBiometricAvailable(available);
      setBiometricEnabled(available && enabled);
      setBiometricLoading(false);
    })();
    getHijriDateEnabled().then(setHijriEnabledState);
    getReminderSettings().then(setReminderSettingsState);
  }, []);

  const handleToggleBiometric = async (value: boolean) => {
    setBiometricEnabled(value);
    await setBiometricLockEnabled(value);
  };

  const handleToggleHijri = async (value: boolean) => {
    setHijriEnabledState(value);
    await setHijriDateEnabled(value);
  };

  const handleToggleReminder = async (type: ReminderType, value: boolean) => {
    setReminderSettingsState((prev) => (prev ? { ...prev, [type]: value } : prev));
    await setReminderEnabled(type, value);
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

  const MenuRow = ({ icon, label, onPress, danger, value }: MenuRowProps) => (
    <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={onPress}>
      <Ionicons name={icon} size={18} color={danger ? colors.red : colors.textMuted} />
      <Text style={[styles.menuRowText, danger && styles.menuRowTextDanger]}>{label}</Text>
      {value ? <Text style={styles.menuRowValue}>{value}</Text> : null}
      <Ionicons name="chevron-back" size={16} color={colors.textFaint} />
    </TouchableOpacity>
  );

  const Divider = () => <View style={styles.divider} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الإعدادات</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {profile ? (
          <>
            <TouchableOpacity
              style={styles.profileCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="chevron-back" size={16} color={colors.textFaint} />
              <View style={styles.profileTextWrap}>
                <Text style={styles.profileName} numberOfLines={1}>{profile.name}</Text>
                <Text style={styles.profileMeta} numberOfLines={1}>تعديل الملف · @{profile.username}</Text>
              </View>
              <PersonAvatar avatarUrl={profile.avatarUrl} size={52} />
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>الحساب</Text>
            <View style={styles.tileRow}>
              <TouchableOpacity style={styles.tile} activeOpacity={0.85} onPress={() => navigation.navigate('SavedPlaces')}>
                <View style={[styles.tileIconWrap, { backgroundColor: colors.accentSoft }]}>
                  <Ionicons name="bookmark-outline" size={18} color={colors.accentDark} />
                </View>
                <Text style={styles.tileValue}>{recommendedPlaceIds.length}</Text>
                <Text style={styles.tileLabel}>مفضلاتي</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tile} activeOpacity={0.85} onPress={() => navigation.navigate('TravelPreferences')}>
                <View style={[styles.tileIconWrap, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="heart-outline" size={18} color={colors.primary} />
                </View>
                <Text style={styles.tileValue}>{profile.interests.length} من {INTEREST_TAGS.length}</Text>
                <Text style={styles.tileLabel}>تفضيلات السفر</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tile}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('FollowList', { userId: profile.id, mode: 'followers' })}
              >
                <View style={[styles.tileIconWrap, { backgroundColor: colors.successSoft }]}>
                  <Ionicons name="eye-outline" size={18} color={colors.successDark} />
                </View>
                <Text style={styles.tileValue}>{followersCount}</Text>
                <Text style={styles.tileLabel}>متابعيني</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>المظهر</Text>
            <View style={styles.appearanceRow}>
              {APPEARANCE_OPTIONS.map((option) => {
                const active = mode === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.appearanceOption}
                    activeOpacity={0.85}
                    onPress={() => setMode(option.value)}
                  >
                    <View style={[styles.appearanceFrame, active && styles.appearanceFrameActive]}>
                      <PreviewCard style={option.value} />
                    </View>
                    <Text style={[styles.appearanceLabel, active && styles.appearanceLabelActive]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>إدارة الحساب</Text>
            <View style={styles.card}>
              <MenuRow icon="person-outline" label="البيانات الشخصية" onPress={() => navigation.navigate('PersonalInfo')} />
              <Divider />
              <MenuRow icon="people-outline" label="أصدقائي" onPress={() => navigation.navigate('Friends')} />
              <Divider />
              <MenuRow icon="wallet-outline" label="محفظتي" onPress={() => navigation.navigate('Wallet')} />
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
          <TouchableOpacity style={styles.guestCard} activeOpacity={0.85} onPress={() => exitGuestMode()}>
            <Ionicons name="chevron-back" size={16} color={colors.primary} />
            <View style={styles.guestCardTextWrap}>
              <Text style={styles.guestCardTitle}>سجّل دخول أو أنشئ حساب</Text>
              <Text style={styles.guestCardSubtitle}>عشان تقدر تعدّل معلومات حسابك وتحفظ بياناتك</Text>
            </View>
            <Ionicons name="log-in-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>التفضيلات</Text>
        <View style={styles.card}>
          <MenuRow
            icon="earth-outline"
            label="البلد"
            value={country.name}
            onPress={() => navigation.navigate('CountrySetting')}
          />
          <Divider />
          <MenuRow
            icon="cash-outline"
            label="عرض العملة"
            value={`${currency.flag} ${currency.code}`}
            onPress={() => navigation.navigate('CurrencySetting')}
          />
          <Divider />
          <MenuRow
            icon="swap-horizontal-outline"
            label="تحويل العملة"
            onPress={() => navigation.navigate('CurrencyConverter')}
          />
          <Divider />
          <View style={styles.switchRow}>
            <Switch
              value={hijriEnabled}
              onValueChange={handleToggleHijri}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
            <View style={styles.switchTextWrap}>
              <Text style={styles.switchLabel}>التاريخ الهجري</Text>
              <Text style={styles.switchHint}>يظهر جنب التاريخ الميلادي في تفاصيل الرحلة</Text>
            </View>
            <Ionicons name="moon-outline" size={18} color={colors.textMuted} />
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

        {profile && reminderSettings ? (
          <>
            <Text style={styles.sectionTitle}>التذكيرات الذكية</Text>
            <View style={styles.card}>
              {(Object.keys(REMINDER_TYPE_LABELS) as ReminderType[]).map((type, index, arr) => (
                <React.Fragment key={type}>
                  <View style={styles.switchRow}>
                    <Switch
                      value={reminderSettings[type]}
                      onValueChange={(v) => handleToggleReminder(type, v)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                    <View style={styles.switchTextWrap}>
                      <Text style={styles.switchLabel}>{REMINDER_TYPE_LABELS[type]}</Text>
                    </View>
                  </View>
                  {index < arr.length - 1 ? <Divider /> : null}
                </React.Fragment>
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>معلومات ومساعدة</Text>
        <View style={styles.card}>
          <MenuRow icon="chatbubbles-outline" label="تواصل مع الدعم" onPress={() => navigation.navigate('Support')} />
          <Divider />
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
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  profileCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...cardShadow,
  },
  profileTextWrap: { flex: 1, alignItems: 'flex-end' },
  profileName: { color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'right' },
  profileMeta: { color: colors.textMuted, fontSize: 12, textAlign: 'right', marginTop: 2 },
  guestCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  guestCardTextWrap: { flex: 1, alignItems: 'flex-end' },
  guestCardTitle: { color: colors.text, fontSize: 14.5, fontWeight: '700', textAlign: 'right' },
  guestCardSubtitle: { color: colors.textMuted, fontSize: 11.5, textAlign: 'right', marginTop: 2, lineHeight: 16 },
  appearanceRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginBottom: spacing.xl },
  appearanceOption: { flex: 1, alignItems: 'center', gap: spacing.xs },
  appearanceFrame: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
    padding: 3,
  },
  appearanceFrameActive: { borderColor: colors.primary },
  appearanceLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  appearanceLabelActive: { color: colors.primary, fontWeight: '700' },
  tileRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginBottom: spacing.xl },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    ...cardShadow,
  },
  tileIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tileValue: { color: colors.text, fontSize: 13, fontWeight: '700' },
  tileLabel: { color: colors.textMuted, fontSize: 10.5, fontWeight: '600' },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: spacing.md,
    marginTop: spacing.xxl,
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
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  menuRowText: { flex: 1, color: colors.text, fontSize: 14.5, fontWeight: '600', textAlign: 'right' },
  menuRowTextDanger: { color: colors.red },
  menuRowValue: { color: colors.textFaint, fontSize: 12 },
  switchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  switchTextWrap: { flex: 1 },
  switchLabel: { color: colors.text, fontSize: 14, fontWeight: '600', textAlign: 'right' },
  switchHint: { color: colors.textFaint, fontSize: 11, textAlign: 'right', marginTop: 2, lineHeight: 16 },
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
