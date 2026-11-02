import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import PersonAvatar from '../components/PersonAvatar';
import EmptyState from '../components/EmptyState';
import type { Friend } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'FollowList'>;

export default function FollowListScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { loadFollowers, loadFollowing } = useAppState();
  const [list, setList] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loader = params.mode === 'followers' ? loadFollowers : loadFollowing;
    loader(params.userId).then((result) => {
      if (active) {
        setList(result);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.userId, params.mode]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{params.mode === 'followers' ? 'المتابعون' : 'يتابع'}</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : list.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title={params.mode === 'followers' ? 'ولا متابع لين الحين' : 'ما يتابع أحد لين الحين'}
          subtitle=""
        />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.8}
              onPress={() => navigation.push('UserProfile', { userId: item.id })}
            >
              <PersonAvatar avatarUrl={item.avatarUrl} size={44} />
              <View style={styles.textWrap}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.username}>@{item.username}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  list: { padding: spacing.lg, gap: spacing.sm },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  textWrap: { flex: 1 },
  name: { color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  username: { color: colors.textFaint, fontSize: 11, textAlign: 'right', marginTop: 1 },
});
