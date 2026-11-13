import type { Place } from '../data/places';

export function getPriceLabel(priceLevel: Place['priceLevel']): string {
  return '$'.repeat(priceLevel);
}

export function getMapsUrl(coordinate: Place['coordinate']): string {
  return `https://www.google.com/maps/search/?api=1&query=${coordinate.latitude},${coordinate.longitude}`;
}

export function getMultiStopMapsUrl(coordinates: Place['coordinate'][]): string {
  const path = coordinates.map((c) => `${c.latitude},${c.longitude}`).join('/');
  return `https://www.google.com/maps/dir/${path}`;
}
