import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { parsePagination, paginationMeta } from '../utils/pagination';
import {
  formatNotification,
  getUnreadCount,
} from '../services/notification.service';

export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);
  const userId = req.user!.id;

  const [notifications, total] = await Promise.all([
    Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ userId }),
  ]);

  res.json({
    success: true,
    data: {
      notifications: notifications.map(formatNotification),
    },
    meta: paginationMeta(total, page, limit),
  });
});

export const getUnreadNotificationCount = asyncHandler(
  async (req: Request, res: Response) => {
    const count = await getUnreadCount(req.user!.id);
    res.json({
      success: true,
      data: { count },
    });
  }
);

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    userId: req.user!.id,
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  notification.isRead = true;
  await notification.save();

  res.json({
    success: true,
    message: 'Notification marked as read',
    data: { notification: formatNotification(notification) },
  });
});

export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  await Notification.updateMany({ userId: req.user!.id, isRead: false }, { isRead: true });

  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
});
