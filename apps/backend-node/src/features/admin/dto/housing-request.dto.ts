import type { HousingRequestStatus } from './housing-request-status.dto';

export interface HousingRequestDto {
  id: string;
  email: string;
  desiredArea: string;
  checkIn: string | null;
  checkOut: string | null;
  budgetMax: number | null;
  accommodationType: string | null;
  notes: string | null;
  status: HousingRequestStatus;
  createdAt: string;
}

export interface UpdateHousingRequestStatusDto {
  status: HousingRequestStatus;
}
