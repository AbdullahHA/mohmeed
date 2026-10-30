import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, radius, spacing } from '../theme/colors';
import type { MainTabParamList } from './types';

// iPhone-style frosted glass: a system blur material (UIVisualEffectView on
// iOS, backdrop-filter on web) with a light tint, a white rim and a soft top
// sheen. Deliberately not expo-glass-effect's GlassView, which crashed on
// device in builds 12-13.
const INACTIVE = '#3A4352';
const PILL_INSET = 4;

const TAB_ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Discover: 'compass-outline',
  Trips: 'briefcase-outline',
  Home: 'home-outline',
  Chat: 'chatbubbles-outline',
  Profile: 'person-outline',
};

const TAB_ACTIVE_ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Discover: 'compass',
  Trips: 'briefcase',
  Home: 'home',
  Chat: 'chatbubbles',
  Profile: 'person',
};

const TAB_LABELS: Record<keyof MainTabParamList, string> = {
  Discover: 'اكتشف',
  Trips: 'رحلاتي',
  Home: 'الرئيسية',
  Chat: 'المحادثة',
  Profile: 'حسابي',
};

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const layoutsRef = useRef<Array<{ x: number; width: number } | undefined>>([]);
  const [pillReady, setPillReady] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const pillWidth = useRef(new Animated.Value(0)).current;

  const moveTo = (index: number, animated: boolean) => {
    const layout = layoutsRef.current[index];
    if (!layout) return;
    const x = layout.x + PILL_INSET;
    const width = layout.width - PILL_INSET * 2;
    if (!animated) {
      translateX.setValue(x);
      pillWidth.setValue(width);
      setPillReady(true);
      return;
    }
    Animated.parallel([
      Animated.spring(translateX, { toValue: x, useNativeDriver: false, bounciness: 6, speed: 14 }),
      Animated.spring(pillWidth, { toValue: width, useNativeDriver: false, bounciness: 6, speed: 14 }),
    ]).start();
  };

  useEffect(() => {
    if (pillReady) moveTo(state.index, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index]);

  const handleTabLayout = (index: number) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    layoutsRef.current[index] = { x, width };
    if (index === state.index) moveTo(index, pillReady);
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, spacing.md) }]} pointerEvents="box-none">
      <View style={styles.shadow}>
        <BlurView intensity={80} tint="systemThinMaterialLight" style={styles.bar}>
          <View pointerEvents="none" style={styles.tint} />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
            locations={[0, 0.55]}
            style={StyleSheet.absoluteFill}
          />
          {pillReady ? (
            <Animated.View
              pointerEvents="none"
              style={[styles.activePill, { width: pillWidth, transform: [{ translateX }] }]}
            />
          ) : null}
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const name = route.name as keyof MainTabParamList;

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                onLayout={handleTabLayout(index)}
                activeOpacity={0.7}
                style={styles.tabItem}
              >
                <Ionicons
                  name={isFocused ? TAB_ACTIVE_ICONS[name] : TAB_ICONS[name]}
                  size={22}
                  color={isFocused ? colors.primary : INACTIVE}
                />
                <Text numberOfLines={1} style={[styles.label, isFocused && styles.activeLabel]}>
                  {TAB_LABELS[name]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  shadow: {
    width: '100%',
    borderRadius: radius.pill,
    shadowColor: '#0A1426',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 10,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    overflow: 'hidden',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  // Android's BlurView doesn't blur without a blur target, so give it a
  // denser frosted fill there; iOS/web keep it light so content shows through.
  tint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.12)',
  },
  activePill: {
    position: 'absolute',
    left: 0,
    top: PILL_INSET + 2,
    bottom: PILL_INSET + 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(19,89,211,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: INACTIVE,
  },
  activeLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
});
