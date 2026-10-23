import type { Friend } from '../types';

export const currentUser: Friend = {
  id: 'me',
  name: 'أنت',
  username: 'you',
  emoji: '🧭',
  color: '#1359D3',
};

export const seedFriends: Friend[] = [
  { id: 'sara', name: 'سارة', username: 'sara_a', emoji: '🌸', color: '#F98824' },
  { id: 'faisal', name: 'فيصل', username: 'faisal_m', emoji: '⛰️', color: '#2E9E6B' },
  { id: 'noura', name: 'نورة', username: 'noura_k', emoji: '🌊', color: '#1359D3' },
  { id: 'yousef', name: 'يوسف', username: 'yousef_s', emoji: '🎒', color: '#CC701E' },
];
