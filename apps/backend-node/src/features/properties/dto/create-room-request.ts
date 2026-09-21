export interface CreateRoomRequest {
  name: string;
  roomType?: string | null;
  sizeSqm?: number | null;
  maxOccupancy: number;
  monthlyPriceKrw: number;
  availableFrom?: string | null;
}
