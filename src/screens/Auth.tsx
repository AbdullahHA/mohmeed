/** تسجيل الدخول (15.1) وأسئلة البداية */
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { completeOnboarding, continueAsGuest, signInDemo } from '../data/actions';
import { getState } from '../data/store';
import { toast } from '../data/ui';
import { supabase } from '../lib/supabase';
import { useAppTheme } from '../theme/ThemeProvider';
import { Btn, Field, Photo, Pill, Row, Sheet, Txt } from '../ui';
import type { TravelerType } from '../data/types';

WebBrowser.maybeCompleteAuthSession();

async function oauth(provider: 'google' | 'apple') {
  if (!supabase) return signInDemo();
  if (provider === 'apple' && Platform.OS === 'ios') {
    const cred = await AppleAuthentication.signInAsync({ requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL] });
    if (!cred.identityToken) throw new Error('no token');
    const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: cred.identityToken });
    if (error) throw error;
    getState().setSession({ userId: data.user.id, mode: 'cloud' });
    return;
  }
  const redirectTo = Linking.createURL('auth');
  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' } });
  if (error) throw error;
  if (Platform.OS !== 'web' && data.url) {
    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (res.type === 'success') {
      const url = new URL(res.url.replace('#', '?'));
      const access_token = url.searchParams.get('access_token');
      const refresh_token = url.searchParams.get('refresh_token');
      if (access_token && refresh_token) {
        const s = await supabase.auth.setSession({ access_token, refresh_token });
        if (s.data.user) getState().setSession({ userId: s.data.user.id, mode: 'cloud' });
      }
    }
  }
}

export function AuthScreen() {
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void> | void) => {
    try {
      setBusy(true);
      await fn();
    } catch {
      toast('ما قدرنا نسجّل دخولك. تأكد من الاتصال وحاول مرة ثانية.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#10162a' }}>
      <Photo scene="desert" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,14,30,0.35)' }} />
      <SafeAreaView style={{ flex: 1, justifyContent: 'space-between', padding: 22 }}>
        <View style={{ gap: 12, marginTop: 30 }}>
          <View style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Txt variant="title" style={{ color: '#0151e3' }}>
              ي
            </Txt>
          </View>
          <Txt variant="display" tone="white" accessibilityRole="header">
            رفيقك في كل رحلة
          </Txt>
          <Txt tone="white" style={{ opacity: 0.9, fontSize: 15, lineHeight: 26 }}>
            اكتشف أماكن جديدة، خطط مع شلتك، وشارك تجربتك مع مسافرين يشبهونك.
          </Txt>
        </View>
        <View style={{ gap: 10 }}>
          <AuthButton icon="logo-apple" label="المتابعة مع Apple" light onPress={() => run(() => oauth('apple'))} disabled={busy} />
          <AuthButton icon="logo-google" label="المتابعة مع Google" onPress={() => run(() => oauth('google'))} disabled={busy} />
          <AuthButton icon="mail-outline" label="المتابعة بالبريد" outline onPress={() => setEmailOpen(true)} disabled={busy} />
          <Pressable onPress={continueAsGuest} hitSlop={10} accessibilityRole="button" style={{ alignItems: 'center', paddingTop: 6 }}>
            <Txt tone="white" style={{ opacity: 0.85 }}>
              أو <Txt tone="white" style={{ textDecorationLine: 'underline' }}>تصفح كزائر</Txt> بدون تسجيل
            </Txt>
          </Pressable>
          <Txt variant="caption" tone="white" center style={{ opacity: 0.6 }}>
            بالمتابعة توافق على الشروط وسياسة الخصوصية
          </Txt>
        </View>
      </SafeAreaView>

      <Sheet
        visible={emailOpen}
        onClose={() => setEmailOpen(false)}
        title={sent ? 'اكتب الرمز' : 'المتابعة بالبريد'}
        subtitle={sent ? `أرسلنا رمز من 6 أرقام إلى ${email}` : 'نرسل لك رمز دخول، بدون كلمة مرور'}
        footer={
          <Btn
            size="lg"
            full
            loading={busy}
            title={sent ? 'دخول' : 'أرسل الرمز'}
            disabled={sent ? code.length !== 6 : !/.+@.+\..+/.test(email)}
            onPress={() =>
              run(async () => {
                if (!supabase) {
                  if (!sent) setSent(true);
                  else signInDemo();
                  return;
                }
                if (!sent) {
                  const { error } = await supabase.auth.signInWithOtp({ email });
                  if (error) throw error;
                  setSent(true);
                } else {
                  const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
                  if (error) throw error;
                  getState().setSession({ userId: data.user?.id ?? null, mode: 'cloud' });
                }
              })
            }
          />
        }
      >
        {sent ? (
          <Field label="الرمز" keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} placeholder="123456" textContentType="oneTimeCode" autoComplete="one-time-code" />
        ) : (
          <Field label="البريد الإلكتروني" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} placeholder="name@example.com" textContentType="emailAddress" autoComplete="email" style={{ textAlign: 'left', writingDirection: 'ltr' }} />
        )}
        {!supabase ? (
          <Txt variant="caption" tone="muted">
            وضع العرض: أي رمز من 6 أرقام يدخلك.
          </Txt>
        ) : null}
      </Sheet>
    </View>
  );
}

