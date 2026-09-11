export type NotificationType = 'booking_request' | 'booking_confirmed' | 'booking_rejected';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}
