import { describe, it, beforeEach, expect } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../src/server/api.ts';
import { User } from '../../src/server/models/User.ts';
import { Card } from '../../src/server/models/Card.ts';
import { UserCard } from '../../src/server/models/UserCard.ts';

/**
 * Tests para funcionalidades avanzadas de cartas de usuario
 * Incluye pruebas de gestión de colecciones, wishlist, notas y operaciones en lotes
 */

beforeEach(async () => {
  await User.deleteMany();
  await Card.deleteMany();
  await UserCard.deleteMany();
});

describe('Advanced UserCard Features', () => {
  describe('Collection vs Wishlist Management', () => {
    /**
     * Test: Distinguir entre colección y wishlist
     * Verifica que una misma carta puede estar en la colección y en la wishlist como registros separados
     */
    it('debe distinguir correctamente entre collection y wishlist', async () => {
      const user = await User.create({
        username: 'collector',
        email: 'collector@example.com',
        password: 'pass123',
      });

      const card = await Card.create({
        pokemonTcgId: 'advanced-1',
        name: 'Test Card',
        imageUrl: 'https://example.com/card.jpg',
        marketPrice: 100,
        types: ['Fire'],
      });

      // Agregar a colección
      const collectionRes = await request(app)
        .post(`/usercards/${user.username}/collection`)
        .send({
          cardId: card._id.toString(),
          pokemonTcgId: card.pokemonTcgId,
          notes: 'En mi colección',
        })
        .expect(201);

      expect(collectionRes.body.collectionType).toBe('collection');

      // Agregar misma carta a wishlist
      const wishlistRes = await request(app)
        .post(`/usercards/${user.username}/wishlist`)
        .send({
          cardId: card._id.toString(),
          pokemonTcgId: card.pokemonTcgId,
          notes: 'Deseo tenerla',
        })
        .expect(201);

      expect(wishlistRes.body.collectionType).toBe('wishlist');

      // Verificar que hay dos registros diferentes
      const collectionCheck = await request(app)
        .get(`/usercards/${user.username}/collection`)
        .expect(200);

      const wishlistCheck = await request(app)
        .get(`/usercards/${user.username}/wishlist`)
        .expect(200);

      expect(collectionCheck.body.cards.length).toBe(1);
      expect(wishlistCheck.body.cards.length).toBe(1);
    });

    /**
     * Test: Filtrar por tipo de colección
     * Verifica que se pueden recuperar cartas separadamente por tipo (collection o wishlist)
     */
    it('debe permitir filtrar por tipo de colección', async () => {
      const user = await User.create({
        username: 'sorter',
        email: 'sorter@example.com',
        password: 'pass123',
      });

      const card1 = await Card.create({
        pokemonTcgId: 'advanced-2',
        name: 'Card 1',
        imageUrl: 'https://example.com/card1.jpg',
        marketPrice: 50,
        types: ['Water'],
      });

      const card2 = await Card.create({
        pokemonTcgId: 'advanced-3',
        name: 'Card 2',
        imageUrl: 'https://example.com/card2.jpg',
        marketPrice: 75,
        types: ['Grass'],
      });

      // Agregar a colección
      await request(app)
        .post(`/usercards/${user.username}/collection`)
        .send({
          cardId: card1._id.toString(),
          pokemonTcgId: card1.pokemonTcgId,
        })
        .expect(201);

      // Agregar a wishlist
      await request(app)
        .post(`/usercards/${user.username}/wishlist`)
        .send({
          cardId: card2._id.toString(),
          pokemonTcgId: card2.pokemonTcgId,
        })
        .expect(201);

      // Verificar que GET /usercards/:username/:type funciona
      const typeRes = await request(app)
        .get(`/usercards/${user.username}/collection`)
        .expect(200);

      expect(typeRes.body.cards.length).toBe(1);
      expect(typeRes.body.cards[0].collectionType).toBe('collection');
    });
  });

  describe('Notes and Metadata', () => {
    /**
     * Test: Guardar y recuperar notas
     * Verifica que se pueden agregar notas personalizadas a las cartas y recuperarlas
     */
    it('debe guardar y recuperar notas de tarjetas', async () => {
      const user = await User.create({
        username: 'noter',
        email: 'noter@example.com',
        password: 'pass123',
      });

      const card = await Card.create({
        pokemonTcgId: 'advanced-4',
        name: 'Noted Card',
        imageUrl: 'https://example.com/card.jpg',
        marketPrice: 100,
        types: ['Fire'],
      });

      const notes = 'Esta es una nota importante sobre mi tarjeta';

      const res = await request(app)
        .post(`/usercards/${user.username}/collection`)
        .send({
          cardId: card._id.toString(),
          pokemonTcgId: card.pokemonTcgId,
          notes,
        })
        .expect(201);

      expect(res.body.notes).toBe(notes);

      // Verificar que la nota se recupera correctamente
      const getRes = await request(app)
        .get(`/usercards/${user.username}`)
        .expect(200);

      expect(getRes.body.cards[0].notes).toBe(notes);
    });

    /**
     * Test: Actualizar notas de tarjetas
     * Verifica que se pueden modificar las notas existentes de una tarjeta
     */
    it('debe permitir actualizar notas de tarjetas', async () => {
      const user = await User.create({
        username: 'updater',
        email: 'updater@example.com',
        password: 'pass123',
      });

      const card = await Card.create({
        pokemonTcgId: 'advanced-5',
        name: 'Update Card',
        imageUrl: 'https://example.com/card.jpg',
        marketPrice: 100,
        types: ['Grass'],
      });

      const addRes = await request(app)
        .post(`/usercards/${user.username}/collection`)
        .send({
          cardId: card._id.toString(),
          pokemonTcgId: card.pokemonTcgId,
          notes: 'Nota original',
        })
        .expect(201);

      const cardId = addRes.body._id;

      // Actualizar notas
      const updateRes = await request(app)
        .patch(`/usercards/${user.username}/cards/${cardId}`)
        .send({ notes: 'Nota actualizada' })
        .expect(200);

      expect(updateRes.body.notes).toBe('Nota actualizada');
    });
  });

  describe('Card Deletion and Management', () => {
    /**
     * Test: Eliminar tarjeta de la colección
     * Verifica que se puede eliminar una tarjeta específica de la colección del usuario
     */
    it('debe permitir eliminar una tarjeta de la colección', async () => {
      const user = await User.create({
        username: 'deleter',
        email: 'deleter@example.com',
        password: 'pass123',
      });

      const card = await Card.create({
        pokemonTcgId: 'advanced-6',
        name: 'Delete Card',
        imageUrl: 'https://example.com/card.jpg',
        marketPrice: 100,
        types: ['Electric'],
      });

      const addRes = await request(app)
        .post(`/usercards/${user.username}/collection`)
        .send({
          cardId: card._id.toString(),
          pokemonTcgId: card.pokemonTcgId,
        })
        .expect(201);

      const cardId = addRes.body._id;

      // Verificar que está agregada
      let getRes = await request(app)
        .get(`/usercards/${user.username}`)
        .expect(200);
      expect(getRes.body.cards.length).toBe(1);

      // Eliminar tarjeta
      await request(app)
        .delete(`/usercards/${user.username}/cards/${cardId}`)
        .expect(200);

      // Verificar que fue eliminada
      getRes = await request(app)
        .get(`/usercards/${user.username}`)
        .expect(200);
      expect(getRes.body.cards.length).toBe(0);
    });

    /**
     * Test: Cambiar tarjeta entre colección y wishlist
     * Verifica que se puede transferir una tarjeta de la colección a la wishlist (o viceversa)
     */
    it('debe permitir cambiar tarjeta entre colección y wishlist', async () => {
      const user = await User.create({
        username: 'switcher',
        email: 'switcher@example.com',
        password: 'pass123',
      });

      const card = await Card.create({
        pokemonTcgId: 'advanced-7',
        name: 'Switch Card',
        imageUrl: 'https://example.com/card.jpg',
        marketPrice: 100,
        types: ['Water'],
      });

      // Agregar a colección
      const addRes = await request(app)
        .post(`/usercards/${user.username}/collection`)
        .send({
          cardId: card._id.toString(),
          pokemonTcgId: card.pokemonTcgId,
        })
        .expect(201);

      const cardId = addRes.body._id;

      // Cambiar a wishlist
      const updateRes = await request(app)
        .patch(`/usercards/${user.username}/cards/${cardId}`)
        .send({ collectionType: 'wishlist' })
        .expect(200);

      expect(updateRes.body.collectionType).toBe('wishlist');

      // Verificar cambio
      const typeRes = await request(app)
        .get(`/usercards/${user.username}/wishlist`)
        .expect(200);

      expect(typeRes.body.cards.length).toBe(1);
    });
  });

  describe('Bulk Operations', () => {
    /**
     * Test: Agregar múltiples tarjetas de forma rápida
     * Verifica que se pueden agregar varias tarjetas a la colección consecutivamente
     */
    it('debe permitir agregar múltiples tarjetas de forma rápida', async () => {
      const user = await User.create({
        username: 'bulker',
        email: 'bulker@example.com',
        password: 'pass123',
      });

      const cards = await Card.insertMany([
        {
          pokemonTcgId: 'advanced-8',
          name: 'Bulk Card 1',
          imageUrl: 'https://example.com/card1.jpg',
          marketPrice: 50,
          types: ['Fire'],
        },
        {
          pokemonTcgId: 'advanced-9',
          name: 'Bulk Card 2',
          imageUrl: 'https://example.com/card2.jpg',
          marketPrice: 75,
          types: ['Water'],
        },
        {
          pokemonTcgId: 'advanced-10',
          name: 'Bulk Card 3',
          imageUrl: 'https://example.com/card3.jpg',
          marketPrice: 100,
          types: ['Grass'],
        },
      ]);

      // Agregar cada tarjeta
      for (const card of cards) {
        await request(app)
          .post(`/usercards/${user.username}/collection`)
          .send({
            cardId: card._id.toString(),
            pokemonTcgId: card.pokemonTcgId,
          })
          .expect(201);
      }

      // Verificar que todas fueron agregadas
      const getRes = await request(app)
        .get(`/usercards/${user.username}`)
        .expect(200);

      expect(getRes.body.cards.length).toBe(3);
    });

    /**
     * Test: Paginación de colección
     * Verifica que la colección se puede paginar correctamente con parámetros limit y page
     */
    it('debe mostrar la colección paginada', async () => {
      const user = await User.create({
        username: 'paginator',
        email: 'paginator@example.com',
        password: 'pass123',
      });

      const cards = await Card.insertMany(
        Array.from({ length: 5 }, (_, i) => ({
          pokemonTcgId: `advanced-${11 + i}`,
          name: `Pagination Card ${i + 1}`,
          imageUrl: `https://example.com/card${i}.jpg`,
          marketPrice: 50 + i * 10,
          types: ['Fire'],
        }))
      );

      // Agregar todas las tarjetas
      for (const card of cards) {
        await request(app)
          .post(`/usercards/${user.username}/collection`)
          .send({
            cardId: card._id.toString(),
            pokemonTcgId: card.pokemonTcgId,
          })
          .expect(201);
      }

      // Obtener página 1 con límite 2
      const page1 = await request(app)
        .get(`/usercards/${user.username}?page=1&limit=2`)
        .expect(200);

      expect(page1.body.cards.length).toBe(2);
      expect(page1.body.page).toBe(1);

      // Obtener página 2
      const page2 = await request(app)
        .get(`/usercards/${user.username}?page=2&limit=2`)
        .expect(200);

      expect(page2.body.cards.length).toBe(2);
      expect(page2.body.page).toBe(2);
    });
  });

  describe('Error Handling', () => {
    /**
     * Test: Usuario no encontrado
     * Verifica que retorna 404 cuando se intenta acceder a cartas de un usuario inexistente
     */
    it('debe retornar 404 cuando el usuario no existe', async () => {
      const res = await request(app)
        .get('/usercards/nonexistent')
        .expect(404);

      expect(res.body.error).toContain('Usuario no encontrado');
    });

    /**
     * Test: Agregar carta sin validación
     * Verifica que el endpoint permite agregar cartas incluso sin validar que existen en la BD
     * (comportamiento por diseño para mayor flexibilidad)
     */
    it('debe permitir agregar carta incluso sin validar existencia en BD', async () => {
      const user = await User.create({
        username: 'errortest',
        email: 'errortest@example.com',
        password: 'pass123',
      });

      // El endpoint permite agregar sin validar que la tarjeta existe
      const res = await request(app)
        .post(`/usercards/${user.username}/collection`)
        .send({
          cardId: new mongoose.Types.ObjectId().toString(),
          pokemonTcgId: 'nonexistent',
        })
        .expect(201);

      expect(res.body.pokemonTcgId).toBe('nonexistent');
    });

    /**
     * Test: Actualizar tarjeta inexistente
     * Verifica que retorna 404 al intentar actualizar una tarjeta que no existe en la colección
     */
    it('debe retornar 404 al intentar actualizar una tarjeta que no existe', async () => {
      const user = await User.create({
        username: 'errortest2',
        email: 'errortest2@example.com',
        password: 'pass123',
      });

      const res = await request(app)
        .patch(`/usercards/${user.username}/cards/${new mongoose.Types.ObjectId()}`)
        .send({ notes: 'updated' })
        .expect(404);

      expect(res.body.error).toContain('Carta no encontrada');
    });
  });
});
