import { Module } from '@nestjs/common';

import { StorageModule } from '../../shared/storage/storage.module';
import { AmenitiesController } from './amenities.controller';
import { PropertiesController } from './properties.controller';
import { PropertyRepository } from './property.repository';
import { PropertySearchService } from './property-search.service';
import { PropertyService } from './property.service';
import { RoomsController } from './rooms.controller';

@Module({
  imports: [StorageModule],
  controllers: [PropertiesController, RoomsController, AmenitiesController],
  providers: [PropertyRepository, PropertySearchService, PropertyService],
  exports: [PropertyService, PropertyRepository],
})
export class PropertiesModule {}
