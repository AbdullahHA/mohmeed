import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import TopBar from '../components/TopBar';
import SectionHeader from '../components/SectionHeader';
import DestinationCard from '../components/DestinationCard';
import ServiceTile, { MoreSoonTile } from '../components/ServiceTile';
import { colors, radius, spacing } from '../theme/colors';
import { destinations, heroDestination } from '../data/destinations';
import { services } from '../data/services';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <TopBar />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ImageBackground
          source={{ uri: heroDestination.image }}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroOverlay} />
        </ImageBackground>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} activeOpacity={0.85}>
            <Ionicons name="map-outline" size={18} color={colors.text} />
            <Text style={styles.quickActionText}>خطط رحلتك</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, styles.quickActionActive]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Discover' })}
          >
            <Ionicons name="search" size={18} color={colors.background} />
            <Text style={[styles.quickActionText, styles.quickActionTextActive]}>استكشف</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Chat' })}
          >
            <Ionicons name="chatbubble-outline" size={18} color={colors.text} />
            <Text style={styles.quickActionText}>تحدث معنا</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Game')}
          >
            <Ionicons name="game-controller-outline" size={18} color={colors.text} />
            <Text style={styles.quickActionText}>العب</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.aiSearchBar}>
          <Ionicons name="paper-plane-outline" size={18} color={colors.gold} />
          <TextInput
            style={styles.aiInput}
            placeholder="وش الشائع في جدة الحين؟"
            placeholderTextColor={colors.textFaint}
            value={query}
            onChangeText={setQuery}
            textAlign="right"
          />
        </View>

        <SectionHeader title="الوجهات" actionLabel="عرض الكل" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.destinationsRow}
        >
          {destinations.map((destination) => (
            <DestinationCard key={destination.id} destination={destination} />
          ))}
        </ScrollView>

        <SectionHeader title="الخدمات" actionLabel="عرض الكل" />
        <View style={styles.servicesGrid}>
          {services.map((service) => (
            <ServiceTile key={service.id} service={service} />
          ))}
          <MoreSoonTile />
        </View>

        <View style={styles.membershipBanner}>
          <View style={styles.membershipIcon}>
            <Ionicons name="sparkles" size={18} color={colors.gold} />
          </View>
          <View style={styles.membershipTextWrap}>
            <Text style={styles.membershipTitle}>اكتشف مزايا عضوية ماي ناف</Text>
            <Text style={styles.membershipSubtitle}>استعرض الباقات والمزايا</Text>
          </View>
          <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
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
    height: 220,
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
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
  quickActions: {
    flexDirection: 'row-reverse',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  quickActionActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  quickActionText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionTextActive: {
    color: colors.background,
  },
  aiSearchBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.pill,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  aiInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
  },
  destinationsRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  servicesGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    columnGap: spacing.sm,
    rowGap: spacing.md,
    marginBottom: spacing.xl,
  },
  membershipBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  membershipIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  membershipTextWrap: {
    flex: 1,
  },
  membershipTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  membershipSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
  },
});
