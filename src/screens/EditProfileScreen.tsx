import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { sanitizeUsernameInput, isValidUsername, USERNAME_RULE_MESSAGE } from '../lib/username';
import { pickAndUploadAvatar } from '../lib/avatar';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const AVATAR_EMOJIS = ['🧳', '✈️', '🌍', '🏖️', '🏔️', '🧭', '📷', '☕', '🚗', '⛺', '🗺️', '🌴'];
const AVATAR_COLORS = [
  '#1359D3', '#F98824', '#2E9E6B', '#CC701E',
  '#7C5CFC', '#17A9A0', '#D6487C', '#5C6B7E',
];

export default function EditProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, updateProfile, deleteAccount } = useAuth();

  const [name, setName] = useState(profile?.name ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [emoji, setEmoji] = useState(profile?.emoji ?? '🧳');
  const [color, setColor] = useState(profile?.color ?? AVATAR_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Picking/removing a photo only stages it locally — it isn't written to
  // the profile until "حفظ" is pressed, same as the other fields below.
  const handlePickAvatar = async () => {
    if (!profile || avatarUploading) return;
    setAvatarError(null);
    setAvatarUploading(true);
    try {
      const url = await pickAndUploadAvatar(profile.id);
      if (url) setAvatarUrl(url);
    } catch {
      setAvatarError('تعذّر رفع الصورة، حاول مرة ثانية');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarError(null);
    setAvatarUrl(null);
  };

  const hasChanges =
    name.trim() !== profile?.name ||
    username.trim() !== profile?.username ||
    emoji !== profile?.emoji ||
    color !== profile?.color ||
    avatarUrl !== (profile?.avatarUrl ?? null);

  const handleSave = async () => {
    if (!name.trim() || !username.trim() || loading || !hasChanges) return;
    if (!isValidUsername(username.trim())) {
      setError(USERNAME_RULE_MESSAGE);
      return;
    }
    setError(null);
    setLoading(true);
    const { error: saveError } = await updateProfile({
      name: name.trim(),
      username: username.trim(),
      emoji,
      color,
      avatar_url: avatarUrl,
    });
    setLoading(false);
    if (saveError) {
      setError(saveError === 'username taken' ? 'اسم المستخدم هذا مستخدم بالفعل' : 'صار خطأ، حاول مرة ثانية');
      return;
    }
    navigation.goBack();
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تعديل الملف الشخصي</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <TouchableOpacity activeOpacity={0.85} onPress={handlePickAvatar} disabled={avatarUploading}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarPhoto} />
          ) : (
            <View style={[styles.avatarPreview, { backgroundColor: color }]}>
              <Text style={styles.avatarPreviewEmoji}>{emoji}</Text>
            </View>
          )}
          <View style={styles.avatarCameraBadge}>
            {avatarUploading ? (
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
            ) : (
              <Ionicons name="camera" size={14} color={colors.textOnPrimary} />
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>اضغط على الصورة عشان ترفع صورة من الاستوديو</Text>
        {avatarUrl ? (
          <TouchableOpacity activeOpacity={0.7} onPress={handleRemoveAvatar} disabled={avatarUploading}>
            <Text style={styles.avatarRemoveLink}>إزالة الصورة والرجوع للأيقونة</Text>
          </TouchableOpacity>
        ) : null}
        {avatarError ? <Text style={styles.error}>{avatarError}</Text> : null}

        <Text style={styles.label}>الاسم</Text>
        <TextInput
          style={styles.input}
          placeholder="اسمك"
          placeholderTextColor={colors.textFaint}
          value={name}
          onChangeText={setName}
          textAlign="right"
        />

        <Text style={styles.label}>اسم المستخدم</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: abdullah_s"
          placeholderTextColor={colors.textFaint}
          value={username}
          onChangeText={(v) => setUsername(sanitizeUsernameInput(v))}
          autoCapitalize="none"
          textAlign="left"
        />
        <Text style={styles.usernameHint}>{USERNAME_RULE_MESSAGE}</Text>

        <Text style={styles.label}>الأيقونة</Text>
        <View style={styles.emojiGrid}>
          {AVATAR_EMOJIS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.emojiOption, emoji === option && styles.emojiOptionActive]}
              activeOpacity={0.8}
              onPress={() => setEmoji(option)}
            >
              <Text style={styles.emojiOptionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>اللون</Text>
        <View style={styles.colorRow}>
          {AVATAR_COLORS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.colorOption,
                { backgroundColor: option },
                color === option && styles.colorOptionActive,
              ]}
              activeOpacity={0.8}
              onPress={() => setColor(option)}
            />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.submitButton, (!name.trim() || !username.trim() || !hasChanges || loading) && styles.submitDisabled]}
          activeOpacity={0.85}
          disabled={!name.trim() || !username.trim() || !hasChanges || loading}
          onPress={handleSave}
        >
          {loading ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={styles.submitText}>حفظ</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          activeOpacity={0.8}
          disabled={deleting}
          onPress={handleDeleteAccount}
        >
          {deleting ? (
            <ActivityIndicator color={colors.red} />
          ) : (
            <Text style={styles.deleteButtonText}>حذف الحساب نهائيًا</Text>
          )}
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
  avatarPreview: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  avatarPreviewEmoji: { fontSize: 36 },
  avatarPhoto: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: spacing.xl,
    left: '50%',
    marginLeft: 20,
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: { color: colors.textFaint, fontSize: 11, textAlign: 'center', marginTop: -spacing.lg, marginBottom: spacing.sm },
  avatarRemoveLink: { color: colors.red, fontSize: 12, fontWeight: '600', textAlign: 'center', marginBottom: spacing.sm },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
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
  emojiGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emojiOption: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiOptionActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primarySoft,
  },
  emojiOptionText: { fontSize: 20 },
  colorRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionActive: {
    borderColor: colors.text,
  },
  usernameHint: { color: colors.textFaint, fontSize: 11, textAlign: 'right', marginTop: spacing.xs, lineHeight: 16 },
  error: { color: colors.red, fontSize: 12, textAlign: 'right', marginTop: spacing.lg },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 14 },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
  },
  deleteButtonText: { color: colors.red, fontSize: 13, fontWeight: '700' },
});
