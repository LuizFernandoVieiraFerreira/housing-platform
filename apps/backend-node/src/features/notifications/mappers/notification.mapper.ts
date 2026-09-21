import type { notifications } from '@prisma/client';

import { formatDateTime } from '../../bookings/mappers/booking.mapper';
import type { NotificationDto } from '../dto/notification.dto';
import { NotificationType } from '../dto/notification-type.dto';

export function mapNotification(notification: notifications): NotificationDto {
  return {
    id: notification.id,
    userId: notification.user_id,
    type: notification.type as NotificationType,
    title: notification.title,
    body: notification.body,
    metadata: (notification.metadata as Record<string, unknown>) ?? {},
    readAt: notification.read_at ? formatDateTime(notification.read_at) : null,
    createdAt: formatDateTime(notification.created_at),
  };
}
