import { Body, Controller, Get, Patch } from '@nestjs/common';

import type { AuthUser } from '../../shared/auth/auth-user.model';
import { RequireUser } from '../../shared/auth/require-user.decorator';
import type { ProfileDto, UpdateProfileDto } from './dto';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(@RequireUser() user: AuthUser): Promise<ProfileDto> {
    return this.profileService.getProfile(user);
  }

  @Patch()
  updateProfile(
    @RequireUser() user: AuthUser,
    @Body() request: UpdateProfileDto,
  ): Promise<ProfileDto> {
    return this.profileService.updateProfile(user, request);
  }
}
