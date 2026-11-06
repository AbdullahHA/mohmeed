import React, { useEffect, useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Text from './Text';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { setWebAlertHandler, type AlertButton } from '../lib/alert';

type Payload = { title: string; message?: string; buttons: AlertButton[] };

// Renders nothing on native — Alert.alert() already works there. Mounted
// once near the app root so src/lib/alert.ts has somewhere to hand off to
// when running on web.
export default function WebAlertHost() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [payload, setPayload] = useState<Payload | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    setWebAlertHandler((title, message, buttons) => setPayload({ title, message, buttons }));
    return () => setWebAlertHandler(null);
  }, []);

  if (Platform.OS !== 'web' || !payload) return null;

  const close = (button: AlertButton) => {
    setPayload(null);
    button.onPress?.();
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => setPayload(null)}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{payload.title}</Text>
          {payload.message ? <Text style={styles.message}>{payload.message}</Text> : null}
          <View style={styles.buttonsRow}>
            {payload.buttons.map((button, index) => (
              <TouchableOpacity
                key={`${button.text ?? 'btn'}-${index}`}
                style={[
                  styles.button,
                  button.style === 'cancel' && styles.buttonCancel,
                  button.style === 'destructive' && styles.buttonDestructive,
                ]}
                activeOpacity={0.85}
                onPress={() => close(button)}
              >
                <Text style={[styles.buttonText, button.style === 'cancel' && styles.buttonTextCancel]}>
                  {button.text ?? 'موافق'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    card: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    title: { color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'right' },
    message: { color: colors.textMuted, fontSize: 13.5, textAlign: 'right', lineHeight: 20 },
    buttonsRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm },
    button: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    buttonCancel: { backgroundColor: colors.surfaceAlt },
    buttonDestructive: { backgroundColor: colors.red },
    buttonText: { color: colors.textOnPrimary, fontSize: 14, fontWeight: '700' },
    buttonTextCancel: { color: colors.text },
  });
