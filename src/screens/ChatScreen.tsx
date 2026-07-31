import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TopBar from '../components/TopBar';
import { colors, radius, spacing } from '../theme/colors';
import { useAppState } from '../context/AppState';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Tab = 'guide' | 'groups';

const SUGGESTIONS = ['أفضل وجهة في نوفمبر', 'فنادق في العلا', 'مطاعم في جدة'];

export default function ChatScreen() {
  const navigation = useNavigation<Nav>();
  const { guideMessages, sendGuideMessage, trips, friends, currentUser } = useAppState();
  const [tab, setTab] = useState<Tab>('guide');
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    sendGuideMessage(input);
    setInput('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar />

      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[styles.segment, tab === 'guide' && styles.segmentActive]}
          activeOpacity={0.85}
          onPress={() => setTab('guide')}
        >
          <Text style={[styles.segmentText, tab === 'guide' && styles.segmentTextActive]}>
            دليل السفر
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, tab === 'groups' && styles.segmentActive]}
          activeOpacity={0.85}
          onPress={() => setTab('groups')}
        >
          <Text style={[styles.segmentText, tab === 'groups' && styles.segmentTextActive]}>
            محادثات رحلاتك
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'guide' ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <FlatList
            data={[...guideMessages].reverse()}
            keyExtractor={(item) => item.id}
            inverted
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bubble,
                  item.fromId === 'me' ? styles.bubbleMe : styles.bubbleGuide,
                ]}
              >
                <Text style={[styles.bubbleText, item.fromId === 'me' && styles.bubbleTextMe]}>
                  {item.text}
                </Text>
              </View>
            )}
          />

          <View style={styles.suggestionsRow}>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionChip}
                activeOpacity={0.8}
                onPress={() => sendGuideMessage(s)}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.sendButton} onPress={send} activeOpacity={0.8}>
              <Ionicons name="send" size={16} color={colors.textOnPrimary} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="اسأل عن وجهة، فندق، أو شهر..."
              placeholderTextColor={colors.textFaint}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={send}
              textAlign="right"
            />
          </View>
        </KeyboardAvoidingView>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.groupsList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>ابدأ رحلة مع أصدقائك عشان تظهر محادثتها هنا</Text>
          }
          renderItem={({ item }) => {
            const lastMessage = item.messages[item.messages.length - 1];
            const memberNames = item.memberIds
              .filter((id) => id !== 'me')
              .map((id) => friends.find((f) => f.id === id)?.name ?? currentUser.name)
              .join('، ');
            return (
              <TouchableOpacity
                style={styles.groupCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('GroupChat', { tripId: item.id })}
              >
                <View style={styles.groupIcon}>
                  <Ionicons name="people" size={18} color={colors.primary} />
                </View>
                <View style={styles.groupTextWrap}>
                  <Text style={styles.groupTitle}>{item.title}</Text>
                  <Text style={styles.groupSubtitle} numberOfLines={1}>
                    {lastMessage ? lastMessage.text : `مع ${memberNames || 'لا أحد بعد'}`}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  segmentRow: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.surfaceAlt,
    marginHorizontal: spacing.lg,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing.md,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: colors.textOnPrimary,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  bubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  bubbleGuide: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-end',
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
  },
  bubbleText: {
    color: colors.text,
    fontSize: 14,
    textAlign: 'right',
    lineHeight: 20,
  },
  bubbleTextMe: {
    color: colors.textOnPrimary,
  },
  suggestionsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  suggestionChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  suggestionText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupsList: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  groupCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  groupIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTextWrap: {
    flex: 1,
  },
  groupTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
  groupSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
  },
});
