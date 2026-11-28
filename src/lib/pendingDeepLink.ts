import AsyncStorage from '@react-native-async-storage/async-storage';

// A trip-invite link (yallansafer://join/<code>) tapped while the person is
// logged out is lost today: App.tsx's Gate() renders AuthGateScreen with no
// NavigationContainer mounted, so React Navigation's own linking listeners
// never see it. Stash the code here when that happens, and replay it once a
// NavigationContainer does mount (see App.tsx's linking.getInitialURL).
const KEY = 'pending_join_code';
const JOIN_URL_RE = /yallansafer:\/\/join\/([A-Za-z0-9]+)/;

export function extractJoinCode(url: string): string | null {
  const match = url.match(JOIN_URL_RE);
  return match ? match[1] : null;
}

export async function storePendingJoinCode(code: string) {
  await AsyncStorage.setItem(KEY, code);
}

export async function consumePendingJoinCode(): Promise<string | null> {
  const code = await AsyncStorage.getItem(KEY);
  if (code) await AsyncStorage.removeItem(KEY);
  return code;
}
