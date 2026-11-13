const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

/** `trips.start_date`/`end_date` are stored as ISO `YYYY-MM-DD`, or the
 * placeholder `'—'` for a trip with no dates yet. Non-ISO values are
 * returned as-is instead of being mangled. */
export function formatTripDate(isoDate: string): string {
  if (!ISO_RE.test(isoDate)) return isoDate;
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return `${d.getDate()} ${MONTHS_AR[d.getMonth()]}`;
}

/** Just the month name, for prompts like "قائمة تجهيز لشهر نوفمبر". */
export function formatTripMonth(isoDate: string): string | null {
  if (!ISO_RE.test(isoDate)) return null;
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return MONTHS_AR[d.getMonth()];
}

export function formatTripDateRange(startIso: string, endIso: string): string {
  if (!ISO_RE.test(startIso) || !ISO_RE.test(endIso)) return `${startIso} – ${endIso}`;
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return `${startIso} – ${endIso}`;
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} – ${end.getDate()} ${MONTHS_AR[start.getMonth()]}`;
  }
  return `${formatTripDate(startIso)} – ${formatTripDate(endIso)}`;
}
