import React, { useMemo } from 'react';
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
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { heroDestination } from '../data/destinations';
import { useAppState } from '../context/AppState';
import { useContent } from '../context/ContentContext';
import { useRequireAccount } from '../hooks/useRequireAccount';
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { tripTemplates, applyTripTemplate, removeTripTemplate } = useAppState();
  const { destinations } = useContent();
  const { requireAccount } = useRequireAccount();
  const template = tripTemplates.find((t) => t.id === route.params.templateId);

  if (!template) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>لم يتم العثور على القالب</Text>
      </SafeAreaView>
    );
  }

  const destination = destinations.find((d) => d.id === template.destinationId);

  const handleUse = () => {
    requireAccount('trip', async () => {
      const trip = await applyTripTemplate(template.id);
      if (trip) navigation.replace('TripDetail', { tripId: trip.id });
    });
  };

  const handleDelete = () => {
    removeTripTemplate(template.id);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrap}>
          <Image source={destination?.image ?? heroDestination.image} style={styles.image} />
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

          <TouchableOpacity style={styles.useButton} activeOpacity={0.85} onPress={handleUse}>
            <Ionicons name="add-circle-outline" size={16} color={colors.textOnPrimary} />
            <Text style={styles.useButtonText}>استخدم القالب لرحلتي</Text>
          </TouchableOpacity>

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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
