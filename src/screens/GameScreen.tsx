import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Platform,
} from 'react-native';
import type { GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type FallingObject = {
  id: number;
  x: number;
  y: number;
  emoji: string;
  speed: number;
};

const EMOJIS = ['🍎', '🍊', '🍋', '🍉', '🍇', '🍓', '🍒', '🥝', '🍍'];
const BASKET_EMOJI = '🧺';
const OBJECT_SIZE = 34;
const BASKET_WIDTH = 70;
const BASKET_HEIGHT = 50;
const BASKET_BOTTOM_MARGIN = 12;
const MAX_LIVES = 3;
const SPAWN_INTERVAL_MS = 950;
const BASE_FALL_SPEED = 110;
const FALL_SPEED_VARIANCE = 80;
const KEYBOARD_SPEED = 420;
const MAX_FRAME_DELTA_MS = 48;

const clamp = (value: number, min: number, max: number) => {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
};

let objectIdCounter = 0;

export default function GameScreen() {
  const navigation = useNavigation<Nav>();
  const [, setRenderTick] = useState(0);

  const objectsRef = useRef<FallingObject[]>([]);
  const basketXRef = useRef(0);
  const basketInitializedRef = useRef(false);
  const scoreRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);
  const gameOverRef = useRef(false);
  const keysRef = useRef<Set<string>>(new Set());
  const areaRef = useRef({ width: 0, height: 0 });
  const spawnTimerRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const step = useCallback((time: number) => {
    if (lastTimeRef.current == null) lastTimeRef.current = time;
    const dt = Math.min(time - lastTimeRef.current, MAX_FRAME_DELTA_MS);
    lastTimeRef.current = time;

    const area = areaRef.current;
    if (area.width > 0 && !gameOverRef.current) {
      if (keysRef.current.size > 0) {
        let dx = 0;
        if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a') || keysRef.current.has('A')) dx -= 1;
        if (keysRef.current.has('ArrowRight') || keysRef.current.has('d') || keysRef.current.has('D')) dx += 1;
        if (dx !== 0) {
          basketXRef.current = clamp(
            basketXRef.current + (dx * KEYBOARD_SPEED * dt) / 1000,
            0,
            area.width - BASKET_WIDTH
          );
        }
      }

      spawnTimerRef.current += dt;
      if (spawnTimerRef.current >= SPAWN_INTERVAL_MS) {
        spawnTimerRef.current = 0;
        objectIdCounter += 1;
        objectsRef.current = [
          ...objectsRef.current,
          {
            id: objectIdCounter,
            x: Math.random() * (area.width - OBJECT_SIZE),
            y: -OBJECT_SIZE,
            emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
            speed: BASE_FALL_SPEED + Math.random() * FALL_SPEED_VARIANCE,
          },
        ];
      }

      const basketTop = area.height - BASKET_HEIGHT - BASKET_BOTTOM_MARGIN;
      const basketLeft = basketXRef.current;
      const basketRight = basketLeft + BASKET_WIDTH;

      let caught = 0;
      let missed = 0;
      const next: FallingObject[] = [];
      for (const obj of objectsRef.current) {
        const newY = obj.y + (obj.speed * dt) / 1000;
        const overlapsX = obj.x + OBJECT_SIZE > basketLeft && obj.x < basketRight;
        const reachedBasket = newY + OBJECT_SIZE >= basketTop && obj.y <= basketTop + BASKET_HEIGHT;

        if (reachedBasket && overlapsX) {
          caught += 1;
          continue;
        }
        if (newY > area.height) {
          missed += 1;
          continue;
        }
        next.push({ ...obj, y: newY });
      }
      objectsRef.current = next;

      if (caught > 0) scoreRef.current += caught;
      if (missed > 0) {
        livesRef.current = Math.max(0, livesRef.current - missed);
        if (livesRef.current <= 0) gameOverRef.current = true;
      }
    }

    setRenderTick((t) => t + 1);
    rafRef.current = gameOverRef.current ? null : requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [step]);

  useEffect(() => {
    const win = (globalThis as any).window;
    if (Platform.OS !== 'web' || !win) return;
    const handleKeyDown = (e: any) => keysRef.current.add(e.key);
    const handleKeyUp = (e: any) => keysRef.current.delete(e.key);
    win.addEventListener('keydown', handleKeyDown);
    win.addEventListener('keyup', handleKeyUp);
    return () => {
      win.removeEventListener('keydown', handleKeyDown);
      win.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt: GestureResponderEvent) => {
        const area = areaRef.current;
        basketXRef.current = clamp(
          evt.nativeEvent.locationX - BASKET_WIDTH / 2,
          0,
          area.width - BASKET_WIDTH
        );
      },
    })
  ).current;

  const handleAreaLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    const prevWidth = areaRef.current.width;
    areaRef.current = { width, height };
    if (!basketInitializedRef.current) {
      basketXRef.current = (width - BASKET_WIDTH) / 2;
      basketInitializedRef.current = true;
    } else if (prevWidth !== width) {
      basketXRef.current = clamp(basketXRef.current, 0, width - BASKET_WIDTH);
    }
  };

  const resetGame = () => {
    objectsRef.current = [];
    scoreRef.current = 0;
    livesRef.current = MAX_LIVES;
    gameOverRef.current = false;
    spawnTimerRef.current = 0;
    lastTimeRef.current = null;
    const area = areaRef.current;
    basketXRef.current = (area.width - BASKET_WIDTH) / 2;
    setRenderTick((t) => t + 1);
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(step);
    }
  };

  const basketTop = areaRef.current.height - BASKET_HEIGHT - BASKET_BOTTOM_MARGIN;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.85}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
        >
          <Ionicons name="arrow-forward" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>🎯 التقط الفاكهة</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.hud}>
        <Text style={styles.score}>النقاط: {scoreRef.current}</Text>
        <View style={styles.livesRow}>
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <Text key={i} style={styles.heart}>
              {i < livesRef.current ? '❤️' : '🖤'}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.playArea} onLayout={handleAreaLayout} {...panResponder.panHandlers}>
        {objectsRef.current.map((obj) => (
          <Text key={obj.id} style={[styles.fallingObject, { left: obj.x, top: obj.y }]}>
            {obj.emoji}
          </Text>
        ))}

        {areaRef.current.width > 0 && (
          <Text style={[styles.basket, { left: basketXRef.current, top: basketTop }]}>{BASKET_EMOJI}</Text>
        )}

        {gameOverRef.current && (
          <View style={styles.gameOverOverlay}>
            <Text style={styles.gameOverEmoji}>💥</Text>
            <Text style={styles.gameOverTitle}>انتهت اللعبة!</Text>
            <Text style={styles.gameOverScore}>نقاطك: {scoreRef.current}</Text>
            <TouchableOpacity style={styles.replayButton} activeOpacity={0.85} onPress={resetGame}>
              <Text style={styles.replayButtonText}>العب مرة أخرى</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {Platform.OS === 'web' && !gameOverRef.current && (
        <Text style={styles.hint}>حرّك السلة بالأسهم ← → أو A / D، أو اسحبها باللمس</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 38,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  hud: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  score: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '700',
  },
  livesRow: {
    flexDirection: 'row-reverse',
    gap: spacing.xs,
  },
  heart: {
    fontSize: 18,
  },
  playArea: {
    flex: 1,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  fallingObject: {
    position: 'absolute',
    fontSize: OBJECT_SIZE,
    width: OBJECT_SIZE,
    height: OBJECT_SIZE,
    textAlign: 'center',
    lineHeight: OBJECT_SIZE,
  },
  basket: {
    position: 'absolute',
    fontSize: BASKET_HEIGHT,
    width: BASKET_WIDTH,
    height: BASKET_HEIGHT,
    textAlign: 'center',
    lineHeight: BASKET_HEIGHT,
  },
  gameOverOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  gameOverEmoji: {
    fontSize: 44,
    marginBottom: spacing.sm,
  },
  gameOverTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  gameOverScore: {
    color: colors.textMuted,
    fontSize: 15,
    marginBottom: spacing.lg,
  },
  replayButton: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  replayButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '700',
  },
  hint: {
    color: colors.textFaint,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
