import React, { useEffect, useRef, useState } from 'react';
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
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { radius, spacing } from '../theme/colors';
import { useAppState } from '../context/AppState';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SUGGESTIONS = ['أفضل وجهة في نوفمبر', 'فنادق في العلا', 'مطاعم في جدة', 'رحلة عائلية'];

// Dark theme local to this screen only, matching the AI-assistant look
// elsewhere in the product — kept separate from the app's light palette.
const dark = {
  background: '#0B0B10',
  surface: '#1C1C22',
  surfaceAlt: '#232329',
  border: '#2E2E36',
  text: '#F5F6F8',
  textMuted: '#9A9AA4',
  textFaint: '#6E6E78',
  accent: '#1359D3',
};

export default function GuideChatScreen() {
  const navigation = useNavigation<Nav>();
  const { guideMessages, guideThinking, sendGuideMessage } = useAppState();
  const [input, setInput] = useState('');
  const pulse = useRef(new Animated.Value(0.4)).current;

  const hasConversation = guideMessages.length > 1;

  useEffect(() => {
    if (!guideThinking) {
      pulse.setValue(0.4);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [guideThinking, pulse]);

  const send = () => {
    if (!input.trim()) return;
    sendGuideMessage(input);
    setInput('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} hitSlop={8}>
          <Ionicons name="close" size={22} color={dark.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {guideThinking && !hasConversation ? (
          <View style={styles.emptyState}>
            <Animated.View style={[styles.orb, { opacity: pulse }]}>
              <Ionicons name="sparkles" size={30} color={dark.text} />
            </Animated.View>
            <Text style={styles.emptyTitle}>جار البحث عن أفضل الاقتراحات...</Text>
          </View>
        ) : hasConversation ? (
          <FlatList
            data={[...guideMessages].reverse()}
            keyExtractor={(item) => item.id}
            inverted
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              guideThinking ? (
                <View style={[styles.bubble, styles.bubbleGuide, styles.typingBubble]}>
                  <Animated.View style={{ opacity: pulse }}>
                    <Ionicons name="sparkles" size={16} color={dark.textMuted} />
                  </Animated.View>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.fromId === 'me' ? styles.bubbleMe : styles.bubbleGuide]}>
                <Text style={[styles.bubbleText, item.fromId === 'me' && styles.bubbleTextMe]}>{item.text}</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.orb}>
              <Ionicons name="sparkles" size={30} color={dark.text} />
            </View>
            <Text style={styles.emptyTitle}>عن ماذا تبحث؟</Text>
            <Text style={styles.emptySubtitle}>
              اسأل بأسلوبك الخاص — بساعدك بالفعاليات، أخطط لرحلاتك، وأجاوبك على أسئلتك
            </Text>
            <View style={styles.suggestionsWrap}>
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
          </View>
        )}

        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.sendButton} onPress={send} activeOpacity={0.8}>
            <Ionicons name="search" size={18} color={dark.textMuted} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="ابحث عن أي شيء"
            placeholderTextColor={dark.textFaint}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={send}
            textAlign="right"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: dark.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  list: { padding: spacing.lg, gap: spacing.md },
  bubble: { maxWidth: '80%', padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm },
  bubbleGuide: { backgroundColor: dark.surface, alignSelf: 'flex-end' },
  typingBubble: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  bubbleMe: { backgroundColor: dark.accent, alignSelf: 'flex-start' },
  bubbleText: { color: dark.text, fontSize: 14, textAlign: 'right', lineHeight: 20 },
  bubbleTextMe: { color: '#FFFFFF' },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  orb: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: dark.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: { color: dark.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: {
    color: dark.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  suggestionsWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  suggestionChip: {
    backgroundColor: dark.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  suggestionText: { color: dark.text, fontSize: 13, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  input: {
    flex: 1,
    backgroundColor: dark.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: dark.text,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
