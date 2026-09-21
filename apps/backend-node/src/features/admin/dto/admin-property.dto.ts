import type { HostPropertyListItemDto } from '../../hosts/dto/host-property-list-item.dto';

export interface AdminPropertyDto extends HostPropertyListItemDto {
  hostDisplayName: string;
}
