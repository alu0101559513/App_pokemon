import express from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';

export const preferencesRouter = express.Router();

/**
 * GET /users/:userId/preferences
 * Obtener preferencias del usuario
 */
preferencesRouter.get('/users/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).send({ error: 'ID de usuario inválido' });
    }

    const user = await User.findById(userId).select('settings');

    if (!user) {
      return res.status(404).send({ error: 'Usuario no encontrado' });
    }

    res.send({
      language: user.settings?.language || 'es',
      darkMode: user.settings?.darkMode || false,
      notifications: user.settings?.notifications,
      privacy: user.settings?.privacy
    });
  } catch (error) {
    res.status(500).send({ error: (error as Error).message ?? String(error) });
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

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).send({ error: 'ID de usuario inválido' });
    }

    // Validar idioma
    if (language && !['es', 'en'].includes(language)) {
      return res.status(400).send({ error: 'Idioma inválido. Usa "es" o "en"' });
    }

    const updateData: any = {};

    if (language !== undefined) {
      updateData['settings.language'] = language;
    }
    if (darkMode !== undefined) {
      updateData['settings.darkMode'] = darkMode;
    }
    if (notifications) {
      if (notifications.trades !== undefined) updateData['settings.notifications.trades'] = notifications.trades;
      if (notifications.messages !== undefined) updateData['settings.notifications.messages'] = notifications.messages;
      if (notifications.friendRequests !== undefined) updateData['settings.notifications.friendRequests'] = notifications.friendRequests;
    }
    if (privacy) {
      if (privacy.showCollection !== undefined) updateData['settings.privacy.showCollection'] = privacy.showCollection;
      if (privacy.showWishlist !== undefined) updateData['settings.privacy.showWishlist'] = privacy.showWishlist;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('settings');

    if (!user) {
      return res.status(404).send({ error: 'Usuario no encontrado' });
    }

    res.send({
      message: 'Preferencias actualizadas exitosamente',
      preferences: {
        language: user.settings?.language,
        darkMode: user.settings?.darkMode,
        notifications: user.settings?.notifications,
        privacy: user.settings?.privacy
      }
    });
  } catch (error) {
    res.status(500).send({ error: (error as Error).message ?? String(error) });
  }
});
