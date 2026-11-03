import React, { useMemo } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useRegion } from '../context/RegionContext';
import { CURRENCIES, type Currency } from '../data/currencies';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CurrencySettingScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { currency, setCurrencyCode } = useRegion();

  const handleSelect = (code: string) => {
    setCurrencyCode(code);
    navigation.goBack();
  };

  const renderItem = ({ item }: { item: Currency }) => {
    const active = item.code === currency.code;
    return (
      <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => handleSelect(item.code)}>
        <View style={[styles.radio, active && styles.radioActive]}>{active ? <View style={styles.radioDot} /> : null}</View>
        <Text style={styles.rowCode}>{item.code}</Text>
        <Text style={styles.rowName}>{item.name}</Text>
        <Text style={styles.rowFlag}>{item.flag}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>العملة</Text>
        <View style={{ width: 22 }} />
      </View>

      <Text style={styles.hint}>يغيّر رمز العملة الظاهر بميزانيات رحلاتك فقط، بدون تحويل سعر صرف فعلي</Text>

      <FlatList
        data={CURRENCIES}
        keyExtractor={(item) => item.code}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
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
  hint: { color: colors.textFaint, fontSize: 11, textAlign: 'right', padding: spacing.lg, paddingBottom: 0, lineHeight: 16 },
  list: { padding: spacing.lg },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowFlag: { fontSize: 20 },
  rowCode: { color: colors.textFaint, fontSize: 12, width: 40, textAlign: 'right' },
  rowName: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600', textAlign: 'right' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.primary },
});
