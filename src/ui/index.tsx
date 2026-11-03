/**
 * مكوّنات الواجهة المشتركة. كل الشاشات تُبنى منها، عشان الشكل والسهولة والوضعين يكونون موحّدين.
 * القواعد: مساحة ضغط ≥ 44، نص ≥ 12 (الشارات 11/600)، كل أيقونة بدون نص لها accessibilityLabel.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '../theme/ThemeProvider';
import { fixed, radius, space, type as typeScale, type Colors } from '../theme/tokens';
import { useUI } from '../data/ui';

export type IconName = keyof typeof Ionicons.glyphMap;

/* ---------------- النص ---------------- */
type Variant = keyof typeof typeScale;
export type Tone = 'foreground' | 'muted' | 'primaryInk' | 'goldInk' | 'successInk' | 'destructive' | 'white' | 'onPrimary';
const toneKey: Record<Tone, keyof Colors | null> = {
  foreground: 'foreground',
  muted: 'mutedForeground',
  primaryInk: 'primaryInk',
  goldInk: 'goldInk',
  successInk: 'successInk',
  destructive: 'destructive',
  white: null,
  onPrimary: 'primaryForeground',
};

export function Txt({
  variant = 'body',
  tone = 'foreground',
  style,
  center,
  ...rest
}: TextProps & { variant?: Variant; tone?: Tone; center?: boolean }) {
  const { colors } = useAppTheme();
  const key = toneKey[tone];
  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={2}
      style={[
        typeScale[variant] as TextStyle,
        { color: key ? colors[key] : '#ffffff', writingDirection: 'rtl' },
        center && { textAlign: 'center' },
        style,
      ]}
      {...rest}
    />
  );
}

