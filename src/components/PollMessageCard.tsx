import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Text from './Text';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import type { TripMessagePoll, TripPollVote } from '../types';

type Props = {
  pollId: string;
  meId: string;
};

function mapPoll(row: any): TripMessagePoll {
  return {
    id: row.id,
    tripId: row.trip_id,
    createdBy: row.created_by,
    question: row.question,
    options: row.options,
    allowMultiple: row.allow_multiple,
  };
}

function mapVote(row: any): TripPollVote {
  return { pollId: row.poll_id, voterId: row.voter_id, optionIndex: row.option_index };
}

export default function PollMessageCard({ pollId, meId }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [poll, setPoll] = useState<TripMessagePoll | null>(null);
  const [votes, setVotes] = useState<TripPollVote[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [{ data: pollRow }, { data: voteRows }] = await Promise.all([
        supabase.from('trip_message_polls').select('*').eq('id', pollId).single(),
        supabase.from('trip_poll_votes').select('*').eq('poll_id', pollId),
      ]);
      if (cancelled) return;
      if (pollRow) setPoll(mapPoll(pollRow));
      setVotes((voteRows ?? []).map(mapVote));
    })();

    const channel = supabase
      .channel(`poll-votes-${pollId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_poll_votes', filter: `poll_id=eq.${pollId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = mapVote(payload.new);
            setVotes((prev) =>
              prev.some((v) => v.voterId === row.voterId && v.optionIndex === row.optionIndex) ? prev : [...prev, row]
            );
          } else if (payload.eventType === 'DELETE') {
            const row = payload.old as any;
            setVotes((prev) => prev.filter((v) => !(v.voterId === row.voter_id && v.optionIndex === row.option_index)));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [pollId]);

  if (!poll) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const myVotes = votes.filter((v) => v.voterId === meId).map((v) => v.optionIndex);
  const totalVoters = new Set(votes.map((v) => v.voterId)).size;

  const toggleOption = async (index: number) => {
    if (busy) return;
    setBusy(true);
    const alreadyMine = myVotes.includes(index);
    if (alreadyMine) {
      await supabase.from('trip_poll_votes').delete().eq('poll_id', pollId).eq('voter_id', meId).eq('option_index', index);
      setVotes((prev) => prev.filter((v) => !(v.voterId === meId && v.optionIndex === index)));
    } else {
      if (!poll.allowMultiple && myVotes.length > 0) {
        await supabase.from('trip_poll_votes').delete().eq('poll_id', pollId).eq('voter_id', meId);
        setVotes((prev) => prev.filter((v) => v.voterId !== meId));
      }
      await supabase.from('trip_poll_votes').insert({ poll_id: pollId, voter_id: meId, option_index: index });
      setVotes((prev) => [...prev, { pollId, voterId: meId, optionIndex: index }]);
    }
    setBusy(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.questionRow}>
        <Ionicons name="bar-chart-outline" size={16} color={colors.primary} />
        <Text style={styles.question}>{poll.question}</Text>
      </View>

      {poll.options.map((option, i) => {
        const count = votes.filter((v) => v.optionIndex === i).length;
        const pct = totalVoters > 0 ? Math.round((count / totalVoters) * 100) : 0;
        const mine = myVotes.includes(i);
        return (
          <Pressable key={i} style={styles.optionRow} onPress={() => toggleOption(i)} disabled={busy}>
            <View style={styles.optionBarWrap}>
              <View style={[styles.optionBarFill, { width: `${pct}%` }, mine && styles.optionBarFillMine]} />
              <View style={styles.optionContent}>
                <Text style={[styles.optionText, mine && styles.optionTextMine]} numberOfLines={1}>
                  {option}
                </Text>
                <View style={styles.optionMeta}>
                  {mine ? <Ionicons name="checkmark-circle" size={14} color={colors.primary} /> : null}
                  <Text style={styles.optionCount}>{count > 0 ? `${count} · ${pct}%` : ''}</Text>
                </View>
              </View>
            </View>
          </Pressable>
        );
      })}

      <Text style={styles.footer}>
        {totalVoters > 0 ? `${totalVoters} صوّت` : 'لسه ما صوّت أحد'}
        {poll.allowMultiple ? ' · يسمح بأكثر من خيار' : ''}
      </Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minWidth: 220,
    maxWidth: '85%',
    alignSelf: 'flex-start',
    gap: spacing.sm,
  },
  questionRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs },
  question: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  optionRow: { marginTop: 2 },
  optionBarWrap: {
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
    position: 'relative',
  },
  optionBarFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: colors.border,
  },
  optionBarFillMine: { backgroundColor: colors.primarySoft },
  optionContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  optionText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '600', textAlign: 'right' },
  optionTextMine: { color: colors.primaryDark },
  optionMeta: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  optionCount: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  footer: { color: colors.textFaint, fontSize: 10.5, textAlign: 'right', marginTop: 2 },
});
