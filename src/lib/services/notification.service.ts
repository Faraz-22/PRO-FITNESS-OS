import prisma from '@/lib/db/prisma';
import { NotificationCategory, NotificationChannel } from '@prisma/client';

export interface CreateNotificationParams {
  userId: string;
  category: NotificationCategory;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: any;
}

export class NotificationService {
  /**
   * Internal domain event dispatcher foundation.
   * Currently writes to DB for IN_APP consumption.
   * Can be extended to push to BullMQ, SQS, etc.
   */
  static async send(params: CreateNotificationParams) {
    // Check user preferences before sending
    const preference = await prisma.notificationPreference.findUnique({
      where: {
        userId_category_channel: {
          userId: params.userId,
          category: params.category,
          channel: NotificationChannel.IN_APP,
        }
      }
    });

    if (preference && !preference.isEnabled) {
      return null; // User explicitly disabled this category
    }

    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        category: params.category,
        title: params.title,
        message: params.message,
        actionUrl: params.actionUrl || null,
        metadata: params.metadata || {},
      }
    });

    // In the future:
    // if (pushPref.isEnabled) { PushNotificationAdapter.send(...) }

    return notification;
  }

  static async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true }
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }
}
