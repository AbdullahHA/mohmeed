import { Alert as RNAlert, Platform } from 'react-native';

export type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type Handler = (title: string, message: string | undefined, buttons: AlertButton[]) => void;

// react-native-web's Alert.alert() is a no-op stub (no window.alert/confirm
// fallback), so every destructive confirmation and error message in the app
// silently did nothing on the web build. WebAlertHost registers itself here
// at app startup (web only) and renders a themed modal instead; native
// platforms go straight to the real native Alert, unchanged.
let webHandler: Handler | null = null;

export function setWebAlertHandler(fn: Handler | null) {
  webHandler = fn;
}

export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    if (Platform.OS !== 'web') {
      RNAlert.alert(title, message, buttons as any);
      return;
    }
    const resolvedButtons = buttons && buttons.length > 0 ? buttons : [{ text: 'موافق' }];
    if (webHandler) {
      webHandler(title, message, resolvedButtons);
    }
  },
};
