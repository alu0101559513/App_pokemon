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
  searchCards
} from '../services/pokemon.js';

export const pokemonRouter = Router();

/**
 * GET /pokemon/cards/name/:name
 * Obtiene cartas por nombre
 */
pokemonRouter.get('/pokemon/cards/name/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const cards = await getCardsByName(name);
    res.send(cards);
  } catch (error) {
    res.status(500).send({ error: 'Error fetching cards by name' });
  }
});

/**
 * GET /pokemon/cards/:id
 * Obtiene una carta específica por ID
 */
pokemonRouter.get('/pokemon/cards/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const card = await getCardById(id);
    res.send(card);
  } catch (error) {
    res.status(404).send({ error: 'Card not found' });
  }
});

/**
 * GET /pokemon/sets
 * Obtiene todos los sets disponibles
 */
pokemonRouter.get('/pokemon/sets', async (req: Request, res: Response) => {
  try {
    const sets = await getAllSets();
    res.send(sets);
  } catch (error) {
    res.status(500).send({ error: 'Error fetching sets' });
  }
});

/**
 * GET /pokemon/sets/:setId
 * Obtiene todas las cartas de un set específico
 */
pokemonRouter.get('/pokemon/sets/:setId', async (req: Request, res: Response) => {
  try {
    const { setId } = req.params;
    const cards = await getCardsBySet(setId);
    res.send(cards);
  } catch (error) {
    res.status(404).send({ error: 'Set not found' });
  }
});

/**
 * GET /pokemon/cards/type/:type
 * Obtiene cartas por tipo
 */
pokemonRouter.get('/pokemon/cards/type/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const cards = await getCardsByType(type);
    res.send(cards);
  } catch (error) {
    res.status(500).send({ error: 'Error fetching cards by type' });
  }
});

/**
 * GET /pokemon/cards/hp/:hp
 * Obtiene cartas por HP
 */
pokemonRouter.get('/pokemon/cards/hp/:hp', async (req: Request, res: Response) => {
  try {
    const hp = parseInt(req.params.hp);
    if (isNaN(hp)) {
      return res.status(400).send({ error: 'HP must be a number' });
    }
    const cards = await getCardsByHP(hp);
    res.send(cards);
  } catch (error) {
    res.status(500).send({ error: 'Error fetching cards by HP' });
  }
});

/**
 * GET /pokemon/cards/rarity/:rarity
 * Obtiene cartas por rareza
 */
pokemonRouter.get('/pokemon/cards/rarity/:rarity', async (req: Request, res: Response) => {
  try {
    const { rarity } = req.params;
    const cards = await getCardsByRarity(rarity);
    res.send(cards);
  } catch (error) {
    res.status(500).send({ error: 'Error fetching cards by rarity' });
  }
});

/**
 * GET /pokemon/series
 * Obtiene todas las series disponibles
 */
pokemonRouter.get('/pokemon/series', async (req: Request, res: Response) => {
  try {
    const series = await getAllSeries();
    res.send(series);
  } catch (error) {
    res.status(500).send({ error: 'Error fetching series' });
  }
});

/**
 * GET /pokemon/series/:seriesId
 * Obtiene información de una serie específica
 */
pokemonRouter.get('/pokemon/series/:seriesId', async (req: Request, res: Response) => {
  try {
    const { seriesId } = req.params;
    const series = await getSeriesById(seriesId);
    res.send(series);
  } catch (error) {
    res.status(404).send({ error: 'Series not found' });
  }
});

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
    res.send(cards);
  } catch (error) {
    res.status(500).send({ error: 'Error searching cards' });
  }
});

