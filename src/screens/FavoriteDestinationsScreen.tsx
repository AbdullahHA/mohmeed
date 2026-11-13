import React, { useMemo, useState } from 'react';
import { SafeAreaView, View, Image, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fontSize, radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useContent } from '../context/ContentContext';
import { useRequireAccount } from '../hooks/useRequireAccount';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function FavoriteDestinationsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { destinations } = useContent();
  const { favoriteDestinationIds, toggleFavoriteDestination } = useAppState();
  const { requireAccount } = useRequireAccount();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return destinations;
    return destinations.filter(
      (d) => d.name.toLowerCase().includes(q) || d.country.toLowerCase().includes(q)
    );
  }, [destinations, query]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الوجهات المفضلة</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={colors.textFaint} />
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث عن دولة أو مدينة..."
          placeholderTextColor={colors.textFaint}
          value={query}
          onChangeText={setQuery}
          textAlign="right"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.emptyText}>ما لقينا وجهة بهذا الاسم</Text>}
        renderItem={({ item }) => {
          const active = favoriteDestinationIds.includes(item.id);
          return (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('DestinationDetail', { destinationId: item.id })}
            >
              <Image source={item.image} style={styles.rowImage} />
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.rowSubtitle} numberOfLines={1}>{item.country}</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={8}
                onPress={() => requireAccount('favoriteDestination', () => toggleFavoriteDestination(item.id))}
              >
                <Ionicons name={active ? 'heart' : 'heart-outline'} size={22} color={colors.heart} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
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
  headerTitle: { flex: 1, color: colors.text, fontSize: fontSize.title, fontWeight: '700', textAlign: 'center' },
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
  searchWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: fontSize.bodyLg, paddingVertical: spacing.sm + 2 },
  list: { padding: spacing.lg, paddingTop: 0, gap: spacing.md, paddingBottom: spacing.xxl },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  rowImage: { width: 56, height: 56, borderRadius: radius.md },
  rowBody: { flex: 1, gap: 3 },
  rowTitle: { color: colors.text, fontSize: fontSize.bodyLg, fontWeight: '700', textAlign: 'right' },
  rowSubtitle: { color: colors.textMuted, fontSize: fontSize.base, textAlign: 'right' },
});
