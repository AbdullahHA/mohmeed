import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Linking,
  TouchableOpacity,
} from 'react-native';
import Text from './Text';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { VISA_STATUS_LABELS, type CountryInfo } from '../types';

type Props = { country: string; onInfoLoaded?: (info: CountryInfo) => void };

export default function CountryInfoCard({ country, onInfoLoaded }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [info, setInfo] = useState<CountryInfo | null | undefined>(undefined);

  useEffect(() => {
    if (country === 'السعودية') {
      setInfo(null);
      return;
    }
    supabase
      .from('country_info')
      .select('*')
      .eq('country', country)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          setInfo(null);
          return;
        }
        const mapped: CountryInfo = {
          country: data.country,
          visaStatus: data.visa_status,
          passportValidityMonths: data.passport_validity_months,
          currency: data.currency,
          plugTypes: data.plug_types ?? [],
          esimAvailable: data.esim_available,
          emergencyNumber: data.emergency_number,
          embassyAddress: data.embassy_address,
          embassyPhone: data.embassy_phone,
          sourceUrl: data.source_url,
          updatedAt: new Date(data.updated_at).getTime(),
        };
        setInfo(mapped);
        onInfoLoaded?.(mapped);
      });
  }, [country]);

  if (!info) return null;

  const rows = [
    info.visaStatus ? { icon: 'document-text-outline' as const, label: 'التأشيرة', value: VISA_STATUS_LABELS[info.visaStatus] } : null,
    info.passportValidityMonths ? { icon: 'book-outline' as const, label: 'صلاحية الجواز', value: `${info.passportValidityMonths} أشهر على الأقل` } : null,
    info.currency ? { icon: 'cash-outline' as const, label: 'العملة', value: info.currency } : null,
    info.plugTypes.length > 0 ? { icon: 'flash-outline' as const, label: 'القابس الكهربائي', value: info.plugTypes.join('، ') } : null,
    { icon: 'cellular-outline' as const, label: 'شريحة eSIM', value: info.esimAvailable ? 'متوفرة' : 'غير مؤكدة' },
    info.emergencyNumber ? { icon: 'call-outline' as const, label: 'رقم الطوارئ', value: info.emergencyNumber } : null,
  ].filter(Boolean) as { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="earth-outline" size={16} color={colors.primary} />
        <Text style={styles.headerTitle}>معلومات الدخول لـ{country}</Text>
      </View>

      {rows.map((r) => (
        <View key={r.label} style={styles.row}>
          <Ionicons name={r.icon} size={16} color={colors.textMuted} />
          <Text style={styles.rowLabel}>{r.label}</Text>
          <Text style={styles.rowValue}>{r.value}</Text>
        </View>
      ))}

      {info.embassyAddress || info.embassyPhone ? (
        <View style={styles.embassyBox}>
          <Text style={styles.embassyTitle}>السفارة السعودية</Text>
          {info.embassyAddress ? <Text style={styles.embassyText}>{info.embassyAddress}</Text> : null}
          {info.embassyPhone ? (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${info.embassyPhone}`)}>
              <Text style={styles.embassyPhone}>{info.embassyPhone}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {info.sourceUrl ? (
        <TouchableOpacity onPress={() => Linking.openURL(info.sourceUrl!)}>
          <Text style={styles.sourceLink}>المصدر الرسمي</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  headerTitle: { color: colors.text, fontSize: fontSize.body, fontWeight: '700' },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs, paddingVertical: 4 },
  rowLabel: { color: colors.textMuted, fontSize: fontSize.base, flex: 1, textAlign: 'right' },
  rowValue: { color: colors.text, fontSize: fontSize.base, fontWeight: '700' },
  embassyBox: { backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, padding: spacing.sm, marginTop: spacing.sm },
  embassyTitle: { color: colors.text, fontSize: fontSize.base, fontWeight: '700', textAlign: 'right' },
  embassyText: { color: colors.textMuted, fontSize: fontSize.base, textAlign: 'right', marginTop: 2 },
  embassyPhone: { color: colors.primary, fontSize: fontSize.base, fontWeight: '700', textAlign: 'right', marginTop: 4 },
  sourceLink: { color: colors.textFaint, fontSize: fontSize.small, textAlign: 'right', marginTop: spacing.sm, textDecorationLine: 'underline' },
});
