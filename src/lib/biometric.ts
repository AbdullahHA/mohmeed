import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BIOMETRIC_LOCK_KEY = 'yalla-nsafer:biometric-lock';

export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

export async function getBiometricLockEnabled(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(BIOMETRIC_LOCK_KEY);
  return stored === '1';
}

export async function setBiometricLockEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(BIOMETRIC_LOCK_KEY, enabled ? '1' : '0');
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'افتح يلا نسافر',
    cancelLabel: 'إلغاء',
    disableDeviceFallback: false,
  });
  return result.success;
}
