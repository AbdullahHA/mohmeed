import React, { useMemo } from 'react';
import { SafeAreaView, View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import type { AppNotification, NotificationType } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const NOTIFICATION_ICONS: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  friend_request: 'person-add-outline',
  friend_request_accepted: 'checkmark-circle-outline',
  trip_joined: 'people-outline',
  trip_added: 'briefcase-outline',
};

function timeAgo(ts: number): string {
  const diffMin = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (diffMin < 1) return 'الآن';
  if (diffMin < 60) return `قبل ${diffMin} ${diffMin === 1 ? 'دقيقة' : 'دقائق'}`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `قبل ${diffHr} ${diffHr === 1 ? 'ساعة' : 'ساعات'}`;
  const diffDay = Math.round(diffHr / 24);
  return `قبل ${diffDay} ${diffDay === 1 ? 'يوم' : 'أيام'}`;
}

export default function NotificationsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppState();

  const handlePress = (item: AppNotification) => {
    if (!item.read) markNotificationRead(item.id);
    if (item.type === 'friend_request' || item.type === 'friend_request_accepted') {
      navigation.navigate('Friends');
    } else if (item.type === 'trip_joined' || item.type === 'trip_added') {
      const tripId = (item.data as { tripId?: string } | null)?.tripId;
      if (tripId) navigation.navigate('TripDetail', { tripId });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-forward" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الإشعارات</Text>
        {notifications.some((n) => !n.read) ? (
          <TouchableOpacity onPress={() => markAllNotificationsRead()} activeOpacity={0.8}>
            <Text style={styles.markAllText}>اقرأ الكل</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {notifications.length === 0 ? (
          <Text style={styles.emptyText}>ما فيه إشعارات بعد</Text>
        ) : (
          notifications.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.row, !item.read && styles.rowUnread]}
              activeOpacity={0.8}
              onPress={() => handlePress(item)}
            >
              {!item.read ? <View style={styles.unreadDot} /> : null}
              <View style={styles.iconWrap}>
                <Ionicons name={NOTIFICATION_ICONS[item.type]} size={18} color={colors.primary} />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.title}>{item.title}</Text>
                {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
                <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
              </View>
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
  markAllText: { color: colors.primary, fontSize: 12.5, fontWeight: '700' },
  list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  rowUnread: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, gap: 2 },
  title: { color: colors.text, fontSize: 13.5, fontWeight: '700', textAlign: 'right' },
  body: { color: colors.textMuted, fontSize: 12, textAlign: 'right', lineHeight: 18 },
  time: { color: colors.textFaint, fontSize: 10.5, textAlign: 'right', marginTop: 2 },
});
