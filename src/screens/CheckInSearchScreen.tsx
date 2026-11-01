import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import EmptyState from '../components/EmptyState';
import { VENUE_CATEGORY_ICON, VENUE_CATEGORY_LABEL } from '../utils/venueCategory';
import type { PlaceSearchResult } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SearchStatus = 'idle' | 'loading' | 'done' | 'error';

export default function CheckInSearchScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { searchVenues } = useAppState();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>('idle');

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setStatus('loading');
    const found = await searchVenues(trimmed);
    setResults(found);
    setStatus(found.length > 0 ? 'done' : 'error');
  };

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
        />
      )}

      {status === 'idle' && (
        <EmptyState
          icon="search-outline"
          title="دوّر على مكان"
          subtitle="اكتب اسم مطعم أو مقهى أو معلم سياحي عشان تسجّل وصولك له"
        />
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
