import type { NotificationType } from './notification-type.dto';

export interface NotificationDto {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface UnreadNotificationCountDto {
  count: number;
}

export interface MarkAllNotificationsReadResultDto {
  updatedCount: number;
}
