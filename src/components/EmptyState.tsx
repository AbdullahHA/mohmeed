import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Text from './Text';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({ icon, title, subtitle, actionLabel, onAction }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <View style={styles.illustration}>
        <View style={[styles.accentDot, styles.accentDotTopLeft]} />
        <View style={[styles.accentDot, styles.accentDotTopRight]} />
        <View style={[styles.accentDot, styles.accentDotBottom]} />
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={32} color={colors.primary} />
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.85} onPress={onAction}>
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  illustration: {
    width: 108,
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentDot: {
    position: 'absolute',
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  accentDotTopLeft: { width: 10, height: 10, top: 4, left: 8 },
  accentDotTopRight: { width: 14, height: 14, top: 10, right: 0 },
  accentDotBottom: { width: 8, height: 8, bottom: 6, left: 2 },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  actionButtonText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 13 },
});
