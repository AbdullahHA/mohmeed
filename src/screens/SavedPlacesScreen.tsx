import React, { useMemo } from 'react';
import { SafeAreaView, View, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useContent } from '../context/ContentContext';
import { PLACE_TYPE_LABELS } from '../data/places';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SavedPlacesScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { recommendedPlaceIds, toggleRecommended } = useAppState();
  const { places, destinations } = useContent();

  const savedPlaces = useMemo(
    () => places.filter((p) => recommendedPlaceIds.includes(p.id)),
    [places, recommendedPlaceIds]
  );
  const destinationName = (id: string) => destinations.find((d) => d.id === id)?.name;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-forward" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>محفوظاتي</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {savedPlaces.length === 0 ? (
          <Text style={styles.emptyText}>ما حفظت أي مكان بعد — اضغط على القلب بأي مكان عشان يظهر هنا</Text>
        ) : (
          savedPlaces.map((place) => (
            <TouchableOpacity
              key={place.id}
              style={styles.row}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('PlaceDetail', { placeId: place.id })}
            >
              <Image source={place.image} style={styles.rowImage} />
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle} numberOfLines={1}>{place.name}</Text>
                <Text style={styles.rowSubtitle} numberOfLines={1}>
                  {PLACE_TYPE_LABELS[place.type]} · {destinationName(place.destinationId) ?? ''}
                </Text>
                <View style={styles.rowMeta}>
                  <Ionicons name="star" size={12} color={colors.accentDark} />
                  <Text style={styles.rowMetaText}>{place.rating.toFixed(1)}</Text>
                </View>
              </View>
              <TouchableOpacity activeOpacity={0.7} onPress={() => toggleRecommended(place.id)} hitSlop={8}>
                <Ionicons name="heart" size={20} color={colors.heart} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl, lineHeight: 20 },
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
  rowTitle: { color: colors.text, fontSize: 13.5, fontWeight: '700', textAlign: 'right' },
  rowSubtitle: { color: colors.textMuted, fontSize: 11.5, textAlign: 'right' },
  rowMeta: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3 },
  rowMetaText: { color: colors.accentDark, fontSize: 11.5, fontWeight: '700' },
});
