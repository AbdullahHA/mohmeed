import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

const MESSAGES: Record<string, string> = {
  checkIn: 'التشك إن يحتاج حساب حقيقي عشان يظهر لأصدقائك.',
  visited: 'تسجيل الأماكن اللي زرتها يحتاج حساب عشان يُحفظ في ملفك الشخصي.',
  recommend: 'التوصية بمكان تحتاج حساب عشان تُنسب لك.',
  friend: 'إضافة الأصدقاء تحتاج حساب حقيقي.',
  trip: 'تخطيط أو الانضمام لرحلة يحتاج حساب عشان تقدر تتابعها.',
  chat: 'المشاركة بالمحادثات تحتاج حساب حقيقي.',
  template: 'مشاركة قالب رحلة تحتاج حساب عشان يُنسب لك.',
  review: 'إضافة تقييم تحتاج حساب حقيقي.',
  default: 'هذي الميزة تحتاج حساب حقيقي.',
};

export function useRequireAccount() {
  const { session, guestMode, exitGuestMode } = useAuth();
  const isGuest = !session && guestMode;

  function requireAccount(action: keyof typeof MESSAGES | string, onAllowed: () => void) {
    if (session) {
      onAllowed();
      return;
    }
    Alert.alert('سجّل حساب أول', MESSAGES[action] ?? MESSAGES.default, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'سجّل الآن', onPress: () => exitGuestMode() },
    ]);
  }

  return { isGuest, requireAccount };
}
