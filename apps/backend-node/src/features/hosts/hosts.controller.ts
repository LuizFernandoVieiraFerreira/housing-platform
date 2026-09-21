import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import type { AuthUser } from '../../shared/auth/auth-user.model';
import { RequireUser } from '../../shared/auth/require-user.decorator';
import type { HostPropertyDetail } from '../properties/dto/host-property-detail';
import type {
  HostBookingDto,
  HostDto,
  HostPropertyListItemDto,
  RegisterHostRequestDto,
} from './dto';
import { HostService } from './host.service';

@Controller('hosts')
export class HostsController {
  constructor(private readonly hostService: HostService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  registerHost(
    @RequireUser() user: AuthUser,
    @Body() request: RegisterHostRequestDto,
  ): Promise<HostDto> {
    return this.hostService.register(user, request);
  }

  @Get('me')
  getCurrentHost(@RequireUser() user: AuthUser): Promise<HostDto | null> {
    return this.hostService.getCurrentHost(user);
  }

  @Get('me/properties')
  listHostProperties(
    @RequireUser() user: AuthUser,
  ): Promise<HostPropertyListItemDto[]> {
    return this.hostService.listProperties(user);
  }

  @Get('me/properties/:propertyId')
  getHostProperty(
    @RequireUser() user: AuthUser,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
  ): Promise<HostPropertyDetail> {
    return this.hostService.getProperty(user, propertyId);
  }

  @Get('me/bookings')
  listHostBookings(
    @RequireUser() user: AuthUser,
  ): Promise<HostBookingDto[]> {
    return this.hostService.listBookings(user);
  }
}
