import React, { useMemo } from 'react';
import { SafeAreaView, View, StyleSheet, TouchableOpacity } from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAppState } from '../context/AppState';
import { INTEREST_TAGS } from '../data/destinations';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Row = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
};

export default function TravelPreferencesScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile } = useAuth();
  const { favoriteDestinationIds } = useAppState();

  const rows: Row[] = [
    {
      icon: 'heart-outline',
      label: 'الاهتمامات',
      value: `${profile?.interests.length ?? 0} من ${INTEREST_TAGS.length}`,
      onPress: () => navigation.navigate('Interests'),
    },
    {
      icon: 'earth-outline',
      label: 'الوجهات المفضلة',
      value: `${favoriteDestinationIds.length}`,
      onPress: () => navigation.navigate('FavoriteDestinations'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفضيلات السفر</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.card}>
          {rows.map((row, index) => (
            <React.Fragment key={row.label}>
              <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={row.onPress}>
                <Ionicons name={row.icon} size={18} color={colors.textMuted} />
                <Text style={styles.menuRowText}>{row.label}</Text>
                <Text style={styles.menuRowValue}>{row.value}</Text>
                <Ionicons name="chevron-back" size={16} color={colors.textFaint} />
              </TouchableOpacity>
              {index < rows.length - 1 ? <View style={styles.divider} /> : null}
            </React.Fragment>
          ))}
        </View>
        <Text style={styles.hint}>قريبًا: مطار بلد الإقامة، شركات الطيران، وسلاسل الفنادق المفضلة.</Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: { flex: 1, color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: colors.border },
  menuRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  menuRowText: { flex: 1, color: colors.text, fontSize: 14.5, fontWeight: '600', textAlign: 'right' },
  menuRowValue: { color: colors.textFaint, fontSize: 12 },
  hint: { color: colors.textFaint, fontSize: 11.5, textAlign: 'right', lineHeight: 18, marginTop: spacing.lg },
});
