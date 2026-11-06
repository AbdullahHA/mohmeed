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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import CountryPickerModal from '../components/CountryPickerModal';
import { COUNTRY_OPTIONS } from '../data/countryFlags';
import { searchCities, type CitySuggestion } from '../lib/googlePlaces';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Mode = 'country' | 'city';

const FLAG_BY_NAME: Record<string, string> = Object.fromEntries(
  COUNTRY_OPTIONS.map((c) => [c.name, c.flag])
);

function flagForRegion(region: string): string | null {
  if (!region) return null;
  if (FLAG_BY_NAME[region]) return FLAG_BY_NAME[region];
  // Google's region text is often "State، Country" (e.g. "تكساس، الولايات
  // المتحدة") and sometimes shortens a country's name (no "الأمريكية"
  // suffix) relative to our own list — so check the last comma segment
  // against both directions of containment, not just an exact/full match.
  const lastSegment = region.split(/[،,]/).pop()?.trim() ?? region;
  const match = COUNTRY_OPTIONS.find(
    (c) => region.includes(c.name) || c.name.includes(lastSegment) || lastSegment.includes(c.name)
  );
  return match ? match.flag : null;
}

export default function AddVisitedPlaceScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { addManualVisitedPlace } = useAppState();

  const [mode, setMode] = useState<Mode>('country');
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<CitySuggestion[]>([]);
  const [citySearching, setCitySearching] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CitySuggestion | null>(null);

  useEffect(() => {
    if (mode !== 'city' || selectedCity) return;
    const trimmed = cityQuery.trim();
    if (!trimmed) {
      setCityResults([]);
      setCitySearching(false);
      return;
    }
    let cancelled = false;
    setCitySearching(true);
    const timer = setTimeout(() => {
      searchCities(trimmed).then((results) => {
        if (cancelled) return;
        setCityResults(results);
        setCitySearching(false);
      });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cityQuery, mode, selectedCity]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setSelectedCountry(null);
    setSelectedCity(null);
    setCityQuery('');
    setCityResults([]);
  };

  const canSubmit = mode === 'country' ? !!selectedCountry : !!selectedCity;

  const handleAdd = () => {
    if (mode === 'country' && selectedCountry) {
      addManualVisitedPlace(selectedCountry);
      navigation.goBack();
    } else if (mode === 'city' && selectedCity) {
      const label = selectedCity.region ? `${selectedCity.name}، ${selectedCity.region}` : selectedCity.name;
      addManualVisitedPlace(label);
      navigation.goBack();
    }
  };

  const cityRegionFlag = selectedCity ? flagForRegion(selectedCity.region) : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إضافة ختم جديد</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'city' && styles.modeBtnActive]}
          activeOpacity={0.85}
          onPress={() => switchMode('city')}
        >
          <Text style={[styles.modeText, mode === 'city' && styles.modeTextActive]}>مدينة</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'country' && styles.modeBtnActive]}
          activeOpacity={0.85}
          onPress={() => switchMode('country')}
        >
          <Text style={[styles.modeText, mode === 'country' && styles.modeTextActive]}>دولة</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {mode === 'country' ? (
          <>
            <Text style={styles.label}>اختر الدولة اللي سبق وزرتها</Text>
            <TouchableOpacity style={styles.picker} activeOpacity={0.8} onPress={() => setCountryPickerOpen(true)}>
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
              {selectedCountry ? (
                <View style={styles.pickerValueRow}>
                  <Text style={styles.pickerFlag}>{FLAG_BY_NAME[selectedCountry] ?? '🏳️'}</Text>
                  <Text style={styles.pickerValue}>{selectedCountry}</Text>
                </View>
              ) : (
                <Text style={styles.pickerPlaceholder}>اختر دولة...</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>ابحث عن المدينة اللي سبق وزرتها</Text>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color={colors.textFaint} />
              <TextInput
                style={styles.searchInput}
                placeholder="مثال: باريس"
                placeholderTextColor={colors.textFaint}
                value={selectedCity ? selectedCity.name : cityQuery}
                onChangeText={(t) => {
                  setSelectedCity(null);
                  setCityQuery(t);
                }}
                textAlign="right"
                autoFocus
              />
            </View>

            {selectedCity ? (
              <View style={styles.selectedCityRow}>
                {cityRegionFlag ? <Text style={styles.pickerFlag}>{cityRegionFlag}</Text> : null}
                <Text style={styles.selectedCityText}>
                  {selectedCity.name}
                  {selectedCity.region ? `، ${selectedCity.region}` : ''}
                </Text>
              </View>
            ) : citySearching ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
            ) : cityResults.length > 0 ? (
              <FlatList
                style={styles.resultsList}
                data={cityResults}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const flag = flagForRegion(item.region);
                  return (
                    <TouchableOpacity
                      style={styles.resultRow}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedCity(item);
                        setCityResults([]);
                      }}
                    >
                      {flag ? <Text style={styles.pickerFlag}>{flag}</Text> : null}
                      <View style={styles.resultTextWrap}>
                        <Text style={styles.resultName}>{item.name}</Text>
                        {item.region ? <Text style={styles.resultRegion}>{item.region}</Text> : null}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            ) : cityQuery.trim().length > 0 ? (
              <Text style={styles.noResultsText}>ما فيه نتائج</Text>
            ) : null}
          </>
        )}

        <Text style={styles.hint}>يُضاف كختم بملفك الشخصي — جزء من جواز رحلاتك الخاص</Text>

        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
          activeOpacity={0.85}
          disabled={!canSubmit}
          onPress={handleAdd}
        >
          <Text style={styles.submitText}>إضافة الختم</Text>
        </TouchableOpacity>
      </View>

      <CountryPickerModal
        visible={countryPickerOpen}
        title="اختر الدولة"
        onSelect={(name) => setSelectedCountry(name)}
        onClose={() => setCountryPickerOpen(false)}
      />
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
  modeRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  modeTextActive: { color: colors.textOnPrimary },
  body: { padding: spacing.lg },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600', textAlign: 'right', marginBottom: spacing.xs },
  picker: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pickerValueRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  pickerFlag: { fontSize: 18 },
  pickerValue: { color: colors.text, fontSize: 14, fontWeight: '700' },
  pickerPlaceholder: { color: colors.textFaint, fontSize: 14 },
  searchBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchInput: { flex: 1, minWidth: 0, color: colors.text, fontSize: 14, textAlign: 'right' },
  resultsList: { maxHeight: 280, marginTop: spacing.sm },
  resultRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultTextWrap: { flex: 1 },
  resultName: { color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  resultRegion: { color: colors.textFaint, fontSize: 11.5, textAlign: 'right', marginTop: 2 },
  noResultsText: { color: colors.textFaint, fontSize: 12.5, textAlign: 'center', marginTop: spacing.lg },
  selectedCityRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  selectedCityText: { color: colors.primaryDark, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  hint: { color: colors.textFaint, fontSize: 11, textAlign: 'right', marginTop: spacing.sm, lineHeight: 16 },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 14 },
});
