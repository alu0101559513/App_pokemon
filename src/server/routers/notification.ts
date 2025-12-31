import express from 'express';
import { Notification } from '../models/Notification.js';
import { validateObjectId } from '../utils/mongoHelpers.js';
import { sendError, sendSuccess, asyncHandler, ensureResourceExists } from '../utils/responseHelpers.js';

export const notificationRouter = express.Router();

/**
 * GET /notifications/:userId
 * Obtener todas las notificaciones del usuario
 */
notificationRouter.get(
  '/notifications/:userId',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { limit = 10, skip = 0 } = req.query;

    if (!validateObjectId(userId, res, 'ID de usuario')) return;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip));

    const total = await Notification.countDocuments({ userId });
    const unread = await Notification.countDocuments({ userId, isRead: false });

    return sendSuccess(res, {
      notifications,
      total,
      unread,
      limit: Number(limit),
      skip: Number(skip),
    });
  })
);

/**
 * PATCH /notifications/:notificationId/read
 * Marcar una notificación como leída
 */
notificationRouter.patch(
  '/notifications/:notificationId/read',
  asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    if (!validateObjectId(notificationId, res, 'ID de notificación')) return;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!ensureResourceExists(res, notification, 'Notificación')) return;
    return sendSuccess(res, notification);
  })
);

/**
 * PATCH /notifications/:userId/read-all
 * Marcar todas las notificaciones como leídas
 */
notificationRouter.patch(
  '/notifications/:userId/read-all',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!validateObjectId(userId, res, 'ID de usuario')) return;

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    return sendSuccess(res, {
      message: 'Todas las notificaciones han sido marcadas como leídas',
      modifiedCount: result.modifiedCount,
    });
  })
);

/**
 * DELETE /notifications/:notificationId
 * Eliminar una notificación
 */
notificationRouter.delete(
  '/notifications/:notificationId',
  asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    if (!validateObjectId(notificationId, res, 'ID de notificación')) return;

    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!ensureResourceExists(res, notification, 'Notificación')) return;
    return sendSuccess(res, { message: 'Notificación eliminada exitosamente' });
  })
);

