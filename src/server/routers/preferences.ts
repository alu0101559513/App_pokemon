import express from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { validateObjectId } from '../utils/mongoHelpers.js';
import { sendError } from '../utils/responseHelpers.js';

export const preferencesRouter = express.Router();

/**
 * GET /users/:userId/preferences
 * Obtener preferencias del usuario
 */
preferencesRouter.get('/users/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!validateObjectId(userId, res, 'ID de usuario')) {
      return;
    }

    const user = await User.findById(userId).select('settings');

    if (!user) {
      return sendError(res, 'Usuario no encontrado', 404);
    }

    res.send({
      language: user.settings?.language || 'es',
      darkMode: user.settings?.darkMode || false,
      notifications: user.settings?.notifications,
      privacy: user.settings?.privacy,
    });
  } catch (error) {
    return sendError(res, error as Error, 500);
  }
});

/**
 * PATCH /users/:userId/preferences
 * Actualizar preferencias del usuario
 */
preferencesRouter.patch('/users/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;
    const { language, darkMode, notifications, privacy } = req.body;

    if (!validateObjectId(userId, res, 'ID de usuario')) {
      return;
    }

    // Validar idioma
    if (language && !['es', 'en'].includes(language)) {
      return res
        .status(400)
        .send({ error: 'Idioma inválido. Usa "es" o "en"' });
    }

    const updateData: any = {};

    if (language !== undefined) {
      updateData['settings.language'] = language;
    }
    if (darkMode !== undefined) {
      updateData['settings.darkMode'] = darkMode;
    }
    if (notifications) {
      if (notifications.trades !== undefined)
        updateData['settings.notifications.trades'] = notifications.trades;
      if (notifications.messages !== undefined)
        updateData['settings.notifications.messages'] = notifications.messages;
      if (notifications.friendRequests !== undefined)
        updateData['settings.notifications.friendRequests'] =
          notifications.friendRequests;
    }
    if (privacy) {
      if (privacy.showCollection !== undefined)
        updateData['settings.privacy.showCollection'] = privacy.showCollection;
      if (privacy.showWishlist !== undefined)
        updateData['settings.privacy.showWishlist'] = privacy.showWishlist;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('settings');

    if (!user) {
      return sendError(res, 'Usuario no encontrado', 404);
    }

    res.send({
      message: 'Preferencias actualizadas exitosamente',
      preferences: {
        language: user.settings?.language,
        darkMode: user.settings?.darkMode,
        notifications: user.settings?.notifications,
        privacy: user.settings?.privacy,
      },
    });
  } catch (error) {
    return sendError(res, error as Error, 500);
  }
});
