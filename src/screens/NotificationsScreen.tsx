import React, { useMemo, useState } from 'react';
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
type Filter = 'all' | 'trips' | 'friends';

const NOTIFICATION_ICONS: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  friend_request: 'person-add-outline',
  friend_request_accepted: 'checkmark-circle-outline',
  trip_joined: 'people-outline',
  trip_added: 'briefcase-outline',
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  friend_request: '#6b55df',
  friend_request_accepted: '#1f9d63',
  trip_joined: '#2a9bb0',
  trip_added: '#e07b24',
};

const FRIEND_TYPES: NotificationType[] = ['friend_request', 'friend_request_accepted'];
const TRIP_TYPES: NotificationType[] = ['trip_joined', 'trip_added'];

function timeAgo(ts: number): string {
  const diffMin = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (diffMin < 1) return 'الآن';
  if (diffMin < 60) return `قبل ${diffMin} ${diffMin === 1 ? 'دقيقة' : 'دقائق'}`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `قبل ${diffHr} ${diffHr === 1 ? 'ساعة' : 'ساعات'}`;
  const diffDay = Math.round(diffHr / 24);
  return `قبل ${diffDay} ${diffDay === 1 ? 'يوم' : 'أيام'}`;
}

function dayGroup(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((startOfToday.getTime() - startOfDay.getTime()) / 86400000);
  if (diff === 0) return 'اليوم';
  if (diff === 1) return 'أمس';
  if (diff > 1 && diff < 7) return 'هالأسبوع';
  return 'أقدم';
}

export default function NotificationsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { notifications, markNotificationRead, markAllNotificationsRead, acceptFriendRequest, declineFriendRequest } =
    useAppState();
  const [filter, setFilter] = useState<Filter>('all');
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [handledIds, setHandledIds] = useState<Set<string>>(new Set());

  const tripNotifications = notifications.filter((n) => TRIP_TYPES.includes(n.type));
  const friendNotifications = notifications.filter((n) => FRIEND_TYPES.includes(n.type));
  const visible =
    filter === 'trips' ? tripNotifications : filter === 'friends' ? friendNotifications : notifications;

  const groups = useMemo(() => {
    const order = ['اليوم', 'أمس', 'هالأسبوع', 'أقدم'];
    const map = new Map<string, AppNotification[]>();
    for (const n of visible) {
      const g = dayGroup(n.createdAt);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(n);
    }
    return order.filter((g) => map.has(g)).map((g) => ({ label: g, items: map.get(g)! }));
  }, [visible]);

  const handlePress = (item: AppNotification) => {
    if (!item.read) markNotificationRead(item.id);
    if (item.type === 'friend_request' || item.type === 'friend_request_accepted') {
      navigation.navigate('Friends');
    } else if (item.type === 'trip_joined' || item.type === 'trip_added') {
      const tripId = (item.data as { tripId?: string } | null)?.tripId;
      if (tripId) navigation.navigate('TripDetail', { tripId });
    }
  };

  const handleRespond = async (item: AppNotification, accept: boolean) => {
    const senderId = (item.data as { senderId?: string } | null)?.senderId;
    if (!senderId) return;
    setRespondingId(item.id);
    if (!item.read) markNotificationRead(item.id);
    if (accept) await acceptFriendRequest(senderId);
    else await declineFriendRequest(senderId);
    setRespondingId(null);
    setHandledIds((prev) => new Set(prev).add(item.id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الإشعارات</Text>
        {notifications.some((n) => !n.read) ? (
          <TouchableOpacity onPress={() => markAllNotificationsRead()} activeOpacity={0.8}>
            <Text style={styles.markAllText}>قراءة الكل</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <View style={styles.filterRow}>
        {([
          ['all', 'الكل'],
          ['trips', 'رحلاتي'],
          ['friends', 'الأصدقاء'],
        ] as const).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterChip, filter === key && styles.filterChipActive]}
            activeOpacity={0.85}
            onPress={() => setFilter(key)}
          >
            <Text style={[styles.filterChipText, filter === key && styles.filterChipTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {visible.length === 0 ? (
          <Text style={styles.emptyText}>ما فيه إشعارات بعد</Text>
        ) : (
          groups.map((group) => (
            <View key={group.label}>
              <Text style={styles.groupHeading}>{group.label}</Text>
              {group.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.row, !item.read && styles.rowUnread]}
                  activeOpacity={0.8}
                  onPress={() => handlePress(item)}
                >
                  <View style={styles.iconColWrap}>
                    <View style={[styles.iconCircle, { backgroundColor: NOTIFICATION_COLORS[item.type] }]}>
                      <Ionicons name={NOTIFICATION_ICONS[item.type]} size={18} color="#fff" />
                    </View>
                    {!item.read ? <View style={styles.unreadDot} /> : null}
                  </View>
                  <View style={styles.textWrap}>
                    <Text style={styles.title}>{item.title}</Text>
                    {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
                    <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
                    {item.type === 'friend_request' && !handledIds.has(item.id) ? (
                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          style={styles.acceptButton}
                          activeOpacity={0.85}
                          disabled={respondingId === item.id}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleRespond(item, true);
                          }}
                        >
                          <Text style={styles.acceptButtonText}>قبول</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.declineButton}
                          activeOpacity={0.85}
                          disabled={respondingId === item.id}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleRespond(item, false);
                          }}
                        >
                          <Text style={styles.declineButtonText}>رفض</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
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
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: { flex: 1, color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllText: { color: colors.primary, fontSize: 12.5, fontWeight: '700' },
  filterRow: { flexDirection: 'row-reverse', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  filterChipActive: { backgroundColor: colors.text },
  filterChipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: colors.background },
  list: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxl },
  groupHeading: { color: colors.textMuted, fontSize: 12, fontWeight: '700', textAlign: 'right', marginTop: spacing.md, marginBottom: spacing.sm },
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
    marginBottom: spacing.sm,
  },
  rowUnread: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  iconColWrap: { position: 'relative' },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  textWrap: { flex: 1, gap: 2 },
  title: { color: colors.text, fontSize: 13.5, fontWeight: '700', textAlign: 'right' },
  body: { color: colors.textMuted, fontSize: 12, textAlign: 'right', lineHeight: 18 },
  time: { color: colors.textFaint, fontSize: 10.5, textAlign: 'right', marginTop: 2 },
  actionsRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm },
  acceptButton: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  acceptButtonText: { color: colors.textOnPrimary, fontSize: 12.5, fontWeight: '700' },
  declineButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  declineButtonText: { color: colors.textMuted, fontSize: 12.5, fontWeight: '700' },
});