/* ---------------- الأيقونات ---------------- */
export function Icon({ name, size = 20, color, style }: { name: IconName; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  const { colors } = useAppTheme();
  return <Ionicons name={name} size={size} color={color ?? colors.foreground} style={style} />;
}
/** التطبيق RTL: «رجوع» يأشر يمين، و«التالي» يأشر يسار */
export const BACK: IconName = 'chevron-forward';
export const NEXT: IconName = 'chevron-back';

/* ---------------- الشاشة ---------------- */
export function Screen({
  children,
  scroll = true,
  header,
  footer,
  padded = true,
  edges = ['top'],
  contentStyle,
  refreshControl,
}: {
  children: ReactNode;
  scroll?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  padded?: boolean;
  edges?: ('top' | 'bottom')[];
  contentStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ComponentProps<typeof ScrollView>['refreshControl'];
}) {
  const { colors } = useAppTheme();
  const pad = padded ? { paddingHorizontal: space.gutter } : null;
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {header}
        {scroll ? (
          <ScrollView
            refreshControl={refreshControl}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[pad, { paddingBottom: footer ? 120 : 110, gap: space.section }, contentStyle]}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
        )}
        {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Header({
  title,
  subtitle,
  onBack,
  right,
  large,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  large?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.gutter, paddingVertical: space.sm }}>
      {onBack ? <IconBtn name={BACK} label="رجوع" onPress={onBack} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt variant={large ? 'title' : 'heading'} numberOfLines={1} accessibilityRole="header">
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/* ---------------- الأزرار ---------------- */
type BtnVariant = 'primary' | 'ghost' | 'soft' | 'danger' | 'plain';
export function Btn({
  title,
  icon,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  full,
  style,
  label,
}: {
  title: string;
  icon?: IconName;
  onPress?: () => void;
  variant?: BtnVariant;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
  label?: string;
}) {
  const { colors } = useAppTheme();
  const bg = {
    primary: colors.primary,
    ghost: colors.card,
    soft: colors.primarySoft,
    danger: colors.card,
    plain: 'transparent',
  }[variant];
  const fg = {
    primary: colors.primaryForeground,
    ghost: colors.foreground,
    soft: colors.primaryInk,
    danger: colors.destructive,
    plain: colors.primaryInk,
  }[variant];
  const h = { sm: 36, md: 44, lg: 52 }[size];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? title}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={disabled || loading}
      onPress={() => {
        if (variant === 'primary') void Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      hitSlop={size === 'sm' ? 6 : 0}
      style={({ pressed }) => [
        {
          minHeight: h,
          paddingHorizontal: size === 'sm' ? 12 : 16,
          borderRadius: size === 'lg' ? radius.xl - 6 : radius.md,
          backgroundColor: bg,
          borderWidth: variant === 'ghost' || variant === 'danger' ? 1 : 0,
          borderColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          alignSelf: full ? 'stretch' : 'auto',
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={fg} /> : null}
      <Text
        maxFontSizeMultiplier={1.6}
        style={[typeScale.button as TextStyle, { color: fg, fontSize: size === 'lg' ? 15 : size === 'sm' ? 13 : 14 }]}
        numberOfLines={1}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function IconBtn({
  name,
  label,
  onPress,
  variant = 'plain',
  size = 40,
  color,
  badge,
}: {
  name: IconName;
  label: string;
  onPress?: () => void;
  variant?: 'plain' | 'glass' | 'soft' | 'primary' | 'bare';
  size?: number;
  color?: string;
  badge?: boolean;
}) {
  const { colors } = useAppTheme();
  const bg = {
    plain: colors.card,
    glass: 'rgba(0,0,0,0.35)',
    soft: colors.primarySoft,
    primary: colors.primary,
    bare: 'transparent',
  }[variant];
  const fg =
    color ??
    { plain: colors.foreground, glass: '#ffffff', soft: colors.primaryInk, primary: colors.primaryForeground, bare: colors.foreground }[variant];
  const hit = Math.max(0, (44 - size) / 2);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={hit}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: variant === 'glass' ? size / 2 : 12,
        backgroundColor: bg,
        borderWidth: variant === 'plain' ? 1 : 0,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Ionicons name={name} size={Math.round(size * 0.48)} color={fg} />
      {badge ? (
        <View
          style={{ position: 'absolute', top: 7, end: 8, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.heart, borderWidth: 2, borderColor: colors.card }}
        />
      ) : null}
    </Pressable>
  );
}

/* ---------------- البطاقات والشارات ---------------- */
export function Card({
  children,
  style,
  onPress,
  padded = true,
  tone,
  label,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padded?: boolean;
  tone?: 'primary' | 'gold' | 'success' | 'navy';
  label?: string;
}) {
  const { colors } = useAppTheme();
  const toneStyle: ViewStyle | null =
    tone === 'primary'
      ? { backgroundColor: colors.primarySoft, borderColor: colors.primary }
      : tone === 'gold'
        ? { backgroundColor: colors.goldSoft, borderColor: 'transparent' }
        : tone === 'success'
          ? { backgroundColor: colors.successSoft, borderColor: colors.success }
          : tone === 'navy'
            ? { backgroundColor: colors.navy, borderColor: 'transparent' }
            : null;
  const base: ViewStyle = {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: padded ? space.md : 0,
    overflow: 'hidden',
  };
  if (onPress)
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [base, toneStyle, { opacity: pressed ? 0.9 : 1 }, style]}
      >
        {children}
      </Pressable>
    );
  return <View style={[base, toneStyle, style]}>{children}</View>;
}

export function Chip({ label, icon, tone = 'primary', style }: { label: string; icon?: IconName; tone?: 'primary' | 'gold' | 'success' | 'muted' | 'glass'; style?: StyleProp<ViewStyle> }) {
  const { colors } = useAppTheme();
  const map = {
    primary: [colors.primarySoft, colors.primaryInk],
    gold: [colors.goldSoft, colors.goldInk],
    success: [colors.successSoft, colors.successInk],
    muted: [colors.muted, colors.mutedForeground],
    glass: ['rgba(255,255,255,0.22)', '#ffffff'],
  }[tone];
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: map[0], borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'flex-start' }, style]}>
      {icon ? <Ionicons name={icon} size={12} color={map[1]} /> : null}
      <Text maxFontSizeMultiplier={1.6} style={[typeScale.badge as TextStyle, { color: map[1] }]}>
        {label}
      </Text>
    </View>
  );
}

export function Pill({ label, active, onPress, icon, count }: { label: string; active?: boolean; onPress?: () => void; icon?: IconName; count?: number }) {
  const { colors } = useAppTheme();
  const fg = active ? colors.background : colors.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        minHeight: 36,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? colors.foreground : colors.border,
        backgroundColor: active ? colors.foreground : colors.card,
      }}
    >
      {icon ? <Ionicons name={icon} size={15} color={fg} /> : null}
      <Text maxFontSizeMultiplier={1.6} style={[typeScale.bodyStrong as TextStyle, { fontSize: 13, color: fg }]}>
        {label}
      </Text>
      {count ? (
        <View style={{ backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 6, minWidth: 18, alignItems: 'center' }}>
          <Text style={[typeScale.badge as TextStyle, { color: colors.primaryForeground, fontSize: 11 }]}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function PillRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: space.gutter }} style={{ marginHorizontal: -space.gutter }}>
      {children}
    </ScrollView>
  );
}

