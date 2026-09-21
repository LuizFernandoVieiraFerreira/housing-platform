import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';

import type { AuthUser } from '../../shared/auth/auth-user.model';
import { RequireUser } from '../../shared/auth/require-user.decorator';
import type {
  MarkAllNotificationsReadResultDto,
  NotificationDto,
  UnreadNotificationCountDto,
} from './dto';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  listNotifications(
    @RequireUser() user: AuthUser,
  ): Promise<NotificationDto[]> {
    return this.notificationService.listNotifications(user);
  }

  @Get('unread-count')
  getUnreadNotificationCount(
    @RequireUser() user: AuthUser,
  ): Promise<UnreadNotificationCountDto> {
    return this.notificationService.getUnreadCount(user);
  }

  @Post('read-all')
  markAllNotificationsRead(
    @RequireUser() user: AuthUser,
  ): Promise<MarkAllNotificationsReadResultDto> {
    return this.notificationService.markAllRead(user);
  }

  @Post(':notificationId/read')
  markNotificationRead(
    @RequireUser() user: AuthUser,
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
  ): Promise<NotificationDto> {
    return this.notificationService.markRead(user, notificationId);
  }
}
