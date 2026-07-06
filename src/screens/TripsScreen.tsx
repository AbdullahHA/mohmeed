import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import TopBar from '../components/TopBar';
import EmptyState from '../components/EmptyState';
import { colors } from '../theme/colors';

export default function TripsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <TopBar />
      <EmptyState
        icon="airplane-outline"
        title="لا توجد رحلات مخططة بعد"
        subtitle="ابدأ بتخطيط رحلتك القادمة وستظهر هنا مع كل التفاصيل والحجوزات."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