export function HScroll({ children, gap = 12 }: { children: ReactNode; gap?: number }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap, paddingHorizontal: space.gutter }} style={{ marginHorizontal: -space.gutter }}>
      {children}
    </ScrollView>
  );
}

/* ---------------- الصور ---------------- */
const SCENES: Record<string, [string, string, ...string[]]> = {
  desert: ['#f0a35c', '#e9895a', '#b6573a', '#7a3524'],
  sea: ['#9fd3f0', '#6db7e3', '#1f7fb8', '#155f8f'],
  city: ['#5a6fa8', '#8e8fc4', '#d6a3a8'],
  green: ['#bfe3d0', '#7fc4a0', '#3f8f68'],
  night: ['#1b2350', '#3a2f6b', '#6a3d6e'],
  food: ['#b7743d', '#7a4a2a', '#3d2414'],
  old: ['#e9d3a8', '#d1a86a', '#a8773e'],
  mountain: ['#c9d6e8', '#8aa0bf', '#4f6584'],
};
export type SceneKey = keyof typeof SCENES;
const SCENE_KEYS = Object.keys(SCENES) as SceneKey[];
export function sceneFor(seed: string): SceneKey {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return SCENE_KEYS[h % SCENE_KEYS.length];
}

/** صورة بخلفية متدرّجة احتياطية: لو ما فيه رابط، أو ما تحمّلت، يبان التدرّج والأيقونة */
export function Photo({
  uri,
  scene,
  icon,
  style,
  children,
  scrim,
  label,
}: {
  uri?: string | null;
  scene?: SceneKey;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  scrim?: boolean;
  label?: string;
}) {
  const s = SCENES[scene ?? 'desert'];
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: s[1] }, style]} accessible={!!label} accessibilityLabel={label} accessibilityRole={label ? 'image' : undefined}>
      <LinearGradient colors={s} style={StyleSheet.absoluteFill} />
      {icon && !uri ? (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <Ionicons name={icon} size={28} color="rgba(255,255,255,0.55)" />
        </View>
      ) : null}
      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} /> : null}
      {scrim ? <LinearGradient colors={['transparent', 'rgba(0,0,0,0.62)']} locations={[0.35, 1]} style={StyleSheet.absoluteFill} /> : null}
      {children}
    </View>
  );
}

/* ---------------- الأشخاص ---------------- */
export function Avatar({ name, color, size = 40, ring, uri }: { name: string; color?: string; size?: number; ring?: boolean; uri?: string | null }) {
  const { colors } = useAppTheme();
  const inner = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color ?? colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: ring ? 3 : 0,
        borderColor: colors.background,
      }}
      accessibilityLabel={name}
    >
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} />
      ) : (
        <Text style={{ fontFamily: 'IBMPlexSansArabic_700Bold', color: '#fff', fontSize: size * 0.38 }}>{name.trim().charAt(0)}</Text>
      )}
    </View>
  );
  if (!ring) return inner;
  return (
    <LinearGradient colors={['#f0a35c', '#e0527d', '#6a5cf0', '#2a9bb0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 3, borderRadius: (size + 6) / 2, alignSelf: 'flex-start' }}>
      {inner}
    </LinearGradient>
  );
}

export function Faces({ people, size = 24 }: { people: { name: string; color: string }[]; size?: number }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row' }} accessibilityLabel={people.map((p) => p.name).join('، ')}>
      {people.slice(0, 4).map((p, i) => (
        <View
          key={p.name + i}
          style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: p.color, borderWidth: 2, borderColor: colors.card, marginStart: i ? -size * 0.3 : 0, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: '#fff', fontSize: size * 0.42, fontFamily: 'IBMPlexSansArabic_700Bold' }}>{p.name.charAt(0)}</Text>
        </View>
      ))}
    </View>
  );
}

