import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

type Coordinate = { latitude: number; longitude: number };
type Status = 'idle' | 'loading' | 'granted' | 'denied' | 'error';

/**
 * Real device GPS only — never a guessed or fixed coordinate. Screens that
 * show distance/"closest" must fall back to hiding that info when status
 * isn't 'granted', not fabricate a number.
 */
export function useUserLocation() {
  const [status, setStatus] = useState<Status>('idle');
  const [coords, setCoords] = useState<Coordinate | null>(null);

  const request = async () => {
    setStatus('loading');
    try {
      const { status: permission } = await Location.requestForegroundPermissionsAsync();
      if (permission !== 'granted') {
        setStatus('denied');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setStatus('granted');
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status: existing } = await Location.getForegroundPermissionsAsync();
      if (cancelled) return;
      if (existing === 'granted') {
        request();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, coords, requestLocation: request };
}
