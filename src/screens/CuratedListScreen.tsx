import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useContent } from '../context/ContentContext';
import { supabase } from '../lib/supabase';
import PlaceCard from '../components/PlaceCard';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'CuratedList'>;

export default function CuratedListScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { places } = useContent();
  const [placeIds, setPlaceIds] = useState<string[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('curated_list_items')
        .select('place_id')
        .eq('list_id', route.params.listId)
        .order('sort_order', { ascending: true });
      setPlaceIds((data ?? []).map((r) => r.place_id));
    })();
  }, [route.params.listId]);

  const listPlaces = useMemo(() => {
    if (!placeIds) return [];
    const byId = new Map(places.map((p) => [p.id, p]));
    return placeIds.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => !!p);
  }, [placeIds, places]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-forward" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{route.params.title}</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {placeIds === null ? (
          <Text style={styles.emptyText}>جاري التحميل...</Text>
        ) : listPlaces.length === 0 ? (
          <Text style={styles.emptyText}>القائمة فاضية حاليًا</Text>
        ) : (
          listPlaces.map((place) => (
            <PlaceCard key={place.id} place={place} onPress={() => navigation.navigate('PlaceDetail', { placeId: place.id })} />
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
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  body: { paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
});
