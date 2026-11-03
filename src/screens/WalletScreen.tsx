import React, { useMemo } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useRequireAccount } from '../hooks/useRequireAccount';
import EmptyState from '../components/EmptyState';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function WalletScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { loyaltyMemberships, removeLoyaltyMembership } = useAppState();
  const { requireAccount } = useRequireAccount();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>محفظتي</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => requireAccount('loyalty', () => navigation.navigate('AddLoyaltyMembership'))}
        >
          <Ionicons name="add" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Text style={styles.privacyNote}>برامج الولاء خاصة بك — محد يشوفها غيرك</Text>

      {loyaltyMemberships.length === 0 ? (
        <EmptyState
          icon="card-outline"
          title="ما ضفت أي برنامج ولاء بعد"
          subtitle="أضف أرقام عضويتك بالخطوط عشان تكون جاهزة وقت الحجز"
          actionLabel="أضف برنامج"
          onAction={() => requireAccount('loyalty', () => navigation.navigate('AddLoyaltyMembership'))}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {loyaltyMemberships.map((membership) => (
            <View key={membership.id} style={styles.row}>
              <TouchableOpacity onPress={() => removeLoyaltyMembership(membership.id)} activeOpacity={0.7}>
                <Ionicons name="close-circle-outline" size={18} color={colors.textFaint} />
              </TouchableOpacity>
              <View style={styles.textWrap}>
                <Text style={styles.airline}>{membership.airline}</Text>
                <Text style={styles.number}>{membership.memberNumber}</Text>
              </View>
              <Ionicons name="star-outline" size={16} color={colors.accent} />
            </View>
          ))}
        </ScrollView>
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
  privacyNote: {
    color: colors.textFaint,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  list: { padding: spacing.lg },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  textWrap: { flex: 1 },
  airline: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  number: { color: colors.textMuted, fontSize: 12, textAlign: 'right', marginTop: 1 },
});
