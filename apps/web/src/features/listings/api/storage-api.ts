import { supabase } from '@/shared/api/supabase';

const PROPERTY_IMAGES_BUCKET = 'property-images';
const ROOM_IMAGES_BUCKET = 'room-images';

function getFileExtension(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension && ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? extension : 'webp';
}

export async function uploadPropertyImage(propertyId: string, file: File): Promise<string> {
  const filePath = `${propertyId}/${crypto.randomUUID()}.${getFileExtension(file.name)}`;

  const { error } = await supabase.storage.from(PROPERTY_IMAGES_BUCKET).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) {
    throw error;
  }

  return filePath;
}

export async function uploadRoomImage(roomId: string, file: File): Promise<string> {
  const filePath = `${roomId}/${crypto.randomUUID()}.${getFileExtension(file.name)}`;

  const { error } = await supabase.storage.from(ROOM_IMAGES_BUCKET).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) {
    throw error;
  }

  return filePath;
}

export async function deletePropertyImage(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove([storagePath]);

  if (error) {
    throw error;
  }
}
