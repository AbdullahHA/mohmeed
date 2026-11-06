import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Text from '../components/Text';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import EmptyState from '../components/EmptyState';
import { VENUE_CATEGORY_ICON, VENUE_CATEGORY_LABEL } from '../utils/venueCategory';
import type { PlaceSearchResult, VenueCategory } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SearchStatus = 'idle' | 'loading' | 'done' | 'error';

const RECENT_SEARCHES_KEY = 'yalla-nsafer:checkin-recent-searches';
const MAX_RECENT_SEARCHES = 6;

const QUICK_CATEGORIES: { category: VenueCategory; query: string }[] = [
  { category: 'restaurant', query: 'مطعم' },
  { category: 'cafe', query: 'مقهى' },
  { category: 'hotel', query: 'فندق' },
  { category: 'shopping', query: 'تسوق' },
  { category: 'attraction', query: 'معلم سياحي' },
];

export default function CheckInSearchScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { searchVenues } = useAppState();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCHES_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setRecentSearches(parsed.filter((s) => typeof s === 'string'));
      } catch {
        // ignore corrupt storage
      }
    });
  }, []);

  const rememberSearch = (term: string) => {
    setRecentSearches((prev) => {
      const next = [term, ...prev.filter((s) => s !== term)].slice(0, MAX_RECENT_SEARCHES);
      AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const removeRecentSearch = (term: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((s) => s !== term);
      AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const runSearch = async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setStatus('loading');
    const found = await searchVenues(trimmed);
    setResults(found);
    setStatus(found.length > 0 ? 'done' : 'error');
    rememberSearch(trimmed);
  };

  const handleSearch = () => runSearch(query);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تسجيل الوصول</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MyCheckIns')} activeOpacity={0.8}>
          <Ionicons name="time-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="ابحث عن المطاعم أو المقاهي أو الفعاليات"
          placeholderTextColor={colors.textFaint}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          textAlign="right"
          autoFocus
        />
        <TouchableOpacity style={styles.searchButton} activeOpacity={0.85} onPress={handleSearch}>
          <Ionicons name="search" size={20} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </View>

      {status === 'loading' && (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {status === 'error' && (
        <EmptyState
          icon="alert-circle-outline"
          title="ما لقينا نتائج"
          subtitle="جرّب اسم مكان آخر أو تأكد من الإملاء"
          actionLabel="امسح البحث"
          onAction={() => {
            setQuery('');
            setStatus('idle');
          }}
        />
      )}

      {status === 'idle' && (
        <View style={styles.idleContent}>
          <Text style={styles.sectionLabel}>تصفح حسب النوع</Text>
          <View style={styles.categoryRow}>
            {QUICK_CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.category}
                style={styles.categoryChip}
                activeOpacity={0.8}
                onPress={() => runSearch(c.query)}
              >
                <View style={styles.categoryChipIcon}>
                  <Ionicons name={VENUE_CATEGORY_ICON[c.category]} size={20} color={colors.primary} />
                </View>
                <Text style={styles.categoryChipText}>{VENUE_CATEGORY_LABEL[c.category]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {recentSearches.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>آخر عمليات البحث</Text>
              <View style={styles.recentList}>
                {recentSearches.map((term) => (
                  <View key={term} style={styles.recentRow}>
                    <TouchableOpacity
                      style={styles.recentRowMain}
                      activeOpacity={0.8}
                      onPress={() => runSearch(term)}
                    >
                      <Ionicons name="time-outline" size={16} color={colors.textFaint} />
                      <Text style={styles.recentRowText}>{term}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeRecentSearch(term)} activeOpacity={0.7}>
                      <Ionicons name="close" size={16} color={colors.textFaint} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}

          {recentSearches.length === 0 && (
            <EmptyState
              icon="search-outline"
              title="دوّر على مكان"
              subtitle="اكتب اسم مطعم أو مقهى أو معلم سياحي عشان تسجّل وصولك له"
            />
          )}
        </View>
      )}

      {status === 'done' && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultRow}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('CheckInVenue', { venue: item })}
            >
              <View style={styles.resultIcon}>
                <Ionicons name={VENUE_CATEGORY_ICON[item.category]} size={20} color={colors.primary} />
              </View>
              <View style={styles.resultTextWrap}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultMeta} numberOfLines={1}>
                  {VENUE_CATEGORY_LABEL[item.category]}
                  {item.address ? ` · ${item.address}` : ''}
                </Text>
              </View>
              <Ionicons name="chevron-back" size={18} color={colors.textFaint} />
            </TouchableOpacity>
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
  searchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 14,
    textAlign: 'right',
  },
  searchButton: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerState: { paddingTop: spacing.xxl },
  idleContent: { flex: 1, paddingHorizontal: spacing.lg },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  categoryRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.md },
  categoryChip: { alignItems: 'center', width: 64, gap: 4 },
  categoryChipIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipText: { color: colors.text, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  recentList: { gap: spacing.xs },
  recentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recentRowMain: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, flex: 1 },
  recentRowText: { color: colors.text, fontSize: 13 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  resultRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTextWrap: { flex: 1 },
  resultName: { color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  resultMeta: { color: colors.textMuted, fontSize: 12, textAlign: 'right', marginTop: 2 },
});
