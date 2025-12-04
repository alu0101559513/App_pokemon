import express from 'express';
import { syncAllCards } from '../services/cards.js';

export const syncRouter = express.Router();

/**
 * Ruta para sincronizar todas las cartas desde la API externa
 */
syncRouter.post('/sync/cards', async (req, res) => {
  try {
    const total = await syncAllCards();
    res.send({ message: 'Sincronización completada correctamente', total });
  } catch (error) {
    res.status(500).send({ error: "Error al sincronizar cartas", details: (error as Error).message ?? String(error) });
}
});
