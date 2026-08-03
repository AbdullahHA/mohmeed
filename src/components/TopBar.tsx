import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/colors';
import { fonts } from '../theme/fonts';
import Logo from './Logo';

type Props = {
  title?: string;
  subtitle?: string;
};

export default function TopBar({ title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      {title ? (
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : (
        <View style={styles.spacer} />
      )}
      <Logo withWordmark={!title} size={34} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  spacer: {
    flex: 1,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontFamily: fonts.bold,
    textAlign: 'right',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.regular,
    textAlign: 'right',
    marginTop: 2,
  },
});
