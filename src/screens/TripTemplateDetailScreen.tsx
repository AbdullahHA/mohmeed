import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../theme/colors';
import { destinations } from '../data/destinations';
import { useAppState } from '../context/AppState';
import { BUDGET_CATEGORY_LABELS } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'TripTemplateDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  hotels: 'bed-outline',
  food: 'restaurant-outline',
  transport: 'car-outline',
  activities: 'sparkles-outline',
  other: 'ellipsis-horizontal-circle-outline',
};

export default function TripTemplateDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { tripTemplates, applyTripTemplate, removeTripTemplate } = useAppState();
  const template = tripTemplates.find((t) => t.id === route.params.templateId);

  if (!template) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>لم يتم العثور على القالب</Text>
      </SafeAreaView>
    );
  }

  const destination = destinations.find((d) => d.id === template.destinationId);
  const isFree = template.price === 0;

  const handleUse = () => {
    const trip = applyTripTemplate(template.id);
    if (trip) navigation.replace('TripDetail', { tripId: trip.id });
  };

  const handleDelete = () => {
    removeTripTemplate(template.id);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: destination?.image }} style={styles.image} />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{template.title}</Text>
          <Text style={styles.subtitle}>
            {destination?.name} · {template.days} أيام · بواسطة {template.authorName}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{isFree ? 'مجاني' : `${template.price} ر.س`}</Text>
          </View>

          <Text style={styles.sectionTitle}>محتوى الخطة</Text>
          <View style={styles.itemsCard}>
            {template.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Ionicons name={CATEGORY_ICONS[item.category]} size={16} color={colors.primary} />
                <Text style={styles.itemText}>{item.label}</Text>
                <Text style={styles.itemCategory}>{BUDGET_CATEGORY_LABELS[item.category]}</Text>
              </View>
            ))}
          </View>

          {isFree ? (
            <TouchableOpacity style={styles.useButton} activeOpacity={0.85} onPress={handleUse}>
              <Ionicons name="add-circle-outline" size={16} color={colors.textOnPrimary} />
              <Text style={styles.useButtonText}>استخدم القالب لرحلتي</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.paidBlock}>
              <View style={styles.paidButton}>
                <Ionicons name="lock-closed-outline" size={16} color={colors.textFaint} />
                <Text style={styles.paidButtonText}>شراء القالب ({template.price} ر.س)</Text>
              </View>
              <Text style={styles.paidNote}>
                ميزة الدفع تجريبية بهذا الإصدار وغير مفعّلة فعليًا — هذا عرض لفكرة القوالب المدفوعة فقط.
              </Text>
            </View>
          )}

          {template.isMine ? (
            <TouchableOpacity style={styles.deleteButton} activeOpacity={0.8} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={14} color={colors.red} />
              <Text style={styles.deleteButtonText}>حذف القالب</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  notFound: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  imageWrap: { width: '100%', height: 220 },
  image: { width: '100%', height: '100%' },
  backButton: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.lg,
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: spacing.xl },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'right' },
  subtitle: { color: colors.textMuted, fontSize: 13, textAlign: 'right', marginTop: 4 },
  priceRow: { alignSelf: 'flex-end', marginTop: spacing.md, marginBottom: spacing.lg },
  priceLabel: { color: colors.accentDark, fontSize: 18, fontWeight: '800' },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '700', textAlign: 'right', marginBottom: spacing.sm },
  itemsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  itemRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  itemText: { color: colors.text, fontSize: 13, textAlign: 'right', flex: 1 },
  itemCategory: { color: colors.textFaint, fontSize: 11 },
  useButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
  },
  useButtonText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 14 },
  paidBlock: { alignItems: 'center' },
  paidButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    width: '100%',
  },
  paidButtonText: { color: colors.textFaint, fontWeight: '700', fontSize: 14 },
  paidNote: { color: colors.textFaint, fontSize: 11, textAlign: 'center', marginTop: spacing.sm, lineHeight: 17 },
  deleteButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  deleteButtonText: { color: colors.red, fontSize: 12, fontWeight: '700' },
});
