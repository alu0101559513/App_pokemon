import express from 'express';
import mongoose from 'mongoose';
import { Notification } from '../models/Notification.js';

export const notificationRouter = express.Router();

/**
 * GET /notifications/:userId
 * Obtener todas las notificaciones del usuario
 */
notificationRouter.get('/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, skip = 0 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).send({ error: 'ID de usuario inválido' });
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
      skip: Number(skip)
    });
  } catch (error) {
    res.status(500).send({ error: (error as Error).message ?? String(error) });
  }
});

/**
 * PATCH /notifications/:notificationId/read
 * Marcar una notificación como leída
 */
notificationRouter.patch('/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).send({ error: 'ID de notificación inválido' });
    }

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).send({ error: 'Notificación no encontrada' });
    }

    res.send(notification);
  } catch (error) {
    res.status(500).send({ error: (error as Error).message ?? String(error) });
  }
});

/**
 * PATCH /notifications/:userId/read-all
 * Marcar todas las notificaciones como leídas
 */
notificationRouter.patch('/notifications/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).send({ error: 'ID de usuario inválido' });
    }

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.send({
      message: 'Todas las notificaciones han sido marcadas como leídas',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).send({ error: (error as Error).message ?? String(error) });
  }
});

/**
 * DELETE /notifications/:notificationId
 * Eliminar una notificación
 */
notificationRouter.delete('/notifications/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).send({ error: 'ID de notificación inválido' });
    }

    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).send({ error: 'Notificación no encontrada' });
    }

    res.send({ message: 'Notificación eliminada exitosamente' });
  } catch (error) {
    res.status(500).send({ error: (error as Error).message ?? String(error) });
  }
});
