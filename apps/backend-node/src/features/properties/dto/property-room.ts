import type { RoomStatus } from './room-status';

export interface PropertyRoomDto {
  id: string;
  name: string;
  roomType: string | null;
  sizeSqm: number | null;
  maxOccupancy: number;
  monthlyPriceKrw: number;
  status: RoomStatus;
  availableFrom: string | null;
}
