import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';

const LOGO_HEIGHT = 64;
const LOGO_WIDTH = Math.round((LOGO_HEIGHT * 409) / 600);

// Opening animation: the logo pops in, the app name writes out beside it,
// then the name wipes away toward the logo, which settles in the center
// before the whole overlay fades into the app.
export default function AppIntro({ onDone }: { onDone: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [textWidth, setTextWidth] = useState(0);
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!textWidth) return;
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 350, useNativeDriver: false }),
        Animated.spring(logoScale, { toValue: 1, friction: 6, useNativeDriver: false }),
      ]),
      Animated.timing(reveal, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.delay(700),
      Animated.timing(reveal, {
        toValue: 0,
        duration: 550,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(logoScale, { toValue: 1.15, duration: 250, useNativeDriver: false }),
      Animated.timing(fade, { toValue: 0, duration: 350, useNativeDriver: false }),
    ]).start(() => onDone());
  }, [textWidth]);

  const clipWidth = reveal.interpolate({ inputRange: [0, 1], outputRange: [0, textWidth + 14] });

  const nameBlock = (
    <View style={styles.nameBlock}>
      <Text style={styles.nameAr}>يلا نسافر</Text>
      <Text style={styles.nameEn}>Yalla Nsafer</Text>
    </View>
  );

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.container, { opacity: fade }]}>
      {/* Invisible copy, only to measure how wide the name is. */}
      <View
        style={styles.measure}
        onLayout={(e) => setTextWidth(Math.ceil(e.nativeEvent.layout.width))}
      >
        {nameBlock}
      </View>

      <View style={styles.row}>
        <Animated.View style={[styles.clip, { width: clipWidth, height: LOGO_HEIGHT + 8 }]}>
          <View style={[styles.clipInner, { width: textWidth }]}>{nameBlock}</View>
        </Animated.View>
        <Animated.Image
          source={require('../../assets/logo.png')}
          style={{
            width: LOGO_WIDTH,
            height: LOGO_HEIGHT,
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          }}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clip: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  // Pinned to the logo side so the name wipes from its far end toward the logo.
  clipInner: {
    position: 'absolute',
    right: 14,
  },
  measure: {
    position: 'absolute',
    opacity: 0,
  },
  nameBlock: {
    alignItems: 'flex-end',
  },
  nameAr: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 42,
  },
  nameEn: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
