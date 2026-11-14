// Real weather via Open-Meteo — free, no API key required. Used instead of
// a paid weather provider since no key was ever supplied for one.
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

// WMO weather codes, grouped down to the handful of Arabic labels the UI
// shows. https://open-meteo.com/en/docs#weather_variable_documentation
const CODE_LABELS: Array<[number[], string]> = [
  [[0], 'صافي'],
  [[1, 2], 'غائم جزئيًا'],
  [[3], 'غائم'],
  [[45, 48], 'ضباب'],
  [[51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82], 'ممطر'],
  [[71, 73, 75, 77, 85, 86], 'ثلج'],
  [[95, 96, 99], 'عاصف رعدي'],
];

function labelForCode(code: number): string {
  for (const [codes, label] of CODE_LABELS) {
    if (codes.includes(code)) return label;
  }
  return 'معتدل';
}

export type WeatherNow = {
  tempC: number;
  condition: string;
};

export async function fetchWeatherNow(
  coordinate: { latitude: number; longitude: number }
): Promise<WeatherNow | null> {
  try {
    const url = `${BASE_URL}?latitude=${coordinate.latitude}&longitude=${coordinate.longitude}&current_weather=true`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const temp = data?.current_weather?.temperature;
    const code = data?.current_weather?.weathercode;
    if (typeof temp !== 'number') return null;
    return { tempC: Math.round(temp), condition: typeof code === 'number' ? labelForCode(code) : 'معتدل' };
  } catch {
    return null;
  }
}
