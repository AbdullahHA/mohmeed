import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TopBar from '../components/TopBar';
import SectionHeader from '../components/SectionHeader';
import DestinationCard from '../components/DestinationCard';
import { colors, radius, spacing } from '../theme/colors';
import { destinations, heroDestination } from '../data/destinations';
import { CITIES } from '../data/cities';
import { features } from '../data/features';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function DiscoverScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');

  const filteredCities = useMemo(
    () => CITIES.filter((c) => c.name.includes(query.trim())),
    [query],
  );

  const goToCity = (citySlug: string) => {
    navigation.navigate('MainTabs', { screen: 'Trending', params: { city: citySlug } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TopBar title="اكتشف" subtitle="مدن ووجهات تستاهل الزيارة" />

        <ImageBackground
          source={heroDestination.image}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroOverlay} />
          <Text style={styles.heroText}>استكشف قبل ما تسافر</Text>
        </ImageBackground>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن مدينة..."
            placeholderTextColor={colors.textFaint}
            value={query}
            onChangeText={setQuery}
            textAlign="right"
          />
        </View>

        <SectionHeader title="المدن" />
        <View style={styles.citiesGrid}>
          {filteredCities.map((city) => (
            <TouchableOpacity
              key={city.slug}
              style={styles.cityChip}
              activeOpacity={0.85}
              onPress={() => goToCity(city.slug)}
            >
              <Text style={styles.cityName}>{city.name}</Text>
              <Text style={styles.cityCountry}>{city.country}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionHeader title="وجهات مقترحة لك" actionLabel="شوف الرائج" onActionPress={() => goToCity('riyadh')} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.destinationsRow}
        >
          {destinations.map((destination) => (
            <DestinationCard key={destination.id} destination={destination} />
          ))}
        </ScrollView>

        <SectionHeader title="ليش يلا نسافر؟" />
        <View style={styles.featuresList}>
          {features.map((feature) => (
            <View key={feature.id} style={styles.featureCard}>
              <View style={styles.featureIconWrap}>
                <Ionicons name={feature.icon as any} size={18} color={colors.primary} />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureBody}>{feature.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  hero: {
    height: 160,
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    justifyContent: 'flex-end',
  },
  heroImage: {
    borderRadius: radius.lg,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  heroText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'right',
    padding: spacing.lg,
  },
  searchBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
  },
  citiesGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    columnGap: spacing.sm,
    rowGap: spacing.sm,
    marginBottom: spacing.xl,
  },
  cityChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minWidth: '30%',
  },
  cityName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  cityCountry: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 2,
  },
  destinationsRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  featuresList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  featureCard: {
    flexDirection: 'row-reverse',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  featureIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 4,
  },
  featureBody: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    lineHeight: 18,
  },
});
