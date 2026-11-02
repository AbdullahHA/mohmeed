import React, { useMemo } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import EmptyState from '../components/EmptyState';
import { VENUE_CATEGORY_ICON, VENUE_CATEGORY_LABEL } from '../utils/venueCategory';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
}

export default function MyCheckInsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { myCheckIns, myCheckInsLoading } = useAppState();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تسجيلات وصولي</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CheckInSearch')} activeOpacity={0.8}>
          <Ionicons name="add" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {myCheckInsLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : myCheckIns.length === 0 ? (
        <EmptyState
          icon="location-outline"
          title="لا توجد عمليات تسجيل وصول"
          subtitle="سجّل وصولك لأول مكان عشان يبدأ سجلك يتكوّن هنا"
          actionLabel="دوّر على مكان"
          onAction={() => navigation.navigate('CheckInSearch')}
        />
      ) : (
        <FlatList
          data={myCheckIns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name={VENUE_CATEGORY_ICON[item.category]} size={20} color={colors.primary} />
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowName}>{item.venueName}</Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {VENUE_CATEGORY_LABEL[item.category]}
                  {item.venueAddress ? ` · ${item.venueAddress}` : ''}
                </Text>
              </View>
              <Text style={styles.rowDate}>{formatDate(item.createdAt)}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.lg, gap: spacing.sm },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextWrap: { flex: 1 },
  rowName: { color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  rowMeta: { color: colors.textMuted, fontSize: 12, textAlign: 'right', marginTop: 2 },
  rowDate: { color: colors.textFaint, fontSize: 11, fontWeight: '600' },
});
