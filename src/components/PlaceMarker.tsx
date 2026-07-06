import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme/colors';

type Props = {
  selected?: boolean;
};

export default function PlaceMarker({ selected }: Props) {
  return (
    <View style={[styles.pin, selected && styles.pinSelected]}>
      <Ionicons name="location" size={14} color={selected ? colors.background : colors.gold} />
    </View>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinSelected: {
    backgroundColor: colors.gold,
  },
});
