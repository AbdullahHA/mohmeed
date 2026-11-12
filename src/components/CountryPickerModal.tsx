import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  View,
  TextInput,
  StyleSheet,
  FlatList,
} from 'react-native';
import Text from './Text';
import { fontSize, radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { COUNTRIES } from '../data/countries';
import { COUNTRY_OPTIONS } from '../data/countryFlags';

const FLAG_BY_NAME: Record<string, string> = Object.fromEntries(
  COUNTRY_OPTIONS.map((c) => [c.name, c.flag])
);

type Props = {
  visible: boolean;
  title: string;
  onSelect: (country: string) => void;
  onClose: () => void;
};

export default function CountryPickerModal({ visible, title, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => COUNTRIES.filter((c) => c.includes(query.trim())),
    [query]
  );

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن دولة..."
            placeholderTextColor={colors.textFaint}
            value={query}
            onChangeText={setQuery}
            textAlign="right"
            autoFocus
          />
          <FlatList
            style={styles.list}
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={styles.emptyText}>ما فيه نتائج</Text>}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => {
                  onSelect(item);
                  handleClose();
                }}
              >
                <Text style={styles.rowFlag}>{FLAG_BY_NAME[item] ?? '🏳️'}</Text>
                <Text style={styles.rowText}>{item}</Text>
              </Pressable>
            )}
          />
          <Pressable style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelText}>إلغاء</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: spacing.lg,
    maxHeight: '75%',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.subtitle,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: fontSize.bodyLg,
    marginBottom: spacing.sm,
  },
  list: {
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.textFaint,
    fontSize: fontSize.body,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  rowFlag: { fontSize: fontSize.title },
  rowText: {
    color: colors.text,
    fontSize: fontSize.bodyLg,
    fontWeight: '600',
    textAlign: 'right',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: fontSize.bodyLg,
    fontWeight: '600',
  },
});
