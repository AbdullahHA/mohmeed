import React, { useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, cardShadow, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import PersonAvatar from '../components/PersonAvatar';
import type { Friend } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function FriendsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    friends,
    friendsLoading,
    incomingRequests,
    outgoingRequests,
    removeFriend,
    blockUser,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
  } = useAppState();

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

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{friends.length}</Text>
          <Text style={styles.statLabel}>أصدقاء</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{incomingRequests.length}</Text>
          <Text style={styles.statLabel}>طلبات واردة</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{outgoingRequests.length}</Text>
          <Text style={styles.statLabel}>طلبات مرسلة</Text>
        </View>
      </View>

      {friendsLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {incomingRequests.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>طلبات واردة</Text>
              {incomingRequests.map((req) => (
                <View key={req.id} style={styles.row}>
                  <PersonAvatar avatarUrl={req.avatarUrl} />
                  <View style={styles.textWrap}>
                    <Text style={styles.name}>{req.name}</Text>
                    <Text style={styles.username}>@{req.username}</Text>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      activeOpacity={0.85}
                      onPress={async () => {
                        const { error } = await acceptFriendRequest(req.id);
                        if (error) Alert.alert('صار خطأ', error);
                      }}
                    >
                      <Ionicons name="checkmark" size={16} color={colors.textOnPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.declineButton}
                      activeOpacity={0.85}
                      onPress={async () => {
                        const { error } = await declineFriendRequest(req.id);
                        if (error) Alert.alert('صار خطأ', error);
                      }}
                    >
                      <Ionicons name="close" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          ) : null}

          {outgoingRequests.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>طلبات مرسلة</Text>
              {outgoingRequests.map((req) => (
                <View key={req.id} style={styles.row}>
                  <PersonAvatar avatarUrl={req.avatarUrl} />
                  <View style={styles.textWrap}>
                    <Text style={styles.name}>{req.name}</Text>
                    <Text style={styles.username}>@{req.username}</Text>
                  </View>
                  <Text style={styles.pendingLabel}>بانتظار الموافقة</Text>
                  <TouchableOpacity
                    style={styles.actionButton}
                    activeOpacity={0.7}
                    onPress={async () => {
                      const { error } = await cancelFriendRequest(req.id);
                      if (error) Alert.alert('صار خطأ', error);
                    }}
                  >
                    <Ionicons name="close-circle-outline" size={18} color={colors.textFaint} />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          ) : null}

          <Text style={styles.sectionTitle}>الأصدقاء</Text>
          {friends.length === 0 ? (
            <Text style={styles.emptyText}>ما ضفت أصدقاء بعد — اضغط على أيقونة الإضافة فوق</Text>
          ) : (
            friends.map((friend) => (
              <View key={friend.id} style={styles.row}>
                <PersonAvatar avatarUrl={friend.avatarUrl} />
                <View style={styles.textWrap}>
                  <Text style={styles.name}>{friend.name}</Text>
                  <Text style={styles.username}>@{friend.username}</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('FriendChat', { friendId: friend.id })}
                  >
                    <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} activeOpacity={0.7} onPress={() => handleBlock(friend)}>
                    <Ionicons name="hand-left-outline" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} activeOpacity={0.7} onPress={() => handleDelete(friend)}>
                    <Ionicons name="trash-outline" size={18} color={colors.red} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
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
  statsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statItem: { alignItems: 'center', paddingHorizontal: spacing.lg },
  statValue: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },
  loading: { marginTop: spacing.xxl },
  list: { padding: spacing.lg },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl, lineHeight: 20 },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...cardShadow,
  },
  textWrap: { flex: 1 },
  name: { color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  username: { color: colors.textFaint, fontSize: 11, textAlign: 'right', marginTop: 1 },
  actions: { flexDirection: 'row-reverse', alignItems: 'center', gap: 2 },
  actionButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  requestActions: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs },
  acceptButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingLabel: { color: colors.textFaint, fontSize: 10, fontWeight: '600' },
});
