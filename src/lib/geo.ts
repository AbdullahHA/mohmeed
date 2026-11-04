export type Coordinate = { latitude: number; longitude: number };

const EARTH_RADIUS_KM = 6371;

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

export function haversineDistanceKm(a: Coordinate, b: Coordinate): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// No flight-schedule API is wired up, so this is never shown as an exact
// duration — just a straight-line-distance estimate (avg cruise speed +
// fixed taxi/climb/descent overhead), always labeled "تقريبًا" by callers.
const AVG_CRUISE_SPEED_KMH = 800;
const FLIGHT_OVERHEAD_MINUTES = 35;

export function estimateFlightMinutes(a: Coordinate, b: Coordinate): number {
  const distanceKm = haversineDistanceKm(a, b);
  const cruiseMinutes = (distanceKm / AVG_CRUISE_SPEED_KMH) * 60;
  return Math.round((cruiseMinutes + FLIGHT_OVERHEAD_MINUTES) / 5) * 5;
}

export function formatFlightDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} د`;
  if (minutes === 0) return `${hours} س`;
  return `${hours} س ${minutes} د`;
}
