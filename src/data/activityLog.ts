export type CheckInRecord = {
  id: string;
  placeName: string;
  cityName: string;
  at: string;
};

export const checkIns: CheckInRecord[] = [];

export function recordCheckIn(record: CheckInRecord) {
  checkIns.unshift(record);
}
