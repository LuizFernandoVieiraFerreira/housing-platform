import { supabase } from '@/shared/api/supabase';

const PROPERTY_IMAGES_BUCKET = 'property-images';
const ROOM_IMAGES_BUCKET = 'room-images';

export function resolvePropertyImageUrl(storagePath: string): string {
  if (/^https?:\/\//i.test(storagePath)) {
    return storagePath;
  }

  const { data } = supabase.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export function resolveRoomImageUrl(storagePath: string): string {
  if (/^https?:\/\//i.test(storagePath)) {
    return storagePath;
  }

  const { data } = supabase.storage.from(ROOM_IMAGES_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}
