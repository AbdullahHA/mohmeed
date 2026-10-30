import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, radius, spacing } from '../theme/colors';
import type { MainTabParamList } from './types';

const TAB_ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Discover: 'compass-outline',
  Trips: 'briefcase-outline',
  Home: 'home',
  Chat: 'chatbubbles-outline',
  Profile: 'person-outline',
};

const TAB_LABELS: Record<keyof MainTabParamList, string> = {
  Discover: 'اكتشف',
  Trips: 'رحلاتي',
  Home: 'الرئيسية',
  Chat: 'المحادثة',
  Profile: 'حسابي',
};

const PILL_INSET = 4;

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const layoutsRef = useRef<Array<{ x: number; width: number } | null>>([]);
  const [pillVisible, setPillVisible] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const pillWidth = useRef(new Animated.Value(0)).current;

  const animateToIndex = (index: number) => {
    const layout = layoutsRef.current[index];
    if (!layout) return;
    const x = layout.x + PILL_INSET;
    const width = layout.width - PILL_INSET * 2;
    if (!pillVisible) {
      translateX.setValue(x);
      pillWidth.setValue(width);
      setPillVisible(true);
      return;
    }
    Animated.parallel([
      Animated.spring(translateX, { toValue: x, useNativeDriver: true, bounciness: 6, speed: 14 }),
      Animated.spring(pillWidth, { toValue: width, useNativeDriver: false, bounciness: 6, speed: 14 }),
    ]).start();
  };

  const handleTabLayout = (index: number) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    layoutsRef.current[index] = { x, width };
    if (index === state.index) {
      animateToIndex(index);
    }
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, spacing.md) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {pillVisible ? (
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
              animateToIndex(index);
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              onLayout={handleTabLayout(index)}
              activeOpacity={0.8}
              style={styles.tabItem}
            >
              <Ionicons
                name={TAB_ICONS[name]}
                size={isFocused ? 20 : 22}
                color={isFocused ? colors.textOnPrimary : colors.textFaint}
              />
              <Text numberOfLines={1} style={[styles.label, isFocused && styles.activeLabel]}>
                {TAB_LABELS[name]}
              </Text>
            </TouchableOpacity>
          );
        })}
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
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    shadowColor: '#0A1426',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingVertical: spacing.sm + 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textFaint,
  },
  activeLabel: {
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  activePill: {
    position: 'absolute',
    top: -spacing.lg,
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
});