function AuthButton({ icon, label, onPress, light, outline, disabled }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; light?: boolean; outline?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => ({
        height: 52,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: light ? '#ffffff' : outline ? 'transparent' : 'rgba(255,255,255,0.16)',
        borderWidth: light ? 0 : 1,
        borderColor: 'rgba(255,255,255,0.3)',
        opacity: pressed || disabled ? 0.8 : 1,
      })}
    >
      <Ionicons name={icon} size={20} color={light ? '#000' : '#fff'} />
      <Txt variant="bodyStrong" style={{ color: light ? '#000' : '#fff', fontSize: 15 }}>
        {label}
      </Txt>
    </Pressable>
  );
}

const INTERESTS = ['طبيعة', 'أكل', 'تاريخ', 'مغامرات', 'تسوّق', 'فعاليات', 'بحر', 'تصوير', 'فخامة', 'اقتصادي'];
const WHO: { key: TravelerType; label: string }[] = [
  { key: 'solo', label: 'لحالي' },
  { key: 'couple', label: 'مع شريكي' },
  { key: 'family', label: 'مع العائلة' },
  { key: 'group', label: 'مع الشلة' },
];
const CITIES = ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة', 'أبها', 'دبي', 'الكويت'];

export function OnboardingScreen() {
  const { colors } = useAppTheme();
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [who, setWho] = useState<TravelerType | undefined>();
  const [city, setCity] = useState('');
  const finish = () => completeOnboarding({ interests, travelerType: who, city });
  const steps = [
    { title: 'وش يعجبك في السفر؟', sub: 'اختر اللي يناسبك، ونقترح لك على أساسه', body: (
      <Row wrap gap={8}>
        {INTERESTS.map((i) => (
          <Pill key={i} label={i} active={interests.includes(i)} onPress={() => setInterests(interests.includes(i) ? interests.filter((x) => x !== i) : [...interests, i])} />
        ))}
      </Row>
    ) },
    { title: 'مع مين تسافر عادة؟', sub: 'يغيّر نوع الأماكن اللي نرشحها', body: (
      <Row wrap gap={8}>
        {WHO.map((w) => (
          <Pill key={w.key} label={w.label} active={who === w.key} onPress={() => setWho(w.key)} />
        ))}
      </Row>
    ) },
    { title: 'وش مدينتك؟', sub: 'عشان نحسب المسافات ونقترح رحلات قريبة', body: (
      <Row wrap gap={8}>
        {CITIES.map((c) => (
          <Pill key={c} label={c} active={city === c} onPress={() => setCity(c)} />
        ))}
      </Row>
    ) },
  ];
  const s = steps[step];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 20, justifyContent: 'space-between' }}>
      <View style={{ gap: 18 }}>
        <Row gap={6}>
          {steps.map((_, i) => (
            <View key={i} style={{ flex: 1, height: 4, borderRadius: 4, backgroundColor: i <= step ? colors.primary : colors.border }} />
          ))}
        </Row>
        <Row style={{ justifyContent: 'flex-end' }}>
          <Pressable onPress={finish} hitSlop={10} accessibilityRole="button">
            <Txt tone="muted">تخطي</Txt>
          </Pressable>
        </Row>
        <Txt variant="title" accessibilityRole="header">
          {s.title}
        </Txt>
        <Txt tone="muted">{s.sub}</Txt>
        {s.body}
      </View>
      <Btn size="lg" full title={step < 2 ? 'التالي' : 'يلا نبدأ'} onPress={() => (step < 2 ? setStep(step + 1) : finish())} />
    </SafeAreaView>
  );
}