/* ---------------- مؤشرات ---------------- */
export function Progress({ value, tone = 'primary', height = 6 }: { value: number; tone?: 'primary' | 'gold' | 'success' | 'auto' | 'danger'; height?: number }) {
  const { colors } = useAppTheme();
  const v = Math.max(0, Math.min(1, value));
  const c =
    tone === 'auto'
      ? value > 1
        ? colors.destructive
        : value >= 0.75
          ? colors.gold
          : colors.primary
      : { primary: colors.primary, gold: colors.gold, success: colors.success, danger: colors.destructive }[tone];
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={{ height, borderRadius: height, backgroundColor: colors.border, overflow: 'hidden' }}
    >
      <View style={{ width: `${v * 100}%`, height: '100%', borderRadius: height, backgroundColor: c }} />
    </View>
  );
}

export function Segmented<K extends string>({ options, value, onChange }: { options: { key: K; label: string; count?: number }[]; value: K; onChange: (k: K) => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.muted, borderRadius: 14, padding: 4 }} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.key)}
            style={{ flex: 1, minHeight: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4, backgroundColor: on ? colors.card : 'transparent' }}
          >
            <Txt variant={on ? 'bodyStrong' : 'body'} tone={on ? 'foreground' : 'muted'} style={{ fontSize: 13 }}>
              {o.label}
            </Txt>
            {o.count != null ? <Chip label={String(o.count)} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const { colors } = useAppTheme();
  return (
    <Switch
      accessibilityLabel={label}
      value={value}
      onValueChange={onChange}
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor="#ffffff"
      ios_backgroundColor={colors.border}
    />
  );
}

/* ---------------- الأقسام والقوائم ---------------- */
export function Section({ title, action, children, style }: { title: string; action?: { label: string; onPress: () => void }; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ gap: space.md }, style]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt variant="section" accessibilityRole="header">
          {title}
        </Txt>
        {action ? (
          <Pressable onPress={action.onPress} hitSlop={10} accessibilityRole="link">
            <Txt variant="bodyStrong" tone="primaryInk" style={{ fontSize: 13 }}>
              {action.label}
            </Txt>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function ListRow({
  icon,
  iconBg,
  title,
  subtitle,
  value,
  onPress,
  right,
  danger,
}: {
  icon?: IconName;
  iconBg?: string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, minHeight: 56, opacity: pressed ? 0.7 : 1 })}
    >
      {icon ? (
        <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: iconBg ?? colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={18} color={iconBg ? '#fff' : danger ? colors.destructive : colors.primaryInk} />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt variant="bodyStrong" tone={danger ? 'destructive' : 'foreground'}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="caption" tone="muted">
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {right ?? (value != null || onPress ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {value ? (
            <Txt variant="caption" tone="muted">
              {value}
            </Txt>
          ) : null}
          {onPress ? <Ionicons name={NEXT} size={16} color={colors.mutedForeground} /> : null}
        </View>
      ) : null)}
    </Pressable>
  );
}

export function Divider() {
  const { colors } = useAppTheme();
  return <View style={{ height: 1, backgroundColor: colors.border }} />;
}

export function Empty({ icon, title, text, action }: { icon: IconName; title: string; text?: string; action?: { label: string; onPress: () => void } }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ alignItems: 'center', gap: 10, paddingVertical: 28, paddingHorizontal: 16 }}>
      <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={30} color={colors.primaryInk} />
      </View>
      <Txt variant="heading" center>
        {title}
      </Txt>
      {text ? (
        <Txt tone="muted" center>
          {text}
        </Txt>
      ) : null}
      {action ? <Btn title={action.label} onPress={action.onPress} /> : null}
    </View>
  );
}

export function Skeleton({ height = 72, style }: { height?: number; style?: StyleProp<ViewStyle> }) {
  const { colors } = useAppTheme();
  const o = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([Animated.timing(o, { toValue: 1, duration: 700, useNativeDriver: true }), Animated.timing(o, { toValue: 0.5, duration: 700, useNativeDriver: true })]));
    a.start();
    return () => a.stop();
  }, [o]);
  return <Animated.View style={[{ height, borderRadius: radius.card, backgroundColor: colors.muted, opacity: o }, style]} />;
}

