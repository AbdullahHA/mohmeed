import React, { useEffect, useMemo, useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Text from './Text';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

type Props = {
  checkInId: string;
  meId: string;
};

export default function CheckInLikeButton({ checkInId, meId }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [likerIds, setLikerIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('check_in_likes')
      .select('user_id')
      .eq('check_in_id', checkInId)
      .then(({ data }) => {
        if (!cancelled) setLikerIds((data ?? []).map((r: any) => r.user_id));
      });

    const channel = supabase
      .channel(`check-in-likes-${checkInId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'check_in_likes', filter: `check_in_id=eq.${checkInId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const uid = (payload.new as any).user_id;
            setLikerIds((prev) => (prev.includes(uid) ? prev : [...prev, uid]));
          } else if (payload.eventType === 'DELETE') {
            const uid = (payload.old as any).user_id;
            setLikerIds((prev) => prev.filter((id) => id !== uid));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [checkInId]);

  const liked = likerIds.includes(meId);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    if (liked) {
      await supabase.from('check_in_likes').delete().eq('check_in_id', checkInId).eq('user_id', meId);
      setLikerIds((prev) => prev.filter((id) => id !== meId));
    } else {
      await supabase.from('check_in_likes').insert({ check_in_id: checkInId, user_id: meId });
      setLikerIds((prev) => [...prev, meId]);
    }
    setBusy(false);
  };

  return (
    <TouchableOpacity style={styles.button} activeOpacity={0.7} onPress={toggle} disabled={busy} hitSlop={6}>
      <Ionicons name={liked ? 'heart' : 'heart-outline'} size={16} color={liked ? colors.heart : colors.textMuted} />
      {likerIds.length > 0 ? <Text style={[styles.count, liked && styles.countActive]}>{likerIds.length}</Text> : null}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  button: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3, paddingVertical: 2, paddingHorizontal: spacing.xs },
  count: { color: colors.textMuted, fontSize: fontSize.small, fontWeight: '700' },
  countActive: { color: colors.heart },
});
