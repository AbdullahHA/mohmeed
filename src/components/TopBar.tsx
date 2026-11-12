import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Text from './Text';
import { fontSize, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import PersonAvatar from './PersonAvatar';

export default function TopBar() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { currentUser } = useAppState();

  return (
    <View style={styles.container}>
      <View style={styles.welcomeRow}>
        <Text style={styles.welcomeText}>أهلاً {currentUser.name}</Text>
        <PersonAvatar avatarUrl={currentUser.avatarUrl} size={34} />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  welcomeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  welcomeText: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: '600',
  },
});
