import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

type Mode = 'signIn' | 'signUp';

export default function AuthGateScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signIn');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit =
    email.trim().length > 3 &&
    password.length >= 6 &&
    (mode === 'signIn' || (name.trim().length > 0 && username.trim().length >= 3));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    const result =
      mode === 'signIn'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, name.trim(), username.trim().toLowerCase().replace(/\s+/g, '_'));
    setLoading(false);
    if (result.error) {
      setError(
        mode === 'signIn'
          ? 'بيانات الدخول غير صحيحة، أو الحساب غير موجود.'
          : result.error.includes('already registered')
            ? 'هذا البريد مسجّل من قبل — جرّب تسجيل الدخول.'
            : 'تعذّر إنشاء الحساب، تأكد من البيانات وحاول مرة ثانية.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.badge}>
            <Ionicons name="compass-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>يلا نسافر</Text>
          <Text style={styles.subtitle}>
            {mode === 'signIn' ? 'سجّل دخولك عشان تكمل من وين وقفت' : 'أنشئ حسابك وابدأ رحلتك'}
          </Text>

          {mode === 'signUp' ? (
            <>
              <Text style={styles.label}>الاسم</Text>
              <TextInput
                style={styles.input}
                placeholder="عبدالله"
                placeholderTextColor={colors.textFaint}
                value={name}
                onChangeText={setName}
                textAlign="right"
              />

              <Text style={styles.label}>اسم المستخدم</Text>
              <TextInput
                style={styles.input}
                placeholder="abdullah_s"
                placeholderTextColor={colors.textFaint}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                textAlign="right"
              />
            </>
          ) : null}

          <Text style={styles.label}>البريد الإلكتروني</Text>
          <TextInput
            style={styles.input}
            placeholder="name@example.com"
            placeholderTextColor={colors.textFaint}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textAlign="right"
          />

          <Text style={styles.label}>كلمة المرور</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.textFaint}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textAlign="right"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.submitButton, (!canSubmit || loading) && styles.submitDisabled]}
            activeOpacity={0.85}
            disabled={!canSubmit || loading}
            onPress={handleSubmit}
          >
            {loading ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <Text style={styles.submitText}>{mode === 'signIn' ? 'دخول' : 'إنشاء حساب'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchModeButton}
            activeOpacity={0.7}
            onPress={() => {
              setError(null);
              setMode((m) => (m === 'signIn' ? 'signUp' : 'signIn'));
            }}
          >
            <Text style={styles.switchModeText}>
              {mode === 'signIn' ? 'ما عندك حساب؟ أنشئ واحد' : 'عندك حساب؟ سجّل دخولك'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.xl, paddingTop: spacing.xxl * 1.5 },
  badge: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
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
  error: { color: colors.red, fontSize: 12, textAlign: 'right', marginTop: spacing.sm },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 14 },
  switchModeButton: { alignItems: 'center', marginTop: spacing.lg, paddingVertical: spacing.sm },
  switchModeText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
});
