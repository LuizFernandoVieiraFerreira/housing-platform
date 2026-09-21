import { Module } from '@nestjs/common';

import { StorageUrlResolver } from './storage-url.resolver';

@Module({
  providers: [StorageUrlResolver],
  exports: [StorageUrlResolver],
})
export class StorageModule {}
