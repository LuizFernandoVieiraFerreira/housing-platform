export interface PropertyImageDto {
  id: string;
  storagePath: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isCover: boolean;
}
