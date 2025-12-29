import express from 'express';
import mongoose from 'mongoose';
import { Notification } from '../models/Notification.js';
import { validateObjectId } from '../utils/mongoHelpers.js';
import { sendError } from '../utils/responseHelpers.js';

export const notificationRouter = express.Router();

/**
 * GET /notifications/:userId
 * Obtener todas las notificaciones del usuario
 */
notificationRouter.get('/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, skip = 0 } = req.query;

    if (!validateObjectId(userId, res, 'ID de usuario')) {
      return;
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip));

    const total = await Notification.countDocuments({ userId });
    const unread = await Notification.countDocuments({ userId, isRead: false });

    res.send({
      notifications,
      total,
      unread,
      limit: Number(limit),
      skip: Number(skip),
    });
  } catch (error) {
    return sendError(res, error as Error, 500);
  }
});

/**
 * PATCH /notifications/:notificationId/read
 * Marcar una notificación como leída
 */
notificationRouter.patch(
  '/notifications/:notificationId/read',
  async (req, res) => {
    try {
      const { notificationId } = req.params;

      if (!validateObjectId(notificationId, res, 'ID de notificación')) {
        return;
      }

      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        return sendError(res, 'Notificación no encontrada', 404);
      }

      res.send(notification);
    } catch (error) {
      return sendError(res, error as Error, 500);
    }
  }
);

/**
 * PATCH /notifications/:userId/read-all
 * Marcar todas las notificaciones como leídas
 */
notificationRouter.patch(
  '/notifications/:userId/read-all',
  async (req, res) => {
    try {
      const { userId } = req.params;

      if (!validateObjectId(userId, res, 'ID de usuario')) {
        return;
      }

      const result = await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );

      res.send({
        message: 'Todas las notificaciones han sido marcadas como leídas',
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      return sendError(res, error as Error, 500);
    }
  }
);

/**
 * DELETE /notifications/:notificationId
 * Eliminar una notificación
 */
notificationRouter.delete(
  '/notifications/:notificationId',
  async (req, res) => {
    try {
      const { notificationId } = req.params;

      if (!validateObjectId(notificationId, res, 'ID de notificación')) {
        return;
      }

      const notification = await Notification.findByIdAndDelete(notificationId);

      if (!notification) {
        return sendError(res, 'Notificación no encontrada', 404);
      }

      res.send({ message: 'Notificación eliminada exitosamente' });
    } catch (error) {
      res
        .status(500)
        .send({ error: (error as Error).message ?? String(error) });
    }
  }
);
