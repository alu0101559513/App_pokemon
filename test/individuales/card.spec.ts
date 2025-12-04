import { describe, it, beforeEach, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { app } from "../../src/server/api.js";
import { Card } from "../../src/server/models/Card.js";

beforeEach(async () => {
  await Card.deleteMany();
  const { PokemonCard } = await import('../../src/server/models/PokemonCard.js');
  await PokemonCard.deleteMany();
});

describe('GET /cards', () => {
  /**
   * Test: Obtener lista paginada de cartas
   * Verifica que el endpoint retorna cartas paginadas correctamente
   * y contiene las propiedades esperadas (cards, totalResults, page)
   */
  it('devuelve la lista paginada de cartas', async () => {
    await Card.insertMany([
      {
        pokemonTcgId: 'base1-1',
        name: 'Pikachu',
        rarity: 'Common',
        series: 'Base',
        set: 'Base Set',
        types: ['Electric'],
      },
      {
        pokemonTcgId: 'base1-2',
        name: 'Charizard',
        rarity: 'Rare',
        series: 'Base',
        set: 'Base Set',
        types: ['Fire'],
      },
    ]);

    const res = await request(app).get('/cards?page=1&limit=1').expect(200);

    expect(Array.isArray(res.body.cards)).toBe(true);
    expect(res.body.cards.length).toBe(1);
    expect(res.body.totalResults).toBe(2);
    expect(res.body.page).toBe(1);
  });

  /**
   * Test: Filtrar cartas por múltiples criterios
   * Verifica que los filtros (nombre, rareza, serie, set, tipo) funcionan correctamente
   * y retornan solo las cartas que coinciden con los filtros especificados
   */
  it('aplica correctamente los filtros', async () => {
    await Card.insertMany([
      {
        pokemonTcgId: 'base1-3',
        name: 'Bulbasaur',
        rarity: 'Common',
        series: 'Base',
        set: 'Grass Set',
        types: ['Grass'],
      },
      {
        pokemonTcgId: 'base1-4',
        name: 'Ivysaur',
        rarity: 'Uncommon',
        series: 'Base',
        set: 'Grass Set',
        types: ['Grass'],
      },
      {
        pokemonTcgId: 'base1-5',
        name: 'Charmander',
        rarity: 'Common',
        series: 'Base',
        set: 'Fire Set',
        types: ['Fire'],
      },
    ]);

    const res = await request(app)
      .get('/cards?name=Bulb&rarity=Common&series=Base&set=Grass%20Set&type=Grass')
      .expect(200);

    expect(res.body.cards.length).toBe(1);
    expect(res.body.cards[0].name).toBe('Bulbasaur');
    expect(res.body.cards[0].rarity).toBe('Common');
    expect(res.body.cards[0].series).toBe('Base');
  });

  /**
   * Test: Lista vacía cuando no hay resultados
   * Verifica que retorna un array vacío de cartas cuando ninguna coincide con los filtros
   */
  it('devuelve [] si no hay resultados', async () => {
    const res = await request(app).get('/cards?rarity=Mythical').expect(200);

    expect(Array.isArray(res.body.cards)).toBe(true);
    expect(res.body.cards.length).toBe(0);
    expect(res.body.totalResults).toBe(0);
  });
});

describe('GET /cards/:id', () => {
  /**
   * Test: Obtener carta por ID
   * Verifica que se pueda recuperar una carta individual usando su ObjectId de MongoDB
   */
  it('devuelve una carta por _id', async () => {
    const card = await Card.create({
      pokemonTcgId: 'base1-7',
      name: 'Squirtle',
      rarity: 'Common',
      series: 'Base',
      set: 'Water Set',
      types: ['Water'],
    });

    const res = await request(app).get(`/cards/${card._id}`).expect(200);

    expect(res.body.name).toBe('Squirtle');
    expect(res.body._id).toBe(String(card._id));
  });

  /**
   * Test: Carta no encontrada por ID
   * Verifica que retorna 404 cuando se intenta obtener una carta con un ID inválido o inexistente
   */
  it('devuelve 404 si no se encuentra la carta', async () => {
    const res = await request(app)
      .get(`/cards/${new mongoose.Types.ObjectId()}`)
      .expect(404);

    expect(res.body.error).toBe('Carta no encontrada');
  });
});

describe('GET /cards/tcg/:tcgId', () => {
  /**
   * Test: Obtener carta por Pokemon TCG ID
   * Verifica que se pueda recuperar una carta usando su ID de la API de Pokemon TCG
   */
  it('devuelve una carta por pokemonTcgId', async () => {
    const { PokemonCard } = await import('../../src/server/models/PokemonCard.js');
    
    const card = await PokemonCard.create({
      pokemonTcgId: 'test-tcg-sv04pt-1',
      name: 'Pecharunt',
      rarity: 'Rare',
      series: 'Scarlet & Violet',
      set: 'Paradox Rift',
      types: ['Poison'],
      hp: 120,
      artist: 'Test',
    });

    const res = await request(app).get(`/cards/tcg/test-tcg-sv04pt-1`).expect(200);

    expect(res.body.card).toBeDefined();
    expect(res.body.card.pokemonTcgId).toBe('test-tcg-sv04pt-1');
  });

  /**
   * Test: Carta no encontrada por TCG ID
   * Verifica que retorna 404 cuando no existe una carta con el TCG ID especificado
   */
  it('devuelve 404 si no existe carta con ese tcgId', async () => {
    const res = await request(app).get(`/cards/tcg/nonexistent-id-999`).expect(404);

    expect(res.body.error).toBe('Card not found in cache');
  });
});

describe('GET /cards/search/quick', () => {
  /**
   * Test: Búsqueda rápida de cartas
   * Verifica que la búsqueda rápida retorna cartas que coinciden con los criterios
   */
  it('retorna cartas que coinciden con la búsqueda', async () => {
    await Card.insertMany([
      {
        pokemonTcgId: 'base1-25',
        name: 'Pikachu',
        rarity: 'Common',
        series: 'Base',
        set: 'Base Set',
        types: ['Electric'],
      },
      {
        pokemonTcgId: 'base1-6',
        name: 'Charizard',
        rarity: 'Rare',
        series: 'Base',
        set: 'Base Set',
        types: ['Fire'],
      },
      {
        pokemonTcgId: 'base1-4',
        name: 'Charmander',
        rarity: 'Common',
        series: 'Base',
        set: 'Base Set',
        types: ['Fire'],
      },
    ]);

    const res = await request(app)
      .get('/cards/search/quick?q=Char')
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
    expect(res.body.data.some((c: any) => c.name.includes('Char'))).toBe(true);
  });

  /**
   * Test: Búsqueda sin resultados
   * Verifica que retorna array vacío cuando no hay coincidencias
   */
  it('retorna [] si no hay coincidencias', async () => {
    const res = await request(app)
      .get('/cards/search/quick?q=NonexistentCard')
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  /**
   * Test: Búsqueda rápida sin query
   * Verifica que retorna error cuando no se proporciona término de búsqueda
   */
  it('retorna 400 sin parámetro q', async () => {
    const res = await request(app)
      .get('/cards/search/quick')
      .expect(400);

    expect(res.body.error).toBeDefined();
  });
});