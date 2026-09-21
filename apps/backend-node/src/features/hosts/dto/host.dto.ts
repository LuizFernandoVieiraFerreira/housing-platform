import type { HostStatus } from './host-status.dto';

export interface HostDto {
  id: string;
  profileId: string;
  displayName: string;
  status: HostStatus;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
