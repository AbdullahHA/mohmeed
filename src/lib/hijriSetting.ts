import AsyncStorage from '@react-native-async-storage/async-storage';

export const HIJRI_DATE_KEY = 'yalla-nsafer:show-hijri-date';

export async function getHijriDateEnabled(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(HIJRI_DATE_KEY);
  return stored === '1';
}

export async function setHijriDateEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(HIJRI_DATE_KEY, enabled ? '1' : '0');
}
