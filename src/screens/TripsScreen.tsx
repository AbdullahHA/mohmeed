import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TopBar from '../components/TopBar';
import TripCard from '../components/TripCard';
import EmptyState from '../components/EmptyState';
import { colors, radius, spacing } from '../theme/colors';
import { trips } from '../data/trips';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TripsScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="رحلاتي" subtitle="أهلاً بك، خطط رحلتك القادمة" />

      <TouchableOpacity style={styles.newTripButton} activeOpacity={0.85}>
        <Ionicons name="add" size={18} color={colors.onPrimary} />
        <Text style={styles.newTripText}>رحلة جديدة</Text>
      </TouchableOpacity>

      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TripCard trip={item} onPress={() => navigation.navigate('TripDetail', { tripId: item.id })} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="airplane-outline"
            title="لا توجد رحلات مخططة بعد"
            subtitle="أنشئ أول رحلة وابدأ التخطيط مع أصدقائك."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  newTripButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  newTripText: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  list: {
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
});
