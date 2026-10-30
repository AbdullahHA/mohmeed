import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, spacing.md) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const name = route.name as keyof MainTabParamList;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isFocused) {
            return (
              <TouchableOpacity key={route.key} onPress={onPress} activeOpacity={0.85} style={styles.tabItem}>
                <View style={styles.activePill}>
                  <Ionicons name={TAB_ICONS[name]} size={20} color={colors.textOnPrimary} />
                  <Text numberOfLines={1} style={styles.activeLabel}>
                    {TAB_LABELS[name]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.8}
              style={styles.tabItem}
            >
              <Ionicons name={TAB_ICONS[name]} size={22} color={colors.textFaint} />
              <Text numberOfLines={1} style={styles.label}>
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
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textFaint,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    marginTop: -spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  activeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
});
