import { Types } from 'mongoose';
import { Notification, INotification } from '../models/Notification';

export const formatNotification = (notification: INotification) => ({
  id: notification._id.toString(),
  userId: notification.userId.toString(),
  title: notification.title,
  message: notification.message,
  isRead: notification.isRead,
  createdAt: notification.createdAt.toISOString(),
});

export const createNotification = async (
  userId: string | Types.ObjectId,
  title: string,
  message: string
): Promise<INotification> => {
  return Notification.create({
    userId,
    title,
    message,
    isRead: false,
  });
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  return Notification.countDocuments({ userId, isRead: false });
};
