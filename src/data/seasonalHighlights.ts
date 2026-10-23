export type SeasonalHighlight = {
  id: string;
  label: string;
  emoji: string;
  color: string;
  destinationId: string;
};

export const seasonalHighlights: SeasonalHighlight[] = [
  { id: 'sh-winter-fest', label: 'مهرجان شتاء العلا', emoji: '🎆', color: '#F98824', destinationId: 'alula' },
  { id: 'sh-diving-season', label: 'موسم الغوص بالأحمر', emoji: '🤿', color: '#1359D3', destinationId: 'redsea' },
  { id: 'sh-boulevard', label: 'فعاليات بوليفارد الرياض', emoji: '🎡', color: '#1359D3', destinationId: 'riyadh' },
  { id: 'sh-corniche', label: 'أمسيات كورنيش جدة', emoji: '🌊', color: '#F98824', destinationId: 'jeddah' },
  { id: 'sh-abha-cool', label: 'طقس أبها المنعش', emoji: '⛰️', color: '#2E9E6B', destinationId: 'abha' },
  { id: 'sh-marbella-summer', label: 'صيف ماربيا', emoji: '☀️', color: '#CC701E', destinationId: 'marbella' },
];
