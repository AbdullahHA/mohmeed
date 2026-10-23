import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../theme/colors';
import { useContent } from '../context/ContentContext';
import { supabase } from '../lib/supabase';
import { pickAndUploadImage } from '../utils/adminImages';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'AdminEditPlace'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AdminEditPlaceScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { places, refresh } = useContent();
  const place = places.find((p) => p.id === route.params.placeId);

  const [name, setName] = useState(place?.name ?? '');
  const [description, setDescription] = useState(place?.description ?? '');
  const [image, setImage] = useState(place?.image);
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!place) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>لم يتم العثور على المكان</Text>
      </SafeAreaView>
    );
  }

  const handlePickImage = async () => {
    setUploadingImage(true);
    try {
      const url = await pickAndUploadImage('places', place.id);
      if (url) {
        setNewImageUrl(url);
        setImage({ uri: url });
      }
    } catch (e: any) {
      Alert.alert('فشل رفع الصورة', e?.message ?? 'حاول مرة ثانية');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const payload: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim(),
    };
    if (newImageUrl) payload.image_url = newImageUrl;

    const { error } = await supabase.from('places').update(payload).eq('id', place.id);
    setSaving(false);
    if (error) {
      Alert.alert('فشل الحفظ', error.message);
      return;
    }
    await refresh();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تعديل المكان</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.imageWrap}
          activeOpacity={0.85}
          onPress={handlePickImage}
          disabled={uploadingImage}
        >
          {image ? <Image source={image} style={styles.image} /> : null}
          <View style={styles.imageOverlay}>
            {uploadingImage ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={20} color={colors.textOnPrimary} />
                <Text style={styles.imageOverlayText}>تغيير الصورة</Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        <Text style={styles.label}>الاسم</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} textAlign="right" />

        <Text style={styles.label}>الوصف</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlign="right"
        />

        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitDisabled]}
          activeOpacity={0.85}
          disabled={saving}
          onPress={handleSave}
        >
          {saving ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={styles.submitText}>حفظ التعديلات</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  notFound: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  imageWrap: {
    height: 170,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    marginBottom: spacing.md,
  },
  image: { width: '100%', height: '100%' },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.overlay,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row-reverse',
    gap: spacing.xs,
  },
  imageOverlayText: { color: colors.textOnPrimary, fontSize: 12, fontWeight: '700' },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 14,
    textAlign: 'right',
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
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
