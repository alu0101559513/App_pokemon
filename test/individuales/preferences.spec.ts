import { describe, it, beforeEach, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { app } from "../../src/server/api.js";
import { User } from "../../src/server/models/User.js";

/**
 * Tests para el sistema de preferencias de usuario
 * Verifica que las preferencias de lenguaje, modo oscuro, notificaciones y privacidad funcionan correctamente
 */

beforeEach(async () => {
  await User.deleteMany();
});

describe("GET /users/:userId/preferences", () => {
  /**
   * Test: Obtener preferencias del usuario
   * Verifica que se pueden recuperar todas las preferencias configuradas para un usuario
   */
  it("devuelve las preferencias del usuario", async () => {
    const user = await User.create({
      username: "pepe",
      email: "pepe@example.com",
      password: "pikachu123",
    });

    const res = await request(app)
      .get(`/users/${user._id}/preferences`)
      .expect(200);

    expect(res.body).toHaveProperty("language");
    expect(res.body).toHaveProperty("darkMode");
    expect(res.body).toHaveProperty("notifications");
    expect(res.body).toHaveProperty("privacy");
  });

  /**
   * Test: Valores por defecto de preferencias
   * Verifica que si un usuario no ha establecido preferencias, obtiene los valores por defecto
   * (idioma 'es', darkMode false, etc.)
   */
  it("devuelve valores por defecto si no existen", async () => {
    const user = await User.create({
      username: "pepa",
      email: "pepa@example.com",
      password: "pikachu123",
    });

    const res = await request(app)
      .get(`/users/${user._id}/preferences`)
      .expect(200);

    expect(res.body.language).toBe("es");
    expect(res.body.darkMode).toBe(false);
  });

  /**
   * Test: ID de usuario inválido
   * Verifica que retorna error 400 cuando el ID del usuario no es un ObjectId válido
   */
  it("devuelve 400 si el ID es inválido", async () => {
    const res = await request(app)
      .get(`/users/invalid-id/preferences`)
      .expect(400);

    expect(res.body.error).toContain("inválido");
  });

  /**
   * Test: Usuario no encontrado
   * Verifica que retorna 404 cuando se intenta obtener preferencias de un usuario inexistente
   */
  it("devuelve 404 si el usuario no existe", async () => {
    const res = await request(app)
      .get(`/users/${new mongoose.Types.ObjectId()}/preferences`)
      .expect(404);

    expect(res.body.error).toBe("Usuario no encontrado");
  });
});

describe("PATCH /users/:userId/preferences", () => {
  /**
   * Test: Actualizar idioma
   * Verifica que se puede cambiar el idioma de preferencia del usuario (ej: de 'es' a 'en')
   */
  it("actualiza el idioma correctamente", async () => {
    const user = await User.create({
      username: "pepe",
      email: "pepe@example.com",
      password: "pikachu123",
    });

    const res = await request(app)
      .patch(`/users/${user._id}/preferences`)
      .send({ language: "en" })
      .expect(200);

    expect(res.body.preferences.language).toBe("en");
  });

  /**
   * Test: Actualizar modo oscuro
   * Verifica que se puede cambiar la preferencia de modo oscuro (true/false)
   */
  it("actualiza darkMode correctamente", async () => {
    const user = await User.create({
      username: "pepe",
      email: "pepe@example.com",
      password: "pikachu123",
    });

    const res = await request(app)
      .patch(`/users/${user._id}/preferences`)
      .send({ darkMode: true })
      .expect(200);

    expect(res.body.preferences.darkMode).toBe(true);
  });

  /**
   * Test: Actualizar preferencias de notificaciones
   * Verifica que se pueden cambiar las preferencias de qué notificaciones recibir
   * (notificaciones de intercambios, mensajes, etc.)
   */
  it("actualiza notificaciones correctamente", async () => {
    const user = await User.create({
      username: "pepe",
      email: "pepe@example.com",
      password: "pikachu123",
    });

    const res = await request(app)
      .patch(`/users/${user._id}/preferences`)
      .send({ notifications: { trades: false, messages: true } })
      .expect(200);

    expect(res.body.message).toContain("actualizadas");
  });

  /**
   * Test: Idioma inválido
   * Verifica que retorna error 400 cuando se intenta establecer un idioma no soportado
   */
  it("rechaza idioma inválido", async () => {
    const user = await User.create({
      username: "pepe",
      email: "pepe@example.com",
      password: "pikachu123",
    });

    const res = await request(app)
      .patch(`/users/${user._id}/preferences`)
      .send({ language: "invalid" })
      .expect(400);

    expect(res.body.error).toContain("inválido");
  });

  /**
   * Test: ID de usuario inválido para PATCH
   * Verifica que retorna error 400 cuando se intenta actualizar preferencias con un ID inválido
   */
  it("devuelve 400 si el ID es inválido", async () => {
    const res = await request(app)
      .patch(`/users/invalid-id/preferences`)
      .send({ language: "en" })
      .expect(400);

    expect(res.body.error).toContain("inválido");
  });

  /**
   * Test: Usuario no encontrado para PATCH
   * Verifica que retorna 404 cuando se intenta actualizar preferencias de un usuario inexistente
   */
  it("devuelve 404 si el usuario no existe", async () => {
    const res = await request(app)
      .patch(`/users/${new mongoose.Types.ObjectId()}/preferences`)
      .send({ language: "en" })
      .expect(404);

    expect(res.body.error).toBe("Usuario no encontrado");
  });
});
