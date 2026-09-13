import { supabase } from '@/shared/api/supabase';

import { isAbsoluteUrl, PROPERTY_IMAGES_BUCKET, ROOM_IMAGES_BUCKET } from '../model';

/**
 * Resolve a property image storage path to a public URL.
 * Returns the path unchanged if it's already an absolute URL.
 */
export function resolvePropertyImageUrl(storagePath: string): string {
  if (isAbsoluteUrl(storagePath)) {
    return storagePath;
  }

  const { data } = supabase.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Resolve a room image storage path to a public URL.
 * Returns the path unchanged if it's already an absolute URL.
 */
export function resolveRoomImageUrl(storagePath: string): string {
  if (isAbsoluteUrl(storagePath)) {
    return storagePath;
  }

  const { data } = supabase.storage.from(ROOM_IMAGES_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}
