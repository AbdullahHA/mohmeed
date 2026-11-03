import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { pickAndUploadTravelPostImage } from '../lib/travelPosts';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AddTravelPost'>;

export default function AddTravelPostScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile } = useAuth();
  const { addTravelPost } = useAppState();
  const { destinations } = useContent();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState(route.params?.caption ?? '');
  const [destinationId, setDestinationId] = useState<string | null>(route.params?.destinationId ?? null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePickImage = async () => {
    if (!profile) return;
    setUploading(true);
    try {
      const url = await pickAndUploadTravelPostImage(profile.id);
      if (url) setImageUrl(url);
    } catch {
      Alert.alert('تعذّر رفع الصورة', 'حاول مرة ثانية');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!imageUrl || submitting) return;
    setSubmitting(true);
    const { error } = await addTravelPost(imageUrl, caption, destinationId);
    setSubmitting(false);
    if (error) {
      Alert.alert('تعذّر النشر', error);
      return;
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>مدونة جديدة</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <TouchableOpacity
          style={styles.imagePicker}
          activeOpacity={0.85}
          onPress={handlePickImage}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color={colors.primary} />
          ) : imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
          ) : (
            <>
              <Ionicons name="image-outline" size={32} color={colors.textFaint} />
              <Text style={styles.imagePickerText}>اختر صورة من رحلاتك</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>وش تبي تحكي عنها؟ (اختياري)</Text>
        <TextInput
          style={styles.captionInput}
          placeholder="اكتب كلمتين عن الصورة..."
          placeholderTextColor={colors.textFaint}
          value={caption}
          onChangeText={setCaption}
          multiline
          textAlign="right"
        />

        <Text style={styles.label}>ربطها بوجهة (اختياري)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.destRow}>
          <TouchableOpacity
            style={[styles.destChip, destinationId === null && styles.destChipActive]}
            activeOpacity={0.8}
            onPress={() => setDestinationId(null)}
          >
            <Text style={[styles.destChipText, destinationId === null && styles.destChipTextActive]}>بدون</Text>
          </TouchableOpacity>
          {destinations.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={[styles.destChip, destinationId === d.id && styles.destChipActive]}
              activeOpacity={0.8}
              onPress={() => setDestinationId(d.id)}
            >
              <Text style={[styles.destChipText, destinationId === d.id && styles.destChipTextActive]}>
                {d.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.submitButton, (!imageUrl || submitting) && styles.submitDisabled]}
          activeOpacity={0.85}
          disabled={!imageUrl || submitting}
          onPress={handleSubmit}
        >
          {submitting ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={styles.submitText}>نشر</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  body: { padding: spacing.lg },
  imagePicker: {
    height: 220,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: '100%' },
  imagePickerText: { color: colors.textFaint, fontSize: 13 },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  captionInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  destRow: { flexDirection: 'row-reverse', gap: spacing.sm, paddingVertical: 2 },
  destChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  destChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  destChipText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  destChipTextActive: { color: colors.textOnPrimary },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 14 },
});
