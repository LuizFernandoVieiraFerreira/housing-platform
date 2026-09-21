import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';

import type { AuthUser } from '../../shared/auth/auth-user.model';
import { RequireUser } from '../../shared/auth/require-user.decorator';
import { PropertyService } from './property.service';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly propertyService: PropertyService) {}

  @Delete(':roomId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRoom(
    @RequireUser() user: AuthUser,
    @Param('roomId', ParseUUIDPipe) roomId: string,
  ): Promise<void> {
    await this.propertyService.deleteRoom(user, roomId);
  }
}