/* ---------------- الحقول ---------------- */
export function Field({ label, hint, style, ...props }: TextInputProps & { label?: string; hint?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ gap: 6 }}>
      {label ? <Txt variant="bodyStrong">{label}</Txt> : null}
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        accessibilityLabel={label ?? props.placeholder}
        maxFontSizeMultiplier={1.8}
        style={[
          {
            minHeight: 48,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            paddingHorizontal: 14,
            paddingVertical: props.multiline ? 12 : 0,
            color: colors.foreground,
            fontFamily: 'IBMPlexSansArabic_400Regular',
            fontSize: 15,
            textAlign: 'right',
            writingDirection: 'rtl',
          },
          props.multiline && { minHeight: 96, textAlignVertical: 'top' },
          style as TextStyle,
        ]}
        {...props}
      />
      {hint ? (
        <Txt variant="caption" tone="muted">
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

/* ---------------- النافذة السفلية ---------------- */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} onPress={onClose} accessibilityLabel="إغلاق" accessibilityRole="button" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, maxHeight: '92%', paddingBottom: Math.max(insets.bottom, 16) }}>
            <View style={{ alignItems: 'center', paddingTop: 10 }}>
              <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: space.gutter, paddingTop: 10, paddingBottom: 6 }}>
              <View style={{ flex: 1 }}>
                <Txt variant="heading" accessibilityRole="header">
                  {title}
                </Txt>
                {subtitle ? (
                  <Txt variant="caption" tone="muted">
                    {subtitle}
                  </Txt>
                ) : null}
              </View>
              <IconBtn name="close" label="إغلاق" onPress={onClose} />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: space.gutter, paddingBottom: 12, gap: 14 }}>
              {children}
            </ScrollView>
            {footer ? <View style={{ paddingHorizontal: space.gutter, paddingTop: 8, gap: 8 }}>{footer}</View> : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/** شريط ثابت تحت الشاشة (صفحة المكان، رحلة جديدة) */
export function StickyBar({ children }: { children: ReactNode }) {
  const { colors, shadow } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          position: 'absolute',
          start: 10,
          end: 10,
          bottom: Math.max(insets.bottom, 12),
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 22,
          padding: 10,
          flexDirection: 'row',
          gap: 10,
          alignItems: 'center',
        },
        shadow.float,
      ]}
    >
      {children}
    </View>
  );
}

export function FAB({ icon = 'add', label, onPress }: { icon?: IconName; label: string; onPress: () => void }) {
  const { colors, shadow } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[{ position: 'absolute', bottom: 100, start: undefined, end: 18, width: 56, height: 56, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, shadow.float]}
    >
      <Ionicons name={icon} size={26} color={colors.primaryForeground} />
    </Pressable>
  );
}

/* ---------------- الختم ---------------- */
export function Stamp({ city, date, index, square, size = 84 }: { city: string; date: string; index: number; square?: boolean; size?: number }) {
  const c = fixed.stamps[index % fixed.stamps.length];
  const rot = [-8, 6, -3, 9, -6][index % 5];
  return (
    <View
      accessibilityLabel={`ختم ${city} ${date}`}
      style={{ width: size, height: size, borderRadius: square ? 14 : size / 2, borderWidth: 2, borderStyle: 'dashed', borderColor: c, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: `${rot}deg` }], padding: 6 }}
    >
      <Text style={{ fontFamily: 'IBMPlexSansArabic_700Bold', color: c, fontSize: 13 }} numberOfLines={1}>
        {city}
      </Text>
      <Text style={{ fontFamily: 'IBMPlexSansArabic_500Medium', color: c, fontSize: 10 }}>{date}</Text>
    </View>
  );
}

/* ---------------- رسالة سريعة مع تراجع ---------------- */
export function ToastHost() {
  const { colors, shadow } = useAppTheme();
  const toast = useUI((s) => s.toast);
  const hide = useUI((s) => s.hideToast);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(hide, toast.action ? 5000 : 2600);
    return () => clearTimeout(t);
  }, [toast, hide]);
  if (!toast) return null;
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', start: 16, end: 16, bottom: Math.max(insets.bottom, 12) + 86 }}
      accessibilityLiveRegion="polite"
    >
      <View style={[{ backgroundColor: colors.foreground, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }, shadow.float]}>
        <Txt style={{ flex: 1, color: colors.background }}>{toast.message}</Txt>
        {toast.action ? (
          <Pressable
            hitSlop={10}
            accessibilityRole="button"
            onPress={() => {
              toast.action?.onPress();
              hide();
            }}
          >
            <Txt variant="bodyStrong" style={{ color: colors.primarySoft }}>
              {toast.action.label}
            </Txt>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function Row({ children, gap = 8, style, wrap }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle>; wrap?: boolean }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>{children}</View>;
}
