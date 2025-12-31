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
import { sendSuccess, sendError, asyncHandler, ensureResourceExists } from '../utils/responseHelpers.js';

export const pokemonRouter = Router();

/**
 * GET /pokemon/cards/name/:name
 * Obtiene cartas por nombre
 */
pokemonRouter.get(
  '/pokemon/cards/name/:name',
  asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.params;
    const cards = await getCardsByName(name);
    return sendSuccess(res, cards);
  })
);

/**
 * GET /pokemon/cards/:id
 * Obtiene una carta específica por ID
 */
pokemonRouter.get(
  '/pokemon/cards/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const card = await getCardById(id);
    if (!ensureResourceExists(res, card, 'Card')) return;
    return sendSuccess(res, card);
  })
);

/**
 * GET /pokemon/sets
 * Obtiene todos los sets disponibles
 */
pokemonRouter.get(
  '/pokemon/sets',
  asyncHandler(async (req: Request, res: Response) => {
    const sets = await getAllSets();
    return sendSuccess(res, sets);
  })
);

/**
 * GET /pokemon/sets/:setId
 * Obtiene todas las cartas de un set específico
 */
pokemonRouter.get(
  '/pokemon/sets/:setId',
  asyncHandler(async (req: Request, res: Response) => {
    const { setId } = req.params;
    const cards = await getCardsBySet(setId);
    if (!cards || (Array.isArray(cards) && cards.length === 0)) {
      return sendError(res, 'Set not found', 404);
    }
    return sendSuccess(res, cards);
  })
);

/**
 * GET /pokemon/cards/type/:type
 * Obtiene cartas por tipo
 */
pokemonRouter.get(
  '/pokemon/cards/type/:type',
  asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params;
    const cards = await getCardsByType(type);
    return sendSuccess(res, cards);
  })
);

/**
 * GET /pokemon/cards/hp/:hp
 * Obtiene cartas por HP
 */
pokemonRouter.get(
  '/pokemon/cards/hp/:hp',
  asyncHandler(async (req: Request, res: Response) => {
    const hp = parseInt(req.params.hp);
    if (isNaN(hp)) {
      return sendError(res, 'HP must be a number', 400);
    }
    const cards = await getCardsByHP(hp);
    return sendSuccess(res, cards);
  })
);

/**
 * GET /pokemon/cards/rarity/:rarity
 * Obtiene cartas por rareza
 */
pokemonRouter.get(
  '/pokemon/cards/rarity/:rarity',
  asyncHandler(async (req: Request, res: Response) => {
    const { rarity } = req.params;
    const cards = await getCardsByRarity(rarity);
    return sendSuccess(res, cards);
  })
);

/**
 * GET /pokemon/series
 * Obtiene todas las series disponibles
 */
pokemonRouter.get(
  '/pokemon/series',
  asyncHandler(async (req: Request, res: Response) => {
    const series = await getAllSeries();
    return sendSuccess(res, series);
  })
);

/**
 * GET /pokemon/series/:seriesId
 * Obtiene información de una serie específica
 */
pokemonRouter.get(
  '/pokemon/series/:seriesId',
  asyncHandler(async (req: Request, res: Response) => {
    const { seriesId } = req.params;
    const series = await getSeriesById(seriesId);
    if (!ensureResourceExists(res, series, 'Series')) return;
    return sendSuccess(res, series);
  })
);

/**
 * GET /pokemon/search
 * Búsqueda avanzada con query parameters
 * Parámetros opcionales: name, types, hp, rarity, set
 */
pokemonRouter.get(
  '/pokemon/search',
  asyncHandler(async (req: Request, res: Response) => {
    const filters: any = {};

    if (req.query.name) filters.name = req.query.name as string;
    if (req.query.types) filters.types = req.query.types as string;
    if (req.query.hp) filters.hp = parseInt(req.query.hp as string);
    if (req.query.rarity) filters.rarity = req.query.rarity as string;
    if (req.query.set) filters.set = req.query.set as string;

    const cards = await searchCards(filters);
    return sendSuccess(res, cards);
  })
);

