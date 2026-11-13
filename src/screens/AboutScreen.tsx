import React, { useMemo } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { fontSize, radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import appConfig from '../../app.json';

export default function AboutScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>من نحن</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <Image source={require('../../assets/icon.png')} style={styles.icon} />
        </View>
        <Text style={styles.appName}>{appConfig.expo.name}</Text>
        <Text style={styles.version}>الإصدار {appConfig.expo.version}</Text>

        <Text style={styles.paragraph}>
          "يلا نسافر" رفيقك لتخطيط رحلاتك داخل المملكة وخارجها — تكتشف وجهات ومعالم، تخطط رحلة مع أصدقائك
          وتدير ميزانيتها وجدولها، وتسأل دليل السفر الذكي عن أفضل وقت ومكان للزيارة.
        </Text>
        <Text style={styles.paragraph}>
          التطبيق في مرحلة تجريبية (TestFlight) حاليًا، وما زلنا نضيف ونطوّر مزايا جديدة بناءً على ملاحظاتكم.
        </Text>
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
  headerTitle: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700' },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl, alignItems: 'center' },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  icon: { width: '100%', height: '100%' },
  appName: { color: colors.text, fontSize: fontSize.title, fontWeight: '700' },
  version: { color: colors.textFaint, fontSize: fontSize.base, marginTop: 2, marginBottom: spacing.xl },
  paragraph: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: spacing.md,
    alignSelf: 'stretch',
  },
});
