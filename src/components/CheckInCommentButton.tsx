import React, { useEffect, useMemo, useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Text from './Text';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

type Props = {
  checkInId: string;
  onPress: () => void;
};

export default function CheckInCommentButton({ checkInId, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('check_in_comments')
      .select('id', { count: 'exact', head: true })
      .eq('check_in_id', checkInId)
      .then(({ count: c }) => {
        if (!cancelled) setCount(c ?? 0);
      });

    const channel = supabase
      .channel(`check-in-comment-count-${checkInId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'check_in_comments', filter: `check_in_id=eq.${checkInId}` },
        () => setCount((prev) => prev + 1)
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [checkInId]);

  return (
    <TouchableOpacity style={styles.button} activeOpacity={0.7} onPress={onPress} hitSlop={6}>
      <Ionicons name="chatbubble-outline" size={15} color={colors.textMuted} />
      {count > 0 ? <Text style={styles.count}>{count}</Text> : null}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  button: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3, paddingVertical: 2, paddingHorizontal: spacing.xs },
  count: { color: colors.textMuted, fontSize: fontSize.small, fontWeight: '700' },
});
