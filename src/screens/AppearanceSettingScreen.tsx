import React, { useMemo } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme, type ThemeMode } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const OPTIONS: Array<{ value: ThemeMode; label: string }> = [
  { value: 'system', label: 'تلقائي' },
  { value: 'dark', label: 'داكن' },
  { value: 'light', label: 'فاتح' },
];

export function PreviewCard({ style }: { style: 'light' | 'dark' | 'system' }) {
  const Half = ({ dark }: { dark: boolean }) => (
    <View style={[previewStyles.half, dark ? previewStyles.halfDark : previewStyles.halfLight]}>
      <View style={[previewStyles.bar, dark ? previewStyles.blockDark : previewStyles.blockLight]} />
      <View style={previewStyles.row}>
        <View style={[previewStyles.square, dark ? previewStyles.blockDark : previewStyles.blockLight]} />
        <View style={[previewStyles.square, dark ? previewStyles.blockDark : previewStyles.blockLight]} />
        <View style={[previewStyles.square, dark ? previewStyles.blockDark : previewStyles.blockLight]} />
      </View>
      <View style={[previewStyles.block, dark ? previewStyles.blockDark : previewStyles.blockLight]} />
      <View style={[previewStyles.block, dark ? previewStyles.blockDark : previewStyles.blockLight]} />
    </View>
  );

  if (style === 'system') {
    return (
      <View style={previewStyles.card}>
        <Half dark={false} />
        <Half dark />
      </View>
    );
  }
  return (
    <View style={previewStyles.card}>
      <Half dark={style === 'dark'} />
    </View>
  );
}

export default function AppearanceSettingScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>المظهر</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.optionsRow}>
          {OPTIONS.map((option) => {
            const active = mode === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={styles.optionWrap}
                activeOpacity={0.85}
                onPress={() => setMode(option.value)}
              >
                <View style={[styles.cardFrame, active && styles.cardFrameActive]}>
                  <PreviewCard style={option.value} />
                </View>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active ? <View style={styles.radioDot} /> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const previewStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  half: { flex: 1, padding: 6, gap: 5 },
  halfLight: { backgroundColor: '#FFFFFF' },
  halfDark: { backgroundColor: '#1C1F26' },
  bar: { height: 6, borderRadius: 3, width: '60%' },
  row: { flexDirection: 'row', gap: 4 },
  square: { width: 14, height: 14, borderRadius: 4 },
  block: { height: 14, borderRadius: 4 },
  blockLight: { backgroundColor: '#E3E6EC' },
  blockDark: { backgroundColor: '#3A3F4B' },
});

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
  body: { padding: spacing.lg },
  optionsRow: { flexDirection: 'row-reverse', gap: spacing.md },
  optionWrap: { flex: 1, alignItems: 'center' },
  cardFrame: {
    width: '100%',
    aspectRatio: 0.72,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 3,
    marginBottom: spacing.sm,
  },
  cardFrameActive: { borderColor: colors.primary },
  optionLabel: { color: colors.text, fontSize: 13, fontWeight: '600', marginBottom: spacing.xs },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.primary },
});
