import { create } from 'zustand';

/** النوافذ العامة اللي تنفتح من أي شاشة */
export const useSheets = create<{
  addToTrip: { placeId: string; tripId?: string } | null;
  share: { placeId: string } | null;
  review: { placeId: string } | null;
  openAddToTrip: (placeId: string, tripId?: string) => void;
  openShare: (placeId: string) => void;
  openReview: (placeId: string) => void;
  close: () => void;
}>((set) => ({
  addToTrip: null,
  share: null,
  review: null,
  openAddToTrip: (placeId, tripId) => set({ addToTrip: { placeId, tripId } }),
  openShare: (placeId) => set({ share: { placeId } }),
  openReview: (placeId) => set({ review: { placeId } }),
  close: () => set({ addToTrip: null, share: null, review: null }),
}));
