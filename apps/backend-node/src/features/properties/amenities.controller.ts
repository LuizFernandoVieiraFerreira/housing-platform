import { Controller, Get } from '@nestjs/common';

import { Public } from '../../shared/auth/public.decorator';
import type { PropertyAmenityDto } from './dto/property-amenity';
import { PropertyService } from './property.service';

@Controller('amenities')
export class AmenitiesController {
  constructor(private readonly propertyService: PropertyService) {}

  @Public()
  @Get()
  async listAmenities(): Promise<PropertyAmenityDto[]> {
    return this.propertyService.listAmenities();
  }
}
