import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { Public } from '../../shared/auth/public.decorator';
import { RequireUser } from '../../shared/auth/require-user.decorator';
import type { AuthUser } from '../../shared/auth/auth-user.model';
import type { CreateRoomRequest } from './dto/create-room-request';
import type { CreatedId } from './dto/created-id';
import type { HostPropertyDetail } from './dto/host-property-detail';
import type { HostPropertyRequest } from './dto/host-property-request';
import type { HostRoomDto } from './dto/host-room';
import type { PropertyDetail } from './dto/property-detail';
import type { PropertySearchResult } from './dto/property-search-result';
import type { PropertyStatusChange } from './dto/property-status-change';
import type { SetPropertyLocationRequest } from './dto/set-property-location-request';
import {
  parsePropertySearchQuery,
  PropertySearchService,
} from './property-search.service';
import { PropertyService } from './property.service';

@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertySearchService: PropertySearchService,
    private readonly propertyService: PropertyService,
  ) {}

  @Public()
  @Get()
  async searchProperties(
    @Query() query: Record<string, string | string[] | undefined>,
  ): Promise<PropertySearchResult> {
    return this.propertySearchService.search(parsePropertySearchQuery(query));
  }

  @Public()
  @Get(':propertyId')
  async getProperty(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
  ): Promise<PropertyDetail> {
    return this.propertyService.getPublishedProperty(propertyId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProperty(
    @RequireUser() user: AuthUser,
    @Body() request: HostPropertyRequest,
  ): Promise<CreatedId> {
    return this.propertyService.createProperty(user, request);
  }

  @Patch(':propertyId')
  async updateProperty(
    @RequireUser() user: AuthUser,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Body() request: HostPropertyRequest,
  ): Promise<HostPropertyDetail> {
    return this.propertyService.updateProperty(user, propertyId, request);
  }

  @Post(':propertyId/submit-review')
  async submitPropertyForReview(
    @RequireUser() user: AuthUser,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
  ): Promise<PropertyStatusChange> {
    return this.propertyService.submitForReview(user, propertyId);
  }

  @Post(':propertyId/location')
  @HttpCode(HttpStatus.NO_CONTENT)
  async setPropertyLocation(
    @RequireUser() user: AuthUser,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Body() request: SetPropertyLocationRequest,
  ): Promise<void> {
    await this.propertyService.setLocation(user, propertyId, request);
  }

  @Post(':propertyId/rooms')
  @HttpCode(HttpStatus.CREATED)
  async createRoom(
    @RequireUser() user: AuthUser,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Body() request: CreateRoomRequest,
  ): Promise<HostRoomDto> {
    return this.propertyService.createRoom(user, propertyId, request);
  }
}
