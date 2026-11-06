// Real Umm al-Qura Hijri date via the platform's own ICU calendar data
// (Intl.DateTimeFormat), not a hand-rolled approximation — if the runtime
// doesn't support the islamic-umalqura calendar, we return null and the
// caller omits the Hijri date rather than showing a guess.
let supported: boolean | null = null;

function isSupported(): boolean {
  if (supported !== null) return supported;
  try {
    const fmt = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { year: 'numeric', month: 'long', day: 'numeric' });
    const result = fmt.format(new Date(2024, 0, 1));
    // A real Umm al-Qura formatter returns Arabic month names; a silent
    // Gregorian fallback (seen on some runtimes) would return "يناير".
    supported = !result.includes('يناير') && !result.includes('January');
  } catch {
    supported = false;
  }
  return supported;
}

export function formatHijriDate(date: Date): string | null {
  if (!isSupported()) return null;
  try {
    const fmt = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { year: 'numeric', month: 'long', day: 'numeric' });
    return `${fmt.format(date)}هـ`;
  } catch {
    return null;
  }
}
