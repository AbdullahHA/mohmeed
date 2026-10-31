import type { CheckInPeer } from '../types';

export const checkInPeersByDestination: Record<string, CheckInPeer[]> = {
  alula: [
    { id: 'p1', name: 'بدر', emoji: '🧗', color: '#F98824' },
    { id: 'p2', name: 'جود', emoji: '📷', color: '#CC701E' },
  ],
  redsea: [
    { id: 'p3', name: 'شهد', emoji: '🐠', color: '#1359D3' },
  ],
  riyadh: [
    { id: 'p4', name: 'ماجد', emoji: '🏙️', color: '#2E9E6B' },
    { id: 'p5', name: 'دانة', emoji: '☕', color: '#F98824' },
    { id: 'p6', name: 'سعود', emoji: '🚶', color: '#1359D3' },
  ],
  jeddah: [
    { id: 'p7', name: 'رهف', emoji: '🌅', color: '#CC701E' },
  ],
  abha: [],
  marbella: [
    { id: 'p8', name: 'عمر', emoji: '⛵', color: '#1359D3' },
  ],
};
