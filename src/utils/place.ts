import type { Place } from '../data/places';

export function getPriceLabel(priceLevel: Place['priceLevel']): string {
  return '$'.repeat(priceLevel);
}

export function getMapsUrl(coordinate: Place['coordinate']): string {
  return `https://www.google.com/maps/search/?api=1&query=${coordinate.latitude},${coordinate.longitude}`;
}
