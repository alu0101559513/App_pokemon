import { describe, it, beforeEach, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/server/api.js";
import { User }from "../../src/server/models/User.js";
import { UserCard }from "../../src/server/models/UserCard.js";
import mongoose from "mongoose";

/**
 * Tests para la API de cartas de usuario
 * Verifica que los usuarios pueden agregar, listar, actualizar y eliminar cartas en sus colecciones
 */

const baseUser = {
  username: "pepe",
  email: "pepe@example.com",
  password: "pikachu123",
};

beforeEach(async () => {
  await User.deleteMany();
  await UserCard.deleteMany();
});

/**
 * Test comentado: Importar cartas en lote
 * Este endpoint está comentado porque el sistema actual no soporta importación masiva
 * Será implementado en futuras versiones
 */
// describe("POST /usercards/import", () => {
//   it("importa cartas correctamente", async () => {
//     const res = await request(app)
//       .post("/usercards/import")
//       .send({
//         cards: [
//           {
//             pokemonTcgId: "base1-1",
//             collectionType: "collection",
//           },
//         ],
//       })
//       .expect(201);
//
//     expect(res.body).toHaveProperty("message");
//   });
// });

describe("POST /usercards/:username/:type", () => {
  /**
   * Test: Agregar carta a la colección
   * Verifica que se puede agregar una carta a la colección de un usuario existente
   */
  it("crea una carta en la colección de un usuario válido", async () => {
    const user = await User.create(baseUser);

    const res = await request(app)
      .post(`/usercards/${user.username}/collection`)
      .send({
        cardId: new mongoose.Types.ObjectId().toString(),
        pokemonTcgId: "xy7-54",
        notes: "Mi carta favorita",
      })
      .expect(201);

    expect(res.body.collectionType).toBe("collection");
    expect(res.body.userId).toBe(String(user._id));
  });

  /**
   * Test: Tipo de colección inválido
   * Verifica que el endpoint rechaza tipos de colección que no son válidos
   * Los tipos válidos son "collection" y "wishlist"
   */
  it("rechaza tipo inválido", async () => {
    const user = await User.create(baseUser);

    const res = await request(app)
      .post(`/usercards/${user.username}/invalid`)
      .send({
        cardId: new mongoose.Types.ObjectId().toString(),
        pokemonTcgId: "xy7-54",
      })
      .expect(400);

    expect(res.body.error).toContain("inválido");
  });

  /**
   * Test: Usuario no encontrado
   * Verifica que retorna 404 cuando se intenta agregar una carta a un usuario inexistente
   */
  it("devuelve 404 si el usuario no existe", async () => {
    const res = await request(app)
      .post(`/usercards/nonexistent/collection`)
      .send({
        cardId: new mongoose.Types.ObjectId().toString(),
        pokemonTcgId: "xy7-54",
      })
      .expect(404);

    expect(res.body.error).toBe("Usuario no encontrado");
  });
});

describe("GET /usercards/:username", () => {
  /**
   * Test: Obtener todas las cartas del usuario
   * Verifica que se pueden recuperar todas las cartas (collection y wishlist) de un usuario
   */
  it("devuelve todas las cartas de un usuario", async () => {
    const user = await User.create(baseUser);

    await UserCard.insertMany([
      {
        userId: user._id,
        cardId: new mongoose.Types.ObjectId(),
        pokemonTcgId: "base1-1",
        collectionType: "collection",
      },
      {
        userId: user._id,
        cardId: new mongoose.Types.ObjectId(),
        pokemonTcgId: "base1-2",
        collectionType: "wishlist",
      },
    ]);

    const res = await request(app)
      .get(`/usercards/${user.username}`)
      .expect(200);
    expect(Array.isArray(res.body.cards)).toBe(true);
    expect(res.body.cards.length).toBe(2);
    expect(res.body.totalResults).toBe(2);
  });

  /**
   * Test: Paginación de cartas
   * Verifica que la lista de cartas se pagina correctamente usando parámetros page y limit
   */
  it("devuelve cartas paginadas correctamente", async () => {
    const user = await User.create(baseUser);

    await UserCard.insertMany(
      Array.from({ length: 5 }, (_, i) => ({
        userId: user._id,
        cardId: new mongoose.Types.ObjectId(),
        pokemonTcgId: `base1-${i}`,
        collectionType: "collection",
      }))
    );

    const res = await request(app)
      .get(`/usercards/${user.username}?page=1&limit=2`)
      .expect(200);

    expect(res.body.cards.length).toBe(2);
    expect(res.body.totalResults).toBe(5);
  });

  /**
   * Test: Usuario no encontrado para GET
   * Verifica que retorna 404 cuando se intenta obtener cartas de un usuario inexistente
   */
  it("devuelve 404 si el usuario no existe", async () => {
    const res = await request(app).get(`/usercards/fakeuser`).expect(404);
    expect(res.body.error).toBe("Usuario no encontrado");
  });
});

describe("GET /usercards/:username/:type", () => {
  /**
   * Test: Obtener cartas por tipo - colección
   * Verifica que se pueden filtrar cartas por tipo, obteniendo solo las de colección
   */
  it("devuelve solo las cartas del tipo indicado", async () => {
    const user = await User.create(baseUser);

    await UserCard.insertMany([
      {
        userId: user._id,
        cardId: new mongoose.Types.ObjectId(),
        pokemonTcgId: "base1-1",
        collectionType: "collection",
      },
      {
        userId: user._id,
        cardId: new mongoose.Types.ObjectId(),
        pokemonTcgId: "base1-2",
        collectionType: "wishlist",
      },
    ]);

    const res = await request(app)
      .get(`/usercards/${user.username}/collection`)
      .expect(200);

    expect(res.body.cards.length).toBe(1);
    expect(res.body.cards[0].collectionType).toBe("collection");
  });

  /**
   * Test: Obtener cartas por tipo - wishlist
   * Verifica que se pueden obtener solo las cartas de la wishlist del usuario
   */
  it("devuelve solo cartas de wishlist", async () => {
    const user = await User.create(baseUser);

    await UserCard.insertMany([
      {
        userId: user._id,
        cardId: new mongoose.Types.ObjectId(),
        pokemonTcgId: "base1-1",
        collectionType: "collection",
      },
      {
        userId: user._id,
        cardId: new mongoose.Types.ObjectId(),
        pokemonTcgId: "base1-2",
        collectionType: "wishlist",
      },
    ]);

    const res = await request(app)
      .get(`/usercards/${user.username}/wishlist`)
      .expect(200);

    expect(res.body.cards.length).toBe(1);
    expect(res.body.cards[0].collectionType).toBe("wishlist");
  });

  /**
   * Test: Tipo de colección inválido en filtro
   * Verifica que retorna 400 cuando se intenta filtrar por un tipo no válido
   */
  it("devuelve 400 si el tipo es inválido", async () => {
    const user = await User.create(baseUser);
    const res = await request(app)
      .get(`/usercards/${user.username}/invalid`)
      .expect(400);
    expect(res.body.error).toBe("Tipo inválido");
  });

  /**
   * Test: Usuario no encontrado con filtro de tipo
   * Verifica que retorna 404 cuando se intenta filtrar cartas de un usuario inexistente
   */
  it("devuelve 404 si el usuario no existe", async () => {
    const res = await request(app)
      .get(`/usercards/nonexistent/collection`)
      .expect(404);
    expect(res.body.error).toBe("Usuario no encontrado");
  });
});

describe("PATCH /usercards/:username/cards/:userCardId", () => {
  /**
   * Test: Actualizar notas de la carta
   * Verifica que se pueden modificar las notas asociadas a una carta en la colección
   */
  it("actualiza una carta correctamente", async () => {
    const user = await User.create(baseUser);
    const card = await UserCard.create({
      userId: user._id,
      cardId: new mongoose.Types.ObjectId(),
      pokemonTcgId: "base1-3",
      collectionType: "collection",
      notes: "antigua",
    });

    const res = await request(app)
      .patch(`/usercards/${user.username}/cards/${card._id}`)
      .send({ notes: "actualizada" })
      .expect(200);

    expect(res.body.notes).toBe("actualizada");
  });

  /**
   * Test: Actualizar tipo de colección
   * Verifica que se puede cambiar una carta de colección a wishlist o viceversa
   */
  it("actualiza el tipo de colección", async () => {
    const user = await User.create(baseUser);
    const card = await UserCard.create({
      userId: user._id,
      cardId: new mongoose.Types.ObjectId(),
      pokemonTcgId: "base1-3",
      collectionType: "collection",
    });

    const res = await request(app)
      .patch(`/usercards/${user.username}/cards/${card._id}`)
      .send({ collectionType: "wishlist" })
      .expect(200);

    expect(res.body.collectionType).toBe("wishlist");
  });

  /**
   * Test: Usuario no encontrado para PATCH
   * Verifica que retorna 404 cuando se intenta actualizar una carta de un usuario inexistente
   */
  it("devuelve 404 si el usuario no existe", async () => {
    const res = await request(app)
      .patch(`/usercards/unknown/cards/${new mongoose.Types.ObjectId()}`)
      .send({ notes: "test" })
      .expect(404);
    expect(res.body.error).toBe("Usuario no encontrado");
  });

  /**
   * Test: Carta no encontrada para PATCH
   * Verifica que retorna 404 cuando se intenta actualizar una carta que no existe
   */
  it("devuelve 404 si la carta no existe", async () => {
    const user = await User.create(baseUser);
    const res = await request(app)
      .patch(`/usercards/${user.username}/cards/${new mongoose.Types.ObjectId()}`)
      .send({ notes: "test" })
      .expect(404);
    expect(res.body.error).toBe("Carta no encontrada");
  });
});

describe("DELETE /usercards/:username/cards/:userCardId", () => {
  /**
   * Test: Eliminar carta correctamente
   * Verifica que se puede eliminar una carta de la wishlist
   */
  it("elimina una carta correctamente", async () => {
    const user = await User.create(baseUser);
    const card = await UserCard.create({
      userId: user._id,
      cardId: new mongoose.Types.ObjectId(),
      pokemonTcgId: "base1-4",
      collectionType: "wishlist",
    });

    const res = await request(app)
      .delete(`/usercards/${user.username}/cards/${card._id}`)
      .expect(200);

    expect(res.body.message).toBe("Carta eliminada correctamente");

    const check = await UserCard.findById(card._id);
    expect(check).toBeNull();
  });

  /**
   * Test: Eliminar carta de colección
   * Verifica que se pueden eliminar cartas de la colección también
   */
  it("puede eliminar cartas de collection", async () => {
    const user = await User.create(baseUser);
    const card = await UserCard.create({
      userId: user._id,
      cardId: new mongoose.Types.ObjectId(),
      pokemonTcgId: "base1-5",
      collectionType: "collection",
    });

    const res = await request(app)
      .delete(`/usercards/${user.username}/cards/${card._id}`)
      .expect(200);

    expect(res.body.message).toBe("Carta eliminada correctamente");
  });

  /**
   * Test: Usuario no encontrado para DELETE
   * Verifica que retorna 404 cuando se intenta eliminar una carta de un usuario inexistente
   */
  it("devuelve 404 si el usuario no existe", async () => {
    const res = await request(app)
      .delete(`/usercards/fake/cards/${new mongoose.Types.ObjectId()}`)
      .expect(404);
    expect(res.body.error).toBe("Usuario no encontrado");
  });

  /**
   * Test: Carta no encontrada para DELETE
   * Verifica que retorna 404 cuando se intenta eliminar una carta que no existe en la colección
   */
  it("devuelve 404 si la carta no existe", async () => {
    const user = await User.create(baseUser);
    const res = await request(app)
      .delete(`/usercards/${user.username}/cards/${new mongoose.Types.ObjectId()}`)
      .expect(404);
    expect(res.body.error).toBe("Carta no encontrada");
  });
});