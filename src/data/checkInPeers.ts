import type { CheckInPeer } from '../types';

export const checkInPeersByDestination: Record<string, CheckInPeer[]> = {
  alula: [
    { id: 'p1', name: 'بدر', emoji: '🧗', color: '#B4924C' },
    { id: 'p2', name: 'جود', emoji: '📷', color: '#E85A38' },
  ],
  redsea: [
    { id: 'p3', name: 'شهد', emoji: '🐠', color: '#0E5F58' },
  ],
  riyadh: [
    { id: 'p4', name: 'ماجد', emoji: '🏙️', color: '#2E9E6B' },
    { id: 'p5', name: 'دانة', emoji: '☕', color: '#FF6A45' },
    { id: 'p6', name: 'سعود', emoji: '🚶', color: '#0E5F58' },
  ],
  jeddah: [
    { id: 'p7', name: 'رهف', emoji: '🌅', color: '#E85A38' },
  ],
  abha: [],
  marbella: [
    { id: 'p8', name: 'عمر', emoji: '⛵', color: '#0E5F58' },
  ],
};
