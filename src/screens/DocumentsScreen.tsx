import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { pickAndUploadTripDocumentImage, getTripDocumentSignedUrl } from '../lib/tripDocuments';
import { authenticateWithBiometrics } from '../lib/biometric';
import { TRIP_DOCUMENT_KIND_LABELS, type TripDocument, type TripDocumentKind, type TripDocumentVisibility } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'Documents'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const KINDS: TripDocumentKind[] = ['flight', 'stay', 'ticket', 'personal'];
const WEEKDAY = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function mapRow(row: any): TripDocument {
  return {
    id: row.id,
    tripId: row.trip_id,
    ownerId: row.owner_id,
    kind: row.kind,
    visibility: row.visibility,
    title: row.title,
    data: row.data ?? {},
    fileUrl: row.file_url,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export default function DocumentsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { trips, addItineraryItem } = useAppState();
  const { profile } = useAuth();
  const trip = trips.find((t) => t.id === route.params.tripId);

  const [docs, setDocs] = useState<TripDocument[]>([]);
  const [addingKind, setAddingKind] = useState<TripDocumentKind | null>(null);
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState<TripDocumentVisibility>('shared');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadDocs = async () => {
    if (!trip) return;
    const { data } = await supabase
      .from('trip_documents')
      .select('*')
      .eq('trip_id', trip.id)
      .order('created_at', { ascending: false });
    setDocs((data ?? []).map(mapRow));
  };

  useEffect(() => {
    loadDocs();
  }, [trip?.id]);

  if (!trip || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>لم يتم العثور على الرحلة</Text>
      </SafeAreaView>
    );
  }

  const resetForm = () => {
    setAddingKind(null);
    setTitle('');
    setFields({});
    setImagePath(null);
    setVisibility('shared');
  };

  const handlePickImage = async () => {
    setUploading(true);
    try {
      const path = await pickAndUploadTripDocumentImage(trip.id, profile.id, visibility);
      if (path) setImagePath(path);
    } catch {
      Alert.alert('تعذّر رفع الصورة', 'حاول مرة ثانية');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!addingKind || !title.trim() || saving) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('trip_documents')
      .insert({
        trip_id: trip.id,
        owner_id: profile.id,
        kind: addingKind,
        visibility: addingKind === 'personal' ? 'private' : visibility,
        title: title.trim(),
        data: fields,
        file_url: imagePath,
        starts_at: fields.startsAt || null,
      })
      .select()
      .single();
    setSaving(false);
    if (error || !data) {
      Alert.alert('تعذّر الحفظ', 'حاول مرة ثانية');
      return;
    }
    setDocs((prev) => [mapRow(data), ...prev]);

    if ((addingKind === 'flight' || addingKind === 'stay') && fields.startsAt) {
      const startDate = new Date(fields.startsAt);
      if (!Number.isNaN(startDate.getTime())) {
        const itemDate = startDate.toISOString().slice(0, 10);
        await addItineraryItem(trip.id, {
          day: WEEKDAY[startDate.getDay()],
          time: startDate.toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' }),
          title: title.trim(),
          itemDate,
          slot: null,
          placeId: null,
          kind: addingKind,
        });
      }
    }
    resetForm();
  };

  const handleOpenDoc = async (doc: TripDocument) => {
    if (doc.visibility === 'private' && doc.ownerId === profile.id) {
      const ok = await authenticateWithBiometrics();
      if (!ok) return;
    }
    navigation.navigate('DocumentView', { documentId: doc.id, tripId: trip.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>مستنداتي</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {KINDS.map((kind) => {
          const kindDocs = docs.filter((d) => d.kind === kind && (d.visibility === 'shared' || d.ownerId === profile.id));
          return (
            <View key={kind} style={styles.kindSection}>
              <View style={styles.kindHeaderRow}>
                <Text style={styles.kindTitle}>{TRIP_DOCUMENT_KIND_LABELS[kind]}</Text>
                <TouchableOpacity activeOpacity={0.8} onPress={() => setAddingKind(addingKind === kind ? null : kind)}>
                  <Ionicons name={addingKind === kind ? 'close-circle' : 'add-circle-outline'} size={22} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {kindDocs.length === 0 ? (
                <Text style={styles.emptyMuted}>ما فيه مستندات بعد</Text>
              ) : (
                kindDocs.map((doc) => (
                  <TouchableOpacity key={doc.id} style={styles.docCard} activeOpacity={0.85} onPress={() => handleOpenDoc(doc)}>
                    <Ionicons
                      name={doc.visibility === 'private' ? 'lock-closed' : 'document-text-outline'}
                      size={18}
                      color={colors.textMuted}
                    />
                    <View style={styles.docTextWrap}>
                      <Text style={styles.docTitle}>{doc.title}</Text>
                      {doc.kind === 'flight' && doc.data.airportFrom ? (
                        <Text style={styles.docMeta}>{doc.data.airportFrom} ← {doc.data.airportTo}</Text>
                      ) : null}
                      {doc.kind === 'stay' && doc.data.address ? <Text style={styles.docMeta}>{doc.data.address}</Text> : null}
                    </View>
                  </TouchableOpacity>
                ))
              )}

              {addingKind === kind ? (
                <View style={styles.addForm}>
                  <TextInput
                    style={styles.input}
                    placeholder="العنوان"
                    placeholderTextColor={colors.textFaint}
                    value={title}
                    onChangeText={setTitle}
                    textAlign="right"
                  />

                  {kind === 'flight' ? (
                    <>
                      <TextInput
                        style={styles.input}
                        placeholder="من مطار"
                        placeholderTextColor={colors.textFaint}
                        value={fields.airportFrom ?? ''}
                        onChangeText={(v) => setFields((p) => ({ ...p, airportFrom: v }))}
                        textAlign="right"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="إلى مطار"
                        placeholderTextColor={colors.textFaint}
                        value={fields.airportTo ?? ''}
                        onChangeText={(v) => setFields((p) => ({ ...p, airportTo: v }))}
                        textAlign="right"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="رقم الرحلة"
                        placeholderTextColor={colors.textFaint}
                        value={fields.flightNumber ?? ''}
                        onChangeText={(v) => setFields((p) => ({ ...p, flightNumber: v }))}
                        textAlign="right"
                      />
                    </>
                  ) : null}

                  {kind === 'stay' ? (
                    <TextInput
                      style={styles.input}
                      placeholder="العنوان"
                      placeholderTextColor={colors.textFaint}
                      value={fields.address ?? ''}
                      onChangeText={(v) => setFields((p) => ({ ...p, address: v }))}
                      textAlign="right"
                    />
                  ) : null}

                  {kind === 'flight' || kind === 'stay' ? (
                    <TextInput
                      style={styles.input}
                      placeholder="التاريخ والوقت (مثال: 2026-12-05T14:30)"
                      placeholderTextColor={colors.textFaint}
                      value={fields.startsAt ?? ''}
                      onChangeText={(v) => setFields((p) => ({ ...p, startsAt: v }))}
                      textAlign="left"
                    />
                  ) : null}

                  {kind !== 'personal' ? (
                    <View style={styles.visibilityRow}>
                      {(['shared', 'private'] as const).map((v) => (
                        <TouchableOpacity
                          key={v}
                          style={[styles.visChip, visibility === v && styles.visChipActive]}
                          onPress={() => setVisibility(v)}
                        >
                          <Text style={[styles.visChipText, visibility === v && styles.visChipTextActive]}>
                            {v === 'shared' ? 'يشوفه الكل' : 'خاص فيني'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.lockedHint}>هذا القسم مقفل عليك بس تلقائيًا</Text>
                  )}

                  <TouchableOpacity style={styles.imagePickButton} activeOpacity={0.8} onPress={handlePickImage} disabled={uploading}>
                    <Ionicons name="image-outline" size={16} color={colors.primary} />
                    <Text style={styles.imagePickText}>{uploading ? 'جاري الرفع...' : imagePath ? 'تم اختيار صورة' : 'أضف صورة'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveButton, !title.trim() && styles.saveDisabled]}
                    activeOpacity={0.85}
                    disabled={!title.trim() || saving}
                    onPress={handleSave}
                  >
                    <Text style={styles.saveButtonText}>{saving ? 'جاري الحفظ...' : 'حفظ'}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  notFound: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
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
  body: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  kindSection: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  kindHeaderRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  kindTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  emptyMuted: { color: colors.textFaint, fontSize: 12, textAlign: 'center', paddingVertical: spacing.sm },
  docCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  docTextWrap: { flex: 1 },
  docTitle: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  docMeta: { color: colors.textMuted, fontSize: 11, textAlign: 'right', marginTop: 2 },
  addForm: { gap: spacing.sm, marginTop: spacing.md },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 13,
    textAlign: 'right',
  },
  visibilityRow: { flexDirection: 'row-reverse', gap: spacing.sm },
  visChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  visChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  visChipText: { color: colors.text, fontSize: 11.5, fontWeight: '700' },
  visChipTextActive: { color: colors.textOnPrimary },
  lockedHint: { color: colors.textFaint, fontSize: 11, textAlign: 'right' },
  imagePickButton: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-end' },
  imagePickText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  saveButton: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: spacing.sm, alignItems: 'center' },
  saveDisabled: { opacity: 0.5 },
  saveButtonText: { color: colors.textOnPrimary, fontSize: 13, fontWeight: '700' },
});
