import { Router, Request, Response } from 'express';
import {
  getCardsByName,
  getCardById,
  getCardsBySet,
  getAllSets,
  getCardsByType,
  getCardsByHP,
  getCardsByRarity,
  getSeriesById,
  getAllSeries,
  searchCards,
} from '../services/pokemon.js';
import { sendSuccess, sendError } from '../utils/responseHelpers.js';

export const pokemonRouter = Router();

/**
 * GET /pokemon/cards/name/:name
 * Obtiene cartas por nombre
 */
pokemonRouter.get(
  '/pokemon/cards/name/:name',
  async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const cards = await getCardsByName(name);
      return sendSuccess(res, cards);
    } catch (error: any) {
      return sendError(res, error, 500);
    }
  }
);

/**
 * GET /pokemon/cards/:id
 * Obtiene una carta específica por ID
 */
pokemonRouter.get('/pokemon/cards/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const card = await getCardById(id);
    if (!card) {
      return sendError(res, 'Card not found', 404);
    }
    return sendSuccess(res, card);
  } catch (error: any) {
    return sendError(res, error);
  }
});

/**
 * GET /pokemon/sets
 * Obtiene todos los sets disponibles
 */
pokemonRouter.get('/pokemon/sets', async (req: Request, res: Response) => {
  try {
    const sets = await getAllSets();
    return sendSuccess(res, sets);
  } catch (error: any) {
    return sendError(res, error, 500);
  }
});

/**
 * GET /pokemon/sets/:setId
 * Obtiene todas las cartas de un set específico
 */
pokemonRouter.get(
  '/pokemon/sets/:setId',
  async (req: Request, res: Response) => {
    try {
      const { setId } = req.params;
      const cards = await getCardsBySet(setId);
      if (!cards || (Array.isArray(cards) && cards.length === 0)) {
        return sendError(res, 'Set not found', 404);
      }
      return sendSuccess(res, cards);
    } catch (error: any) {
      return sendError(res, error);
    }
  }
);

/**
 * GET /pokemon/cards/type/:type
 * Obtiene cartas por tipo
 */
pokemonRouter.get(
  '/pokemon/cards/type/:type',
  async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      const cards = await getCardsByType(type);
      return sendSuccess(res, cards);
    } catch (error: any) {
      return sendError(res, error, 500);
    }
  }
);

/**
 * GET /pokemon/cards/hp/:hp
 * Obtiene cartas por HP
 */
pokemonRouter.get(
  '/pokemon/cards/hp/:hp',
  async (req: Request, res: Response) => {
    try {
      const hp = parseInt(req.params.hp);
      if (isNaN(hp)) {
        return sendError(res, 'HP must be a number', 400);
      }
      const cards = await getCardsByHP(hp);
      return sendSuccess(res, cards);
    } catch (error: any) {
      return sendError(res, error, 500);
    }
  }
);

/**
 * GET /pokemon/cards/rarity/:rarity
 * Obtiene cartas por rareza
 */
pokemonRouter.get(
  '/pokemon/cards/rarity/:rarity',
  async (req: Request, res: Response) => {
    try {
      const { rarity } = req.params;
      const cards = await getCardsByRarity(rarity);
      return sendSuccess(res, cards);
    } catch (error: any) {
      return sendError(res, error, 500);
    }
  }
);

/**
 * GET /pokemon/series
 * Obtiene todas las series disponibles
 */
pokemonRouter.get('/pokemon/series', async (req: Request, res: Response) => {
  try {
    const series = await getAllSeries();
    return sendSuccess(res, series);
  } catch (error: any) {
    return sendError(res, error, 500);
  }
});

/**
 * GET /pokemon/series/:seriesId
 * Obtiene información de una serie específica
 */
pokemonRouter.get(
  '/pokemon/series/:seriesId',
  async (req: Request, res: Response) => {
    try {
      const { seriesId } = req.params;
      const series = await getSeriesById(seriesId);
      if (!series) {
        return sendError(res, 'Series not found', 404);
      }
      return sendSuccess(res, series);
    } catch (error: any) {
      return sendError(res, error);
    }
  }
);

/**
 * GET /pokemon/search
 * Búsqueda avanzada con query parameters
 * Parámetros opcionales: name, types, hp, rarity, set
 */
pokemonRouter.get('/pokemon/search', async (req: Request, res: Response) => {
  try {
    const filters: any = {};

    if (req.query.name) filters.name = req.query.name as string;
    if (req.query.types) filters.types = req.query.types as string;
    if (req.query.hp) filters.hp = parseInt(req.query.hp as string);
    if (req.query.rarity) filters.rarity = req.query.rarity as string;
    if (req.query.set) filters.set = req.query.set as string;

    const cards = await searchCards(filters);
    return sendSuccess(res, cards);
  } catch (error: any) {
    return sendError(res, error, 500);
  }
});
