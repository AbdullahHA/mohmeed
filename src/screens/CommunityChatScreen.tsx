import React, { useMemo, useState } from 'react';
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
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useRequireAccount } from '../hooks/useRequireAccount';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'CommunityChat'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CommunityChatScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { communities, currentUser, joinCommunity, leaveCommunity, sendCommunityMessage } = useAppState();
  const { requireAccount } = useRequireAccount();
  const [input, setInput] = useState('');

  const community = communities.find((c) => c.id === route.params.communityId);

  if (!community) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>لم يتم العثور على المجتمع</Text>
      </SafeAreaView>
    );
  }

  const memberCount = community.baseMemberCount + (community.joined ? 1 : 0);

  const send = () => {
    if (!input.trim()) return;
    sendCommunityMessage(community.id, input);
    setInput('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-forward" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{community.name}</Text>
          <Text style={styles.headerSubtitle}>{memberCount.toLocaleString()} عضو</Text>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: community.color }]}>
          <Text style={styles.headerEmoji}>{community.emoji}</Text>
        </View>
      </View>

      <View style={styles.taglineRow}>
        <Text style={styles.tagline}>{community.tagline}</Text>
        <TouchableOpacity
          style={[styles.joinButton, community.joined && styles.joinedButton]}
          activeOpacity={0.85}
          onPress={() =>
            community.joined ? leaveCommunity(community.id) : requireAccount('chat', () => joinCommunity(community.id))
          }
        >
          <Text style={[styles.joinButtonText, community.joined && styles.joinedButtonText]}>
            {community.joined ? 'عضو ✓' : 'انضم'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={[...community.messages].reverse()}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>كن أول من يبدأ النقاش بهذا المجتمع</Text>}
          renderItem={({ item }) => {
            const isMe = item.fromName === currentUser.name;
            return (
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                {!isMe ? <Text style={styles.senderName}>{item.fromName}</Text> : null}
                <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.text}</Text>
              </View>
            );
          }}
        />

        {community.joined ? (
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.sendButton} onPress={send} activeOpacity={0.8}>
              <Ionicons name="send" size={16} color={colors.textOnPrimary} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="شارك سؤالك أو تجربتك..."
              placeholderTextColor={colors.textFaint}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={send}
              textAlign="right"
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.joinToPostBar}
            activeOpacity={0.85}
            onPress={() => requireAccount('chat', () => joinCommunity(community.id))}
          >
            <Text style={styles.joinToPostText}>انضم للمجتمع عشان تقدر تشارك</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  notFound: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTextWrap: { flex: 1, marginHorizontal: spacing.md, alignItems: 'flex-end' },
  headerTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  headerSubtitle: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEmoji: { fontSize: 16 },
  taglineRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tagline: { color: colors.textMuted, fontSize: 12, flex: 1, textAlign: 'right', marginLeft: spacing.sm },
  joinButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  joinedButton: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  joinButtonText: { color: colors.textOnPrimary, fontSize: 12, fontWeight: '700' },
  joinedButtonText: { color: colors.primaryDark },
  list: { padding: spacing.lg, gap: spacing.md },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  bubble: { maxWidth: '80%', padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm },
  bubbleOther: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-end' },
  bubbleMe: { backgroundColor: colors.primary, alignSelf: 'flex-start' },
  senderName: { color: colors.primary, fontSize: 11, fontWeight: '700', textAlign: 'right', marginBottom: 2 },
  bubbleText: { color: colors.text, fontSize: 14, textAlign: 'right', lineHeight: 20 },
  bubbleTextMe: { color: colors.textOnPrimary },
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
  joinToPostBar: {
    padding: spacing.lg,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.primarySoft,
  },
  joinToPostText: { color: colors.primaryDark, fontSize: 13, fontWeight: '700' },
});
