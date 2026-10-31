import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';

type Props = {
  selected?: boolean;
};

export default function PlaceMarker({ selected }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.pin, selected && styles.pinSelected]}>
      <Ionicons name="location" size={14} color={selected ? colors.textOnPrimary : colors.primary} />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  pin: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinSelected: {
    backgroundColor: colors.primary,
  },
});
