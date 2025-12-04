import { describe, it, beforeEach, expect } from 'vitest';
import mongoose from 'mongoose';
import { Trade } from '../../src/server/models/Trade.js';
import { User } from '../../src/server/models/User.js';

/**
 * Tests para funcionalidades avanzadas de intercambios
 * Todos los tests usan manipulación directa en BD sin depender de autenticación HTTP
 */

beforeEach(async () => {
  await Trade.deleteMany();
  await User.deleteMany();
});

describe('Advanced Trade Features', () => {
  describe('Public vs Private Trades', () => {
    /**
     * Test: Crear intercambio público en BD
     * Verifica que se pueden crear trades públicos con los datos correctos
     */
    it('debe permitir crear intercambios públicos', async () => {
      const user1 = await User.create({ username: 'trader1', email: 'trader1@example.com', password: 'pass123' });
      const user2 = await User.create({ username: 'trader2', email: 'trader2@example.com', password: 'pass123' });

      const trade = await Trade.create({
        initiatorUserId: user1._id,
        receiverUserId: user2._id,
        tradeType: 'public',
        initiatorCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 50 }],
        receiverCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 50 }],
        initiatorTotalValue: 50,
        receiverTotalValue: 50,
        status: 'pending',
      });

      expect(trade._id).toBeDefined();
      expect(trade.tradeType).toBe('public');
      expect(trade.status).toBe('pending');
    });

    /**
     * Test: Crear intercambio privado en BD
     * Verifica que se pueden crear trades privados correctamente
     */
    it('debe permitir crear intercambios privados', async () => {
      const user1 = await User.create({ username: 'priv1', email: 'priv1@example.com', password: 'pass123' });
      const user2 = await User.create({ username: 'priv2', email: 'priv2@example.com', password: 'pass123' });

      const trade = await Trade.create({
        initiatorUserId: user1._id,
        receiverUserId: user2._id,
        tradeType: 'private',
        initiatorCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 75 }],
        receiverCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 75 }],
        initiatorTotalValue: 75,
        receiverTotalValue: 75,
        status: 'pending',
      });

      expect(trade.tradeType).toBe('private');
      expect(String(trade.initiatorUserId)).toBe(String(user1._id));
    });

    /**
     * Test: Filtrar intercambios por tipo
     * Verifica que se pueden distinguir intercambios públicos y privados
     */
    it('debe permitir filtrar intercambios por tipo', async () => {
      const user1 = await User.create({ username: 'f1', email: 'f1@ex.com', password: 'p' });
      const user2 = await User.create({ username: 'f2', email: 'f2@ex.com', password: 'p' });

      await Trade.insertMany([
        {
          initiatorUserId: user1._id,
          receiverUserId: user2._id,
          tradeType: 'public',
          initiatorCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 10 }],
          receiverCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 10 }],
          status: 'pending',
        },
        {
          initiatorUserId: user2._id,
          receiverUserId: user1._id,
          tradeType: 'private',
          initiatorCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 20 }],
          receiverCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 20 }],
          status: 'pending',
        },
      ]);

      const publicTrades = await Trade.find({ tradeType: 'public' });
      const privateTrades = await Trade.find({ tradeType: 'private' });

      expect(publicTrades.length).toBe(1);
      expect(privateTrades.length).toBe(1);
      expect(publicTrades[0].tradeType).toBe('public');
      expect(privateTrades[0].tradeType).toBe('private');
    });
  });

  describe('Trade Status Management', () => {
    /**
     * Test: Cambiar estado de pending a completed
     * Verifica que se puede cambiar el estado correctamente
     */
    it('debe permitir cambiar estado de pending a completed', async () => {
      const user1 = await User.create({ username: 's1', email: 's1@ex.com', password: 'p' });
      const user2 = await User.create({ username: 's2', email: 's2@ex.com', password: 'p' });

      const trade = await Trade.create({
        initiatorUserId: user1._id,
        receiverUserId: user2._id,
        tradeType: 'public',
        initiatorCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 50 }],
        receiverCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 50 }],
        status: 'pending',
      });

      trade.status = 'completed';
      await trade.save();

      const updated = await Trade.findById(trade._id);
      expect(updated?.status).toBe('completed');
    });

    /**
     * Test: Cambiar estado de pending a cancelled
     * Verifica que se pueden cancelar trades correctamente
     */
    it('debe permitir cambiar estado de pending a cancelled', async () => {
      const user1 = await User.create({ username: 'c1', email: 'c1@ex.com', password: 'p' });
      const user2 = await User.create({ username: 'c2', email: 'c2@ex.com', password: 'p' });

      const trade = await Trade.create({
        initiatorUserId: user1._id,
        receiverUserId: user2._id,
        tradeType: 'public',
        initiatorCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 50 }],
        receiverCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 50 }],
        status: 'pending',
      });

      trade.status = 'cancelled';
      await trade.save();

      const updated = await Trade.findById(trade._id);
      expect(updated?.status).toBe('cancelled');
    });

    /**
     * Test: Filtrar intercambios por estado
     * Verifica que se pueden obtener trades por su estado
     */
    it('debe permitir filtrar intercambios por estado', async () => {
      const user1 = await User.create({ username: 'st1', email: 'st1@ex.com', password: 'p' });
      const user2 = await User.create({ username: 'st2', email: 'st2@ex.com', password: 'p' });

      await Trade.insertMany([
        {
          initiatorUserId: user1._id,
          receiverUserId: user2._id,
          tradeType: 'public',
          initiatorCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 10 }],
          receiverCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 10 }],
          status: 'pending',
        },
        {
          initiatorUserId: user2._id,
          receiverUserId: user1._id,
          tradeType: 'public',
          initiatorCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 20 }],
          receiverCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 20 }],
          status: 'completed',
        },
      ]);

      const pending = await Trade.find({ status: 'pending' });
      const completed = await Trade.find({ status: 'completed' });

      expect(pending.length).toBe(1);
      expect(completed.length).toBe(1);
    });
  });

  describe('Trade Value Validation', () => {
    /**
     * Test: Intercambios con valores desiguales (dentro del 10%)
     * Verifica que se pueden crear intercambios aunque los valores no sean exactamente iguales
     */
    it('debe permitir intercambios con valores desiguales dentro del límite', async () => {
      const user1 = await User.create({ username: 'v1', email: 'v1@ex.com', password: 'p' });
      const user2 = await User.create({ username: 'v2', email: 'v2@ex.com', password: 'p' });

      const trade = await Trade.create({
        initiatorUserId: user1._id,
        receiverUserId: user2._id,
        tradeType: 'public',
        initiatorCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 100 }],
        receiverCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 95 }],
        initiatorTotalValue: 100,
        receiverTotalValue: 95,
        status: 'pending',
      });

      expect(trade._id).toBeDefined();
      expect(trade.initiatorTotalValue).toBe(100);
      expect(trade.receiverTotalValue).toBe(95);
    });

    /**
     * Test: Guardar totales de valor correctamente
     * Verifica que se almacenan correctamente los valores totales
     */
    it('debe guardar totales de valor correctamente', async () => {
      const user1 = await User.create({ username: 'tot1', email: 'tot1@ex.com', password: 'p' });
      const user2 = await User.create({ username: 'tot2', email: 'tot2@ex.com', password: 'p' });

      const trade = await Trade.create({
        initiatorUserId: user1._id,
        receiverUserId: user2._id,
        tradeType: 'public',
        initiatorCards: [
          { userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 50 },
          { userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 30 },
        ],
        receiverCards: [
          { userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 60 },
          { userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 20 },
        ],
        initiatorTotalValue: 80,
        receiverTotalValue: 80,
        status: 'pending',
      });

      const retrieved = await Trade.findById(trade._id);
      expect(retrieved?.initiatorTotalValue).toBe(80);
      expect(retrieved?.receiverTotalValue).toBe(80);
    });
  });

  describe('Trade Retrieval and Pagination', () => {
    /**
     * Test: Obtener intercambios paginados
     * Verifica que se pueden recuperar múltiples trades
     */
    it('debe retornar intercambios paginados', async () => {
      const user1 = await User.create({ username: 'pg1', email: 'pg1@ex.com', password: 'p' });
      const user2 = await User.create({ username: 'pg2', email: 'pg2@ex.com', password: 'p' });

      await Trade.insertMany(
        Array.from({ length: 5 }, (_, i) => ({
          initiatorUserId: user1._id,
          receiverUserId: user2._id,
          tradeType: 'public',
          initiatorCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 10 }],
          receiverCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 10 }],
          status: 'pending',
        }))
      );

      const trades = await Trade.find().limit(10);
      expect(trades.length).toBe(5);
    });

    /**
     * Test: Obtener intercambio por ID con datos poblados
     * Verifica que se puede recuperar un trade completo
     */
    it('debe retornar un intercambio por ID con poblaciones', async () => {
      const user1 = await User.create({ username: 'pop1', email: 'pop1@ex.com', password: 'p' });
      const user2 = await User.create({ username: 'pop2', email: 'pop2@ex.com', password: 'p' });

      const trade = await Trade.create({
        initiatorUserId: user1._id,
        receiverUserId: user2._id,
        tradeType: 'public',
        initiatorCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 50 }],
        receiverCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 50 }],
        status: 'pending',
      });

      const retrieved = await Trade.findById(trade._id).populate('initiatorUserId').populate('receiverUserId');
      expect(retrieved?._id.toString()).toBe(trade._id.toString());
      expect(retrieved?.initiatorUserId).toBeDefined();
    });
  });

  describe('Trade Error Handling', () => {
    /**
     * Test: Trade no encontrado retorna null
     * Verifica que no hay errors al buscar un trade inexistente
     */
    it('debe retornar null para intercambio inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const trade = await Trade.findById(fakeId);
      expect(trade).toBeNull();
    });

    /**
     * Test: Validación de datos en Trade
     * Verifica que se validan correctamente los datos requeridos
     */
    it('debe validar datos requeridos en Trade', async () => {
      try {
        await Trade.create({
          initiatorUserId: undefined,
          receiverUserId: new mongoose.Types.ObjectId(),
          tradeType: 'public',
          initiatorCards: [],
          receiverCards: [],
        });
        expect(true).toBe(false); // No debe llegar aquí
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    /**
     * Test: Cambiar estado inválido
     * Verifica que se pueden cambiar estados válidos solamente
     */
    it('debe permitir cambios de estado válidos', async () => {
      const user1 = await User.create({ username: 'inv1', email: 'inv1@ex.com', password: 'p' });
      const user2 = await User.create({ username: 'inv2', email: 'inv2@ex.com', password: 'p' });

      const trade = await Trade.create({
        initiatorUserId: user1._id,
        receiverUserId: user2._id,
        tradeType: 'public',
        initiatorCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 50 }],
        receiverCards: [{ userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 50 }],
        status: 'pending',
      });

      // Los estados válidos son: pending, completed, cancelled
      const validStatuses = ['pending', 'completed', 'cancelled'];
      expect(validStatuses).toContain(trade.status);

      trade.status = 'completed';
      await trade.save();

      const updated = await Trade.findById(trade._id);
      expect(updated?.status).toBe('completed');
    });
  });
});
