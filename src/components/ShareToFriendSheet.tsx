import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Text from './Text';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import PersonAvatar from './PersonAvatar';
import type { Friend } from '../types';

type Props = {
  visible: boolean;
  friends: Friend[];
  onClose: () => void;
  onPick: (friend: Friend) => void;
};

export default function ShareToFriendSheet({ visible, friends, onClose, onPick }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.headerRow}>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
            <Text style={styles.title}>شارك مع صديق</Text>
          </View>

          {friends.length === 0 ? (
            <Text style={styles.emptyText}>ما عندك أصدقاء بعد تقدر تشارك معهم</Text>
          ) : (
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              {friends.map((f) => (
                <Pressable key={f.id} style={styles.friendRow} onPress={() => onPick(f)}>
                  <Ionicons name="chevron-back" size={16} color={colors.textFaint} />
                  <Text style={styles.friendName}>{f.name}</Text>
                  <PersonAvatar avatarUrl={f.avatarUrl ?? null} size={36} />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  title: { color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'right', flex: 1 },
  emptyText: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
  scroll: { gap: spacing.sm },
  friendRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  friendName: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right' },
});
