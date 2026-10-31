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
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import type { AuthResult } from '../context/AuthContext';

type Mode = 'landing' | 'signIn' | 'signUp' | 'forgotPassword';
type ResetStep = 'request' | 'confirm';

function isRateLimitError(message: string) {
  return /security purposes|rate limit|after \d+ seconds/i.test(message);
}

function friendlyAuthError(result: AuthResult, fallback: string) {
  const rawMessage = result.error ?? '';
  if (result.errorKind === 'network') {
    // Include the raw browser error so it's visible in a screenshot —
    // Safari's fetch failure wording differs from Chrome's and this is
    // the only way to see it without devtools access.
    return `تعذّر الاتصال بالخادم — تأكد من اتصالك بالإنترنت وحاول مرة ثانية.\n(${rawMessage})`;
  }
  if (isRateLimitError(rawMessage)) {
    return 'طلبات كثيرة بوقت قصير — انتظر دقيقة وحاول مرة ثانية.';
  }
  return fallback;
}

export default function AuthGateScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { signIn, signUp, continueAsGuest, requestPasswordReset, confirmPasswordReset } = useAuth();
  const [mode, setMode] = useState<Mode>('landing');
  const [resetStep, setResetStep] = useState<ResetStep>('request');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit =
    email.trim().length > 3 &&
    password.length >= 6 &&
    (mode === 'signIn' || (name.trim().length > 0 && username.trim().length >= 3));

  const resetFeedback = () => {
    setError(null);
    setInfo(null);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    resetFeedback();
    setLoading(true);
    const result =
      mode === 'signIn'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, name.trim(), username.trim().toLowerCase().replace(/\s+/g, '_'));
    setLoading(false);
    if (result.error) {
      setError(
        friendlyAuthError(
          result,
          mode === 'signIn'
            ? 'بيانات الدخول غير صحيحة، أو الحساب غير موجود.'
            : result.error === 'username taken'
              ? 'اسم المستخدم هذا محجوز من قبل، جرّب اسمًا آخر.'
              : result.error.includes('already registered')
                ? 'هذا البريد مسجّل من قبل — جرّب تسجيل الدخول.'
                : `تعذّر إنشاء الحساب، تأكد من البيانات وحاول مرة ثانية.\n(${result.error})`
        )
      );
    }
  };

  const handleRequestReset = async () => {
    if (email.trim().length < 4) return;
    resetFeedback();
    setLoading(true);
    const result = await requestPasswordReset(email.trim());
    setLoading(false);
    if (result.error) {
      setError(friendlyAuthError(result, 'تعذّر إرسال رمز التحقق، تأكد من البريد وحاول مرة ثانية.'));
      return;
    }
    setInfo('أرسلنا رمز تحقق لبريدك — افتح الإيميل واكتب الرمز هنا.');
    setResetStep('confirm');
  };

  const handleConfirmReset = async () => {
    if (resetCode.trim().length < 4 || newPassword.length < 6) return;
    resetFeedback();
    setLoading(true);
    const result = await confirmPasswordReset(email.trim(), resetCode.trim(), newPassword);
    setLoading(false);
    if (result.error) {
      setError(friendlyAuthError(result, 'الرمز غير صحيح أو منتهي، تأكد منه وحاول مرة ثانية.'));
      return;
    }
    // confirmPasswordReset establishes a real session on success — the app
    // gate will pick it up automatically and move past this screen.
  };

  const goToMode = (next: Mode) => {
    resetFeedback();
    setResetStep('request');
    setResetCode('');
    setNewPassword('');
    setMode(next);
  };

  const handlePhoneContinue = () => {
    if (phone.trim().length < 5) return;
    setError('تسجيل الدخول برقم الجوال غير متاح حاليًا — استخدم البريد الإلكتروني بالأسفل.');
  };

  if (mode === 'landing') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.logoBadge}>
              <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.title}>تسجيل الدخول أو إنشاء حساب</Text>

            <Text style={styles.label}>رقم الجوال</Text>
            <View style={styles.phoneRow}>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                placeholder="5xxxxxxxx"
                placeholderTextColor={colors.textFaint}
                value={phone}
                onChangeText={(v) => {
                  setPhone(v);
                  resetFeedback();
                }}
                keyboardType="phone-pad"
                textAlign="right"
              />
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+966</Text>
              </View>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.submitButton, phone.trim().length < 5 && styles.submitDisabled]}
              activeOpacity={0.85}
              disabled={phone.trim().length < 5}
              onPress={handlePhoneContinue}
            >
              <Text style={styles.submitText}>متابعة</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>أو</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.altButton}
              activeOpacity={0.7}
              onPress={() => goToMode('signIn')}
            >
              <Ionicons name="mail-outline" size={18} color={colors.text} />
              <Text style={styles.altButtonText}>المتابعة بالبريد الإلكتروني</Text>
            </TouchableOpacity>

            <View style={[styles.altButton, styles.altButtonDisabled]}>
              <Ionicons name="logo-apple" size={18} color={colors.textFaint} />
              <Text style={styles.altButtonTextDisabled}>المتابعة بحساب Apple — قريبًا</Text>
            </View>

            <View style={[styles.altButton, styles.altButtonDisabled]}>
              <Ionicons name="logo-google" size={18} color={colors.textFaint} />
              <Text style={styles.altButtonTextDisabled}>المتابعة بحساب Google — قريبًا</Text>
            </View>

            <TouchableOpacity style={styles.guestButton} activeOpacity={0.7} onPress={continueAsGuest}>
              <Ionicons name="eye-outline" size={16} color={colors.textMuted} />
              <Text style={styles.guestButtonText}>المتابعة كضيف بدون تسجيل</Text>
            </TouchableOpacity>
            <Text style={styles.guestHint}>
              تقدر تتصفح الوجهات والأماكن، بس ميزات مثل الأصدقاء والمفضلة تحتاج حساب
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (mode === 'forgotPassword') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.badge}>
              <Ionicons name="key-outline" size={32} color={colors.primary} />
            </View>
            <Text style={styles.title}>استرجاع كلمة المرور</Text>
            <Text style={styles.subtitle}>
              {resetStep === 'request'
                ? 'اكتب بريدك وبنرسل لك رمز تحقق لإعادة تعيين كلمة المرور'
                : 'اكتب الرمز اللي وصلك بالبريد وكلمة المرور الجديدة'}
            </Text>

            <Text style={styles.label}>البريد الإلكتروني</Text>
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              placeholderTextColor={colors.textFaint}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={resetStep === 'request'}
              textAlign="right"
            />

            {resetStep === 'confirm' ? (
              <>
                <Text style={styles.label}>رمز التحقق</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  placeholderTextColor={colors.textFaint}
                  value={resetCode}
                  onChangeText={setResetCode}
                  keyboardType="number-pad"
                  textAlign="right"
                />

                <Text style={styles.label}>كلمة المرور الجديدة</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textFaint}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    textAlign="right"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    activeOpacity={0.7}
                    onPress={() => setShowNewPassword((v) => !v)}
                  >
                    <Ionicons
                      name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textFaint}
                    />
                  </TouchableOpacity>
                </View>
              </>
            ) : null}

            {info ? <Text style={styles.info}>{info}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[
                styles.submitButton,
                (loading ||
                  (resetStep === 'request' ? email.trim().length < 4 : resetCode.trim().length < 4 || newPassword.length < 6)) &&
                  styles.submitDisabled,
              ]}
              activeOpacity={0.85}
              disabled={
                loading ||
                (resetStep === 'request' ? email.trim().length < 4 : resetCode.trim().length < 4 || newPassword.length < 6)
              }
              onPress={resetStep === 'request' ? handleRequestReset : handleConfirmReset}
            >
              {loading ? (
                <ActivityIndicator color={colors.textOnPrimary} />
              ) : (
                <Text style={styles.submitText}>
                  {resetStep === 'request' ? 'إرسال رمز التحقق' : 'تعيين كلمة المرور الجديدة'}
                </Text>
              )}
            </TouchableOpacity>

            {resetStep === 'confirm' ? (
              <TouchableOpacity style={styles.switchModeButton} activeOpacity={0.7} onPress={handleRequestReset}>
                <Text style={styles.switchModeText}>ما وصلني رمز؟ أعد الإرسال</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.switchModeButton} activeOpacity={0.7} onPress={() => goToMode('signIn')}>
              <Text style={styles.switchModeText}>رجوع لتسجيل الدخول</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={() => goToMode('landing')}>
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.logoBadge}>
            <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
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
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="••••••••"
              placeholderTextColor={colors.textFaint}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textAlign="right"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              activeOpacity={0.7}
              onPress={() => setShowPassword((v) => !v)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textFaint}
              />
            </TouchableOpacity>
          </View>

          {mode === 'signIn' ? (
            <TouchableOpacity
              style={styles.forgotLink}
              activeOpacity={0.7}
              onPress={() => goToMode('forgotPassword')}
            >
              <Text style={styles.forgotLinkText}>نسيت كلمة المرور؟</Text>
            </TouchableOpacity>
          ) : null}

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
            onPress={() => goToMode(mode === 'signIn' ? 'signUp' : 'signIn')}
          >
            <Text style={styles.switchModeText}>
              {mode === 'signIn' ? 'ما عندك حساب؟ أنشئ واحد' : 'عندك حساب؟ سجّل دخولك'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>أو</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.guestButton} activeOpacity={0.7} onPress={continueAsGuest}>
            <Ionicons name="eye-outline" size={16} color={colors.textMuted} />
            <Text style={styles.guestButtonText}>المتابعة كضيف بدون تسجيل</Text>
          </TouchableOpacity>
          <Text style={styles.guestHint}>
            تقدر تتصفح الوجهات والأماكن، بس ميزات مثل الأصدقاء والمفضلة تحتاج حساب
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.xl, paddingTop: spacing.xxl * 1.5 },
  backButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  phoneRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  phoneInput: {
    flex: 1,
  },
  countryCode: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  countryCodeText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  altButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  altButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  altButtonDisabled: {
    opacity: 0.5,
  },
  altButtonTextDisabled: {
    color: colors.textFaint,
    fontSize: 13,
    fontWeight: '600',
  },
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
  logoBadge: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  logo: {
    width: '100%',
    height: '100%',
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
  passwordRow: {
    justifyContent: 'center',
  },
  passwordInput: {
    paddingLeft: spacing.xxl,
  },
  eyeButton: {
    position: 'absolute',
    left: spacing.sm,
    padding: spacing.xs,
  },
  error: { color: colors.red, fontSize: 12, textAlign: 'right', marginTop: spacing.sm },
  info: { color: colors.success, fontSize: 12, textAlign: 'right', marginTop: spacing.sm },
  forgotLink: { alignItems: 'flex-end', marginTop: spacing.sm },
  forgotLinkText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textFaint, fontSize: 12 },
  guestButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
  },
  guestButtonText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  guestHint: {
    color: colors.textFaint,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
