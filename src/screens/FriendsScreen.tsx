import React, { useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import type { Friend } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function FriendsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { friends, friendsLoading, removeFriend, blockUser } = useAppState();

  const handleDelete = (friend: Friend) => {
    Alert.alert('حذف الصديق؟', `بتحذف ${friend.name} من قائمة أصدقائك.`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          const { error } = await removeFriend(friend.id);
          if (error) Alert.alert('صار خطأ', error);
        },
      },
    ]);
  };

  const handleBlock = (friend: Friend) => {
    Alert.alert(
      'حظر هذا الشخص؟',
      `بتحذف ${friend.name} من أصدقائك وما بيقدر يضيفك أو يراسلك مرة ثانية.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حظر',
          style: 'destructive',
          onPress: async () => {
            const { error } = await blockUser(friend.id);
            if (error) Alert.alert('صار خطأ', error);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-forward" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>أصدقائي</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddFriend')} activeOpacity={0.8}>
          <Ionicons name="person-add-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {friendsLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>ما ضفت أصدقاء بعد — اضغط على أيقونة الإضافة فوق</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.avatarPhoto} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: item.color }]}>
                  <Text style={styles.avatarEmoji}>{item.emoji}</Text>
                </View>
              )}
              <View style={styles.textWrap}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.username}>@{item.username}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('FriendChat', { friendId: item.id })}
                >
                  <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} activeOpacity={0.7} onPress={() => handleBlock(item)}>
                  <Ionicons name="hand-left-outline" size={18} color={colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} activeOpacity={0.7} onPress={() => handleDelete(item)}>
                  <Ionicons name="trash-outline" size={18} color={colors.red} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
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
  loading: { marginTop: spacing.xxl },
  list: { padding: spacing.lg },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl, lineHeight: 20 },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  avatar: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 18 },
  avatarPhoto: { width: 44, height: 44, borderRadius: radius.pill },
  textWrap: { flex: 1 },
  name: { color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  username: { color: colors.textFaint, fontSize: 11, textAlign: 'right', marginTop: 1 },
  actions: { flexDirection: 'row-reverse', alignItems: 'center', gap: 2 },
  actionButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
});
