import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// The warm desert-dune backdrop used throughout yalla-handoff's mockups
// (auth screen, city hero, profile cover) — the app's one recurring
// decorative motif. Pure gradient + shapes, no fabricated photo/data.
export default function DesertHero({
  style,
  dark = false,
  children,
}: {
  style?: ViewStyle;
  dark?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={['#f0a35c', '#e9895a', '#b6573a', '#7a3524']}
        locations={[0, 0.32, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.dune, styles.dune1]} />
      <View style={[styles.dune, styles.dune2]} />
      <View style={[styles.dune, styles.dune3]} />
      {dark ? (
        <LinearGradient
          colors={['rgba(10,14,30,0.1)', 'rgba(10,14,30,0.62)', 'rgba(10,14,30,0.92)']}
          locations={[0.2, 0.62, 1]}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden', backgroundColor: '#7a3524' },
  dune: { position: 'absolute', height: 160, borderRadius: 500 },
  dune1: { bottom: -110, left: -20, right: -20, backgroundColor: '#5c2a1c' },
  dune2: { bottom: -120, right: '-10%', width: '70%', backgroundColor: '#6d3221' },
  dune3: { bottom: -128, left: '10%', width: '55%', backgroundColor: '#4a2216' },
});
