import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { getTripDocumentSignedUrl } from '../lib/tripDocuments';
import { TRIP_DOCUMENT_KIND_LABELS, type TripDocument } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'DocumentView'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function DocumentViewScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [doc, setDoc] = useState<TripDocument | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('trip_documents').select('*').eq('id', route.params.documentId).maybeSingle();
      if (data) {
        setDoc({
          id: data.id,
          tripId: data.trip_id,
          ownerId: data.owner_id,
          kind: data.kind,
          visibility: data.visibility,
          title: data.title,
          data: data.data ?? {},
          fileUrl: data.file_url,
          startsAt: data.starts_at,
          endsAt: data.ends_at,
          createdAt: new Date(data.created_at).getTime(),
        });
        if (data.file_url) {
          const url = await getTripDocumentSignedUrl(data.file_url);
          setSignedUrl(url);
        }
      }
      setLoading(false);
    })();
  }, [route.params.documentId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{doc ? TRIP_DOCUMENT_KIND_LABELS[doc.kind] : ''}</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : !doc ? (
        <Text style={styles.notFound}>تعذّر العثور على المستند</Text>
      ) : (
        <View style={styles.body}>
          <Text style={styles.title}>{doc.title}</Text>

          {doc.kind === 'flight' ? (
            <View style={styles.detailsCard}>
              {doc.data.airportFrom ? <Text style={styles.detailText}>من: {doc.data.airportFrom}</Text> : null}
              {doc.data.airportTo ? <Text style={styles.detailText}>إلى: {doc.data.airportTo}</Text> : null}
              {doc.data.flightNumber ? <Text style={styles.detailText}>رقم الرحلة: {doc.data.flightNumber}</Text> : null}
              {doc.data.gate ? <Text style={styles.detailText}>البوابة: {doc.data.gate}</Text> : null}
              {doc.data.seat ? <Text style={styles.detailText}>المقعد: {doc.data.seat}</Text> : null}
            </View>
          ) : null}

          {doc.kind === 'stay' ? (
            <View style={styles.detailsCard}>
              {doc.data.address ? <Text style={styles.detailText}>العنوان: {doc.data.address}</Text> : null}
              {doc.data.phone ? <Text style={styles.detailText}>الهاتف: {doc.data.phone}</Text> : null}
              {doc.data.bookingRef ? <Text style={styles.detailText}>رقم الحجز: {doc.data.bookingRef}</Text> : null}
            </View>
          ) : null}

          {signedUrl ? (
            <Image source={{ uri: signedUrl }} style={styles.fullImage} resizeMode="contain" />
          ) : doc.fileUrl ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.noImageHint}>ما فيه صورة مرفقة</Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  notFound: { color: '#fff', textAlign: 'center', marginTop: spacing.xxl },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  body: { flex: 1, padding: spacing.lg, alignItems: 'center' },
  title: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: spacing.md },
  detailsCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
    marginBottom: spacing.lg,
  },
  detailText: { color: '#fff', fontSize: 13, textAlign: 'right' },
  fullImage: { width: '100%', flex: 1, backgroundColor: '#fff', borderRadius: radius.md },
  noImageHint: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: spacing.xxl },
});
