import { Injectable } from '@nestjs/common';

import type { AuthUser } from '../../shared/auth/auth-user.model';
import { NotFoundError } from '../../shared/errors';
import type {
  MarkAllNotificationsReadResultDto,
  NotificationDto,
  UnreadNotificationCountDto,
} from './dto';
import { mapNotification } from './mappers/notification.mapper';
import { NotificationRepository } from './notification.repository';

@Injectable()
export class NotificationService {
  constructor(private readonly repository: NotificationRepository) {}

  async listNotifications(user: AuthUser): Promise<NotificationDto[]> {
    const rows = await this.repository.listForUser(user.id);
    return rows.map(mapNotification);
  }

  async getUnreadCount(user: AuthUser): Promise<UnreadNotificationCountDto> {
    const count = await this.repository.countUnread(user.id);
    return { count };
  }

  async markRead(
    user: AuthUser,
    notificationId: string,
  ): Promise<NotificationDto> {
    const notification = await this.repository.markRead(user.id, notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    return mapNotification(notification);
  }

  async markAllRead(
    user: AuthUser,
  ): Promise<MarkAllNotificationsReadResultDto> {
    const updatedCount = await this.repository.markAllRead(user.id);
    return { updatedCount };
  }
}
