import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppConfiguration } from '../../config/configuration';

const PROPERTY_IMAGES_BUCKET = 'property-images';

@Injectable()
export class StorageUrlResolver {
  private readonly supabaseUrl: string;

  constructor(config: ConfigService<AppConfiguration, true>) {
    this.supabaseUrl = config.get('supabaseUrl', { infer: true });
  }

  resolvePropertyImageUrl(storagePath: string | null | undefined): string | null {
    if (!storagePath || storagePath.trim() === '') {
      return null;
    }

    if (
      storagePath.startsWith('http://') ||
      storagePath.startsWith('https://')
    ) {
      return storagePath;
    }

    const base = this.supabaseUrl.replace(/\/+$/, '');
    const path = storagePath.replace(/^\/+/, '');
    return `${base}/storage/v1/object/public/${PROPERTY_IMAGES_BUCKET}/${path}`;
  }
}
