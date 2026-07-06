import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import TopBar from '../components/TopBar';
import EmptyState from '../components/EmptyState';
import { colors } from '../theme/colors';

export default function BookingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <TopBar />
      <EmptyState
        icon="calendar-outline"
        title="لا توجد حجوزات حالياً"
        subtitle="حجوزاتك في الفنادق والمطاعم والأنشطة ستظهر هنا فور تأكيدها."
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
