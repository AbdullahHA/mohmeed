import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useRegion } from '../context/RegionContext';
import { CURRENCIES, type Currency } from '../data/currencies';
import { fetchExchangeRates } from '../lib/exchangeRates';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function findCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

function timeAgo(ts: number): string {
  const diffMin = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (diffMin < 1) return 'الآن';
  if (diffMin < 60) return `قبل ${diffMin} ${diffMin === 1 ? 'دقيقة' : 'دقائق'}`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `قبل ${diffHr} ${diffHr === 1 ? 'ساعة' : 'ساعات'}`;
  const diffDay = Math.round(diffHr / 24);
  return `قبل ${diffDay} ${diffDay === 1 ? 'يوم' : 'أيام'}`;
}

export default function CurrencyConverterScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { currency: homeCurrency } = useRegion();

  const [fromCode, setFromCode] = useState(homeCurrency.code);
  const [toCode, setToCode] = useState(homeCurrency.code === 'EUR' ? 'USD' : 'EUR');
  const [amount, setAmount] = useState('500');
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pickerFor, setPickerFor] = useState<'from' | 'to' | null>(null);

  const from = findCurrency(fromCode);
  const to = findCurrency(toCode);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchExchangeRates(fromCode).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (!result) {
        setError(true);
        return;
      }
      setRates(result.rates);
      setFetchedAt(result.fetchedAt);
      setStale(result.stale);
    });
    return () => {
      cancelled = true;
    };
  }, [fromCode]);

  const rate = rates?.[toCode] ?? null;
  const parsedAmount = Number(amount.replace(/[^\d.]/g, ''));
  const converted = rate != null && Number.isFinite(parsedAmount) ? parsedAmount * rate : null;

  const swap = () => {
    setFromCode(toCode);
    setToCode(fromCode);
  };

  const selectCurrency = (code: string) => {
    if (pickerFor === 'from') setFromCode(code);
    else if (pickerFor === 'to') setToCode(code);
    setPickerFor(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>حاسبة تحويل العملات</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.currencyButton} activeOpacity={0.8} onPress={() => setPickerFor('from')}>
            <Text style={styles.currencyFlag}>{from.flag}</Text>
            <Text style={styles.currencyCode}>{from.code}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
          </TouchableOpacity>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textFaint}
            textAlign="right"
          />
        </View>

        <TouchableOpacity style={styles.swapButton} activeOpacity={0.8} onPress={swap}>
          <Ionicons name="swap-vertical" size={20} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.card}>
          <TouchableOpacity style={styles.currencyButton} activeOpacity={0.8} onPress={() => setPickerFor('to')}>
            <Text style={styles.currencyFlag}>{to.flag}</Text>
            <Text style={styles.currencyCode}>{to.code}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
          </TouchableOpacity>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.amountResult} numberOfLines={1}>
              {converted != null ? converted.toLocaleString('ar-SA', { maximumFractionDigits: 2 }) : '—'}
            </Text>
          )}
        </View>

        {error ? (
          <Text style={styles.errorText}>تعذّر جلب أسعار الصرف — تأكد من الاتصال بالإنترنت وحاول مرة ثانية</Text>
        ) : rate != null ? (
          <View style={styles.footerInfo}>
            <Text style={styles.rateText}>
              1 {from.code} = {rate.toLocaleString('ar-SA', { maximumFractionDigits: 4 })} {to.code}
            </Text>
            <Text style={styles.updatedText}>
              {stale ? 'غير متصل — ' : ''}
              آخر تحديث {fetchedAt ? timeAgo(fetchedAt) : ''}
            </Text>
          </View>
        ) : null}
      </View>

      <Modal visible={!!pickerFor} transparent animationType="fade" onRequestClose={() => setPickerFor(null)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerFor(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>اختر العملة</Text>
            <FlatList
              data={CURRENCIES}
              keyExtractor={(item) => item.code}
              style={styles.sheetList}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.sheetRow} activeOpacity={0.7} onPress={() => selectCurrency(item.code)}>
                  <Text style={styles.sheetRowFlag}>{item.flag}</Text>
                  <Text style={styles.sheetRowName}>{item.name}</Text>
                  <Text style={styles.sheetRowCode}>{item.code}</Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
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
  body: { padding: spacing.lg },
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  currencyButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  currencyFlag: { fontSize: 18 },
  currencyCode: { color: colors.text, fontSize: 14, fontWeight: '700' },
  amountInput: { flex: 1, minWidth: 0, color: colors.text, fontSize: 22, fontWeight: '700' },
  amountResult: { flex: 1, minWidth: 0, color: colors.primary, fontSize: 22, fontWeight: '700', textAlign: 'right' },
  swapButton: {
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  footerInfo: { marginTop: spacing.lg, alignItems: 'center', gap: 4 },
  rateText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  updatedText: { color: colors.textFaint, fontSize: 11 },
  errorText: { color: colors.red, fontSize: 12.5, textAlign: 'center', marginTop: spacing.lg, lineHeight: 18 },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: spacing.xl,
    maxHeight: '70%',
  },
  sheetTitle: { color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'right', marginBottom: spacing.md },
  sheetList: { maxHeight: 420 },
  sheetRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetRowFlag: { fontSize: 20 },
  sheetRowName: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600', textAlign: 'right' },
  sheetRowCode: { color: colors.textFaint, fontSize: 12 },
});
