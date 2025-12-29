import express from 'express';
import { UserCard } from '../models/UserCard.js';
import { User } from '../models/User.js';
import { Card } from '../models/Card.js';
import { getCardsByName } from '../services/pokemon.js';
import { upsertCardFromRaw } from '../services/cards.js';
import {
  isValidCollectionType,
  getUserCardsPaginated,
  findUserOrFail,
} from '../utils/userHelpers.js';
import { sendSuccess, sendError } from '../utils/responseHelpers.js';
export const userCardRouter = express.Router();

userCardRouter.post('/usercards/import', async (req, res) => {
  try {
    const { username, query = '', limit = 5, forTrade = true } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const apiResult = await getCardsByName(query);
    const rawCards = apiResult.data || [];

    if (!rawCards.length)
      return res
        .status(404)
        .json({ error: 'No se encontraron cartas en la API' });

    const cards = rawCards
      .filter((c: any) => c.images && (c.images.small || c.images.large))
      .slice(0, limit);

    if (!cards.length)
      return res
        .status(404)
        .json({ error: 'No se encontraron cartas con imagen disponible' });

    const createdUserCards = [];

    for (const c of cards) {
      // Usar upsertCardFromRaw para guardar la carta correctamente con el patrón discriminator
      let localCard = await upsertCardFromRaw(c);
      
      if (!localCard) {
        console.warn(`No se pudo guardar la carta: ${c.id}`);
        continue;
      }

      const userCard = await UserCard.findOneAndUpdate(
        { userId: user._id, cardId: localCard._id },
        {
          $setOnInsert: {
            forTrade,
            collectionType: 'collection',
            pokemonTcgId: localCard.pokemonTcgId,
          },
        },
        { upsert: true, new: true }
      );

      createdUserCards.push(userCard);
    }

    res.json({
      message: ` ${createdUserCards.length} cartas importadas para ${username}`,
      cards: createdUserCards,
    });
  } catch (error) {
    console.error('Error al importar cartas:', error);
    res.status(500).json({ error: 'Error al importar cartas desde la API' });
  }
});

/**
 * POST /usercards/:username/:type
 * Agrega una carta a la colección o lista de deseos del usuario
 */
userCardRouter.post('/usercards/:username/:type', async (req, res) => {
  try {
    const { username, type } = req.params;
    if (!isValidCollectionType(type)) {
      return sendError(res, 'Tipo inválido. Use "collection" o "wishlist".', 400);
    }
    const user = await findUserOrFail(username, res);
    if (!user) return;

    const newCard = new UserCard({
      ...req.body,
      userId: user._id,
      collectionType: type,
    });

    await newCard.save();
    return sendSuccess(res, newCard, 'Carta añadida exitosamente', 201);
  } catch (error: any) {
    return sendError(res, error);
  }
});
/**
 * GET /usercards/discover
 * Obtiene cartas de otros usuarios marcadas para intercambio
 */
userCardRouter.get('/usercards/discover', async (req, res) => {
  try {
    const { page = 1, limit = 20, excludeUsername } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const filter = {
      forTrade: true,
      collectionType: 'collection',
    };
    if (excludeUsername) {
      const owner = await User.findOne({ username: excludeUsername });
      if (owner) {
        (filter as any).userId = { $ne: owner._id };
      }
    }

    const total = await UserCard.countDocuments(filter);

    const cards = await UserCard.find(filter)
      .select('userId cardId pokemonTcgId quantity forTrade condition collectionType createdAt')
      .populate('userId', 'username profileImage')
      .populate('cardId', 'name images rarity set price pokemonTcgId category hp types abilities attacks artist illustrator series')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.send({
      page: Number(page),
      totalResults: total,
      totalPages: Math.ceil(total / Number(limit)),
      resultsPerPage: Number(limit),
      cards,
    });
  } catch (error: any) {
    console.error('Error en /usercards/discover:', error);
    res.status(500).send({ error: error.message });
  }
});

/**
 * GET /usercards/:username
 * Obtiene todas las cartas de un usuario (colección y lista de deseos)
 */
userCardRouter.get('/usercards/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { page, limit, forTrade } = req.query;

    const result = await getUserCardsPaginated(username, {}, { page, limit, forTrade });

    if (result.error) {
      return sendError(res, result.error, result.statusCode);
    }

    // Responder directamente sin envolver en sendSuccess para mantener compatibilidad con cliente
    return res.status(200).send({
      page: result.pageNum,
      totalPages: result.totalPages,
      totalResults: result.total,
      resultsPerPage: result.limitNum,
      cards: result.cards || [],
    });
  } catch (error: any) {
    return sendError(res, error);
  }
});

/**
 * GET /usercards/:username/:type
 * Obtiene las cartas de un usuario por tipo (colección o lista de deseos)
 */
userCardRouter.get('/usercards/:username/:type', async (req, res) => {
  try {
    const { username, type } = req.params;
    const { page, limit, forTrade } = req.query;

    if (!isValidCollectionType(type)) {
      return sendError(res, 'Tipo inválido. Use "collection" o "wishlist".', 400);
    }

    const result = await getUserCardsPaginated(
      username,
      { collectionType: type },
      { page, limit, forTrade }
    );

    if (result.error) {
      return sendError(res, result.error, result.statusCode);
    }

    // Responder directamente sin envolver en sendSuccess para mantener compatibilidad con cliente
    return res.status(200).send({
      page: result.pageNum,
      totalPages: result.totalPages,
      totalResults: result.total,
      resultsPerPage: result.limitNum,
      cards: result.cards,
    });
  } catch (error: any) {
    return sendError(res, error);
  }
});

/**
 * PATCH /usercards/:username/cards/:userCardId
 * Actualiza una carta específica en la colección o lista de deseos del usuario
 */
userCardRouter.patch(
  '/usercards/:username/cards/:userCardId',
  async (req, res) => {
    try {
      const { username, userCardId } = req.params;
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).send({ error: 'Usuario no encontrado' });
      }

      const userCard = await UserCard.findOneAndUpdate(
        { _id: userCardId, userId: user._id },
        req.body,
        { new: true, runValidators: true }
      );

      if (!userCard) {
        return res.status(404).send({ error: 'Carta no encontrada' });
      }
      res.send(userCard);
    } catch (error) {
      res
        .status(400)
        .send({ error: (error as Error).message ?? String(error) });
    }
  }
);

/**
 * DELETE /usercards/:username/cards/:userCardId
 * Elimina una carta específica de la colección o lista de deseos del usuario
 */
userCardRouter.delete(
  '/usercards/:username/cards/:userCardId',
  async (req, res) => {
    try {
      const { username, userCardId } = req.params;
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).send({ error: 'Usuario no encontrado' });
      }

      const deletedCard = await UserCard.findOneAndDelete({
        _id: userCardId,
        userId: user._id,
      });

      if (!deletedCard) {
        return res.status(404).send({ error: 'Carta no encontrada' });
      }
      res.send({ message: 'Carta eliminada correctamente', deletedCard });
    } catch (error) {
      res
        .status(500)
        .send({ error: (error as Error).message ?? String(error) });
    }
  }
);
