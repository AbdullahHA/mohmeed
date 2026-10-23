import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../theme/colors';
import { heroDestination } from '../data/destinations';
import { useAppState } from '../context/AppState';
import { useContent } from '../context/ContentContext';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TripTemplatesScreen() {
  const navigation = useNavigation<Nav>();
  const { tripTemplates } = useAppState();
  const { destinations } = useContent();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-forward" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>قوالب الرحلات</Text>
        <TouchableOpacity
          style={styles.createButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CreateTripTemplate')}
        >
          <Ionicons name="add" size={16} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={tripTemplates}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const destination = destinations.find((d) => d.id === item.destinationId);
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('TripTemplateDetail', { templateId: item.id })}
            >
              <ImageBackground
                source={destination?.image ?? heroDestination.image}
                style={styles.cardImage}
                imageStyle={styles.cardImageRadius}
              >
                <View style={styles.cardOverlay} />
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeText}>{item.price === 0 ? 'مجاني' : `${item.price} ر.س`}</Text>
                </View>
                {item.isMine ? (
                  <View style={styles.mineBadge}>
                    <Text style={styles.mineBadgeText}>من إنشائك</Text>
                  </View>
                ) : null}
                <View style={styles.cardTextWrap}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSubtitle}>
                    {destination?.name} · {item.days} أيام · بواسطة {item.authorName}
                  </Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  createButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  cardImage: { height: 150, justifyContent: 'flex-end' },
  cardImageRadius: {},
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  priceBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  priceBadgeText: { color: colors.textOnPrimary, fontSize: 11, fontWeight: '700' },
  mineBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  mineBadgeText: { color: colors.textOnPrimary, fontSize: 11, fontWeight: '700' },
  cardTextWrap: { padding: spacing.md },
  cardTitle: { color: colors.textOnPrimary, fontSize: 16, fontWeight: '700', textAlign: 'right' },
  cardSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 11, textAlign: 'right', marginTop: 2 },
});
