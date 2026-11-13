import React, { useMemo, useState } from 'react';
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
import { fontSize, radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useRegion } from '../context/RegionContext';
import { REGION_COUNTRIES, type RegionCountry } from '../data/regionCountries';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CountrySettingScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { country, setCountryCode } = useRegion();
  const [selected, setSelected] = useState(country.code);

  const handleSave = () => {
    setCountryCode(selected);
    navigation.goBack();
  };

  const renderItem = ({ item }: { item: RegionCountry }) => {
    const active = item.code === selected;
    return (
      <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => setSelected(item.code)}>
        <View style={[styles.radio, active && styles.radioActive]}>{active ? <View style={styles.radioDot} /> : null}</View>
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
        <Text style={styles.headerTitle}>الرجاء اختيار دولتك</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
        <Text style={styles.infoText}>نستخدم هذا لعرض عملتك الافتراضية بميزانيات رحلاتك، بدون تحويل أسعار فعلي</Text>
      </View>

      <FlatList
        data={REGION_COUNTRIES}
        keyExtractor={(item) => item.code}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSave}>
        <Text style={styles.saveButtonText}>حفظ</Text>
      </TouchableOpacity>
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
  headerTitle: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700' },
  infoBox: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    margin: spacing.lg,
    marginBottom: 0,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  infoText: { flex: 1, color: colors.text, fontSize: fontSize.base, textAlign: 'right', lineHeight: 18 },
  list: { padding: spacing.lg },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowFlag: { fontSize: fontSize.title },
  rowName: { flex: 1, color: colors.text, fontSize: fontSize.bodyLg, fontWeight: '600', textAlign: 'right' },
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
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    margin: spacing.lg,
  },
  saveButtonText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: fontSize.bodyLg },
});
