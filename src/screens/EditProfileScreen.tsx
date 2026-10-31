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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';

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
  const { profile, updateProfile } = useAuth();

  const [name, setName] = useState(profile?.name ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [emoji, setEmoji] = useState(profile?.emoji ?? '🧳');
  const [color, setColor] = useState(profile?.color ?? AVATAR_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hasChanges =
    name.trim() !== profile?.name ||
    username.trim() !== profile?.username ||
    emoji !== profile?.emoji ||
    color !== profile?.color;

  const handleSave = async () => {
    if (!name.trim() || !username.trim() || loading || !hasChanges) return;
    setError(null);
    setLoading(true);
    const { error: saveError } = await updateProfile({
      name: name.trim(),
      username: username.trim(),
      emoji,
      color,
    });
    setLoading(false);
    if (saveError) {
      setError(saveError === 'username taken' ? 'اسم المستخدم هذا مستخدم بالفعل' : 'صار خطأ، حاول مرة ثانية');
      return;
    }
    navigation.goBack();
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
        <View style={[styles.avatarPreview, { backgroundColor: color }]}>
          <Text style={styles.avatarPreviewEmoji}>{emoji}</Text>
        </View>

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
          onChangeText={setUsername}
          autoCapitalize="none"
          textAlign="right"
        />

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
});
