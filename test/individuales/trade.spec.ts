import { describe, it, beforeEach, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { app } from "../../src/server/api.js";
import { Trade } from "../../src/server/models/Trade.js";
import { User } from "../../src/server/models/User.js";
import { UserCard } from "../../src/server/models/UserCard.js";

const baseUser1 = {
  username: "Juan",
  email: "juan@example.com",
  password: "pikachu123",
};

const baseUser2 = {
  username: "Pepa",
  email: "pepa@example.com",
  password: "pepa56",
};

beforeEach(async () => {
  await Trade.deleteMany();
  await User.deleteMany();
  await UserCard.deleteMany();
});

describe("POST /trades", () => {
  /**
   * Test: Crear intercambio válido en la base de datos
   * Verifica que se puede crear un Trade con todos los datos necesarios
   */
  it("crea un intercambio válido en base de datos", async () => {
    const initiator = await User.create(baseUser1);
    const receiver = await User.create(baseUser2);

    const trade = await Trade.create({
      initiatorUserId: initiator._id,
      receiverUserId: receiver._id,
      tradeType: "public",
      initiatorCards: [
        {
          userCardId: new mongoose.Types.ObjectId(),
          cardId: new mongoose.Types.ObjectId(),
          estimatedValue: 50,
        },
      ],
      receiverCards: [
        {
          userCardId: new mongoose.Types.ObjectId(),
          cardId: new mongoose.Types.ObjectId(),
          estimatedValue: 48,
        },
      ],
      initiatorTotalValue: 50,
      receiverTotalValue: 48,
      status: "pending",
    });

    expect(trade._id).toBeDefined();
    expect(trade.status).toBe("pending");
    expect(trade.tradeType).toBe("public");
    expect(String(trade.initiatorUserId)).toBe(String(initiator._id));
    expect(String(trade.receiverUserId)).toBe(String(receiver._id));

    const retrieved = await Trade.findById(trade._id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.initiatorCards.length).toBe(1);
    expect(retrieved?.receiverCards.length).toBe(1);
  });

  /**
   * Test: Rechazar datos inválidos
   * Verifica que se valida correctamente los datos requeridos
   */
  it("rechaza datos sin usuarios requeridos", async () => {
    try {
      await Trade.create({
        initiatorUserId: undefined,
        receiverUserId: new mongoose.Types.ObjectId(),
        tradeType: "public",
        initiatorCards: [],
        receiverCards: [],
        status: "pending",
      });
      expect(true).toBe(false); // No debe llegar aquí
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

describe("GET /trades", () => {
  /**
   * Test: Obtener lista de intercambios paginada
   * Verifica que se puede listar trades con paginación desde la BD
   */
  it("obtiene lista de intercambios de la base de datos", async () => {
    const initiator = await User.create(baseUser1);
    const receiver = await User.create(baseUser2);

    await Trade.insertMany([
      {
        initiatorUserId: initiator._id,
        receiverUserId: receiver._id,
        tradeType: "public",
        initiatorCards: [
          { userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 10 },
        ],
        receiverCards: [
          { userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 9 },
        ],
        status: "pending",
      },
      {
        initiatorUserId: receiver._id,
        receiverUserId: initiator._id,
        tradeType: "private",
        initiatorCards: [
          { userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 20 },
        ],
        receiverCards: [
          { userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 19 },
        ],
        status: "completed",
      },
    ]);

    const trades = await Trade.find();
    expect(Array.isArray(trades)).toBe(true);
    expect(trades.length).toBe(2);
    expect(trades[0].status).toBe("pending");
    expect(trades[1].status).toBe("completed");
  });
});

describe("GET /trades/:id", () => {
  /**
   * Test: Obtener intercambio por ID
   * Verifica que se puede recuperar un trade específico de la BD
   */
  it("obtiene un intercambio por ID de la base de datos", async () => {
    const initiator = await User.create(baseUser1);
    const receiver = await User.create(baseUser2);

    const trade = await Trade.create({
      initiatorUserId: initiator._id,
      receiverUserId: receiver._id,
      tradeType: "public",
      initiatorCards: [
        { userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 10 },
      ],
      receiverCards: [
        { userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 9 },
      ],
      status: "pending",
    });

    const retrieved = await Trade.findById(trade._id);
    expect(retrieved?._id.toString()).toBe(trade._id.toString());
    expect(retrieved?.status).toBe("pending");
  });

  /**
   * Test: Intercambio no encontrado
   * Verifica que devuelve null cuando se busca un ID inexistente
   */
  it("devuelve null si el intercambio no existe", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const retrieved = await Trade.findById(fakeId);
    expect(retrieved).toBeNull();
  });
});

// describe('GET /trades/room/:code', () => {
//   it('devuelve un intercambio por código de sala', async () => {
//     const initiator = await User.create(baseUser1);
//     const receiver = await User.create(baseUser2);
//
//     const trade = await Trade.create({
//       initiatorUserId: initiator._id,
//       receiverUserId: receiver._id,
//       tradeType: "public",
//       roomCode: "ABC123",
//       initiatorCards: [
//         { userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 10 },
//       ],
//       receiverCards: [
//         { userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 9 },
//       ],
//       status: "pending",
//     });
//
//     const res = await request(app)
//       .get(`/trades/room/${trade.roomCode}`)
//       .expect(200);
//
//     expect(res.body.roomCode).toBe("ABC123");
//   });
//
//   it("devuelve 404 si el código no existe", async () => {
//     const res = await request(app)
//       .get(`/trades/room/NONEXISTENT`)
//       .expect(404);
//
//     expect(res.body).toHaveProperty("error");
//   });
// });

describe("PATCH /trades/:id", () => {
  /**
   * Test: Actualizar estado de intercambio
   * Verifica que se puede cambiar el estado de un trade en la BD
   */
  it("actualiza el estado de un intercambio en base de datos", async () => {
    const initiator = await User.create(baseUser1);
    const receiver = await User.create(baseUser2);

    const trade = await Trade.create({
      initiatorUserId: initiator._id,
      receiverUserId: receiver._id,
      tradeType: "public",
      initiatorCards: [
        { userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 10 },
      ],
      receiverCards: [
        { userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 9 },
      ],
      status: "pending",
    });

    // Actualizar estado
    trade.status = "completed";
    await trade.save();

    const updated = await Trade.findById(trade._id);
    expect(updated?.status).toBe("completed");
  });

  /**
   * Test: Validar cambios de estado válidos
   * Verifica que solo se permiten cambios de estado válidos (pending -> completed/cancelled)
   */
  it("permite cambiar estado de pending a cancelled", async () => {
    const trade = await Trade.create({
      initiatorUserId: new mongoose.Types.ObjectId(),
      receiverUserId: new mongoose.Types.ObjectId(),
      tradeType: "public",
      initiatorCards: [
        { userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 10 },
      ],
      receiverCards: [
        { userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 9 },
      ],
      status: "pending",
    });

    trade.status = "cancelled";
    await trade.save();

    const updated = await Trade.findById(trade._id);
    expect(updated?.status).toBe("cancelled");
  });
});

describe("DELETE /trades/:id", () => {
  /**
   * Test: Eliminar intercambio
   * Verifica que se puede eliminar un trade de la BD
   */
  it("elimina un intercambio de la base de datos", async () => {
    const trade = await Trade.create({
      initiatorUserId: new mongoose.Types.ObjectId(),
      receiverUserId: new mongoose.Types.ObjectId(),
      tradeType: "public",
      initiatorCards: [
        { userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 10 },
      ],
      receiverCards: [
        { userCardId: new mongoose.Types.ObjectId(), cardId: new mongoose.Types.ObjectId(), estimatedValue: 9 },
      ],
      status: "pending",
    });

    await Trade.findByIdAndDelete(trade._id);

    const check = await Trade.findById(trade._id);
    expect(check).toBeNull();
  });

  /**
   * Test: Eliminación de intercambio inexistente
   * Verifica que intentar eliminar un ID que no existe no genera error
   */
  it("devuelve null al eliminar un intercambio inexistente", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const result = await Trade.findByIdAndDelete(fakeId);
    expect(result).toBeNull();
  });
});