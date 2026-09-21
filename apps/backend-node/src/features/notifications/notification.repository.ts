import { Injectable } from '@nestjs/common';
import type { notifications } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationRepository {
  static readonly LIST_LIMIT = 50;

  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string): Promise<notifications[]> {
    return this.prisma.notifications.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: NotificationRepository.LIST_LIMIT,
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notifications.count({
      where: {
        user_id: userId,
        read_at: null,
      },
    });
  }

  async markRead(
    userId: string,
    notificationId: string,
  ): Promise<notifications | null> {
    const now = new Date();

    const updated = await this.prisma.notifications.updateMany({
      where: {
        id: notificationId,
        user_id: userId,
        read_at: null,
      },
      data: { read_at: now },
    });

    if (updated.count > 0) {
      return this.prisma.notifications.findFirst({
        where: {
          id: notificationId,
          user_id: userId,
        },
      });
    }

    return this.prisma.notifications.findFirst({
      where: {
        id: notificationId,
        user_id: userId,
      },
    });
  }

  async markAllRead(userId: string): Promise<number> {
    const now = new Date();
    const result = await this.prisma.notifications.updateMany({
      where: {
        user_id: userId,
        read_at: null,
      },
      data: { read_at: now },
    });

    return result.count;
  }
}
