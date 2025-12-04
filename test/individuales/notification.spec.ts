import { describe, it, beforeEach, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { app } from "../../src/server/api.js";
import { Notification } from "../../src/server/models/Notification.js";
import { User } from "../../src/server/models/User.js";

/**
 * Tests para el sistema de notificaciones
 * Verifica que las notificaciones se crean, recuperan, marcan como leídas y se eliminan correctamente
 */

beforeEach(async () => {
  await Notification.deleteMany();
  await User.deleteMany();
});

describe("GET /notifications/:userId", () => {
  /**
   * Test: Obtener notificaciones paginadas del usuario
   * Verifica que se pueden recuperar todas las notificaciones de un usuario con paginación
   * y que incluye el conteo de notificaciones no leídas (unread)
   */
  it("devuelve todas las notificaciones del usuario paginadas", async () => {
    const user = await User.create({
      username: "pepe",
      email: "pepe@example.com",
      password: "pikachu123",
    });

    await Notification.insertMany([
      {
        userId: user._id,
        type: "trade",
        title: "Nuevo intercambio",
        message: "Alguien quiere intercambiar contigo",
        isRead: false,
      },
      {
        userId: user._id,
        type: "trade",
        title: "Solicitud de amistad",
        message: "Alguien te ha añadido como amigo",
        isRead: true,
      },
    ]);

    const res = await request(app)
      .get(`/notifications/${user._id}?limit=10&skip=0`)
      .expect(200);

    expect(Array.isArray(res.body.notifications)).toBe(true);
    expect(res.body.notifications.length).toBe(2);
    expect(res.body.total).toBe(2);
    expect(res.body.unread).toBe(1);
  });

  /**
   * Test: Sin notificaciones
   * Verifica que retorna un array vacío cuando el usuario no tiene notificaciones
   */
  it("devuelve [] si no hay notificaciones", async () => {
    const user = await User.create({
      username: "pepa",
      email: "pepa@example.com",
      password: "pikachu123",
    });

    const res = await request(app)
      .get(`/notifications/${user._id}`)
      .expect(200);

    expect(Array.isArray(res.body.notifications)).toBe(true);
    expect(res.body.notifications.length).toBe(0);
    expect(res.body.total).toBe(0);
  });

  /**
   * Test: ID de usuario inválido
   * Verifica que retorna error 400 cuando el ID del usuario no es un ObjectId válido
   */
  it("devuelve 400 si el ID es inválido", async () => {
    const res = await request(app)
      .get(`/notifications/invalid-id`)
      .expect(400);

    expect(res.body).toHaveProperty("error");
  });
});

describe("PATCH /notifications/:notificationId/read", () => {
  /**
   * Test: Marcar notificación como leída
   * Verifica que se puede cambiar el estado de una notificación de no leída a leída
   */
  it("marca una notificación como leída", async () => {
    const user = await User.create({
      username: "pepe",
      email: "pepe@example.com",
      password: "pikachu123",
    });

    const notification = await Notification.create({
      userId: user._id,
      type: "trade",
      title: "Nuevo intercambio",
      message: "Test",
      isRead: false,
    });

    const res = await request(app)
      .patch(`/notifications/${notification._id}/read`)
      .expect(200);

    expect(res.body.isRead).toBe(true);
  });

  /**
   * Test: Notificación no encontrada
   * Verifica que retorna 404 cuando se intenta marcar como leída una notificación que no existe
   */
  it("devuelve 404 si la notificación no existe", async () => {
    const res = await request(app)
      .patch(`/notifications/${new mongoose.Types.ObjectId()}/read`)
      .expect(404);

    expect(res.body.error).toBe("Notificación no encontrada");
  });

  /**
   * Test: ID de notificación inválido
   * Verifica que retorna error 400 cuando el ID de la notificación no es válido
   */
  it("devuelve 400 si el ID es inválido", async () => {
    const res = await request(app)
      .patch(`/notifications/invalid-id/read`)
      .expect(400);

    expect(res.body).toHaveProperty("error");
  });
});

describe("PATCH /notifications/:userId/read-all", () => {
  /**
   * Test: Marcar todas las notificaciones como leídas
   * Verifica que se pueden marcar todas las notificaciones de un usuario como leídas de una vez
   */
  it("marca todas las notificaciones como leídas", async () => {
    const user = await User.create({
      username: "pepe",
      email: "pepe@example.com",
      password: "pikachu123",
    });

    await Notification.insertMany([
      {
        userId: user._id,
        type: "trade",
        title: "Test 1",
        message: "Mensaje 1",
        isRead: false,
      },
      {
        userId: user._id,
        type: "trade",
        title: "Test 2",
        message: "Mensaje 2",
        isRead: false,
      },
    ]);

    const res = await request(app)
      .patch(`/notifications/${user._id}/read-all`)
      .expect(200);

    expect(res.body.message).toContain("marcadas como leídas");
    expect(res.body.modifiedCount).toBe(2);
  });

  /**
   * Test: ID de usuario inválido para read-all
   * Verifica que retorna error 400 cuando se intenta marcar como leídas las notificaciones con un ID inválido
   */
  it("devuelve 400 si el ID es inválido", async () => {
    const res = await request(app)
      .patch(`/notifications/invalid-id/read-all`)
      .expect(400);

    expect(res.body).toHaveProperty("error");
  });
});

describe("DELETE /notifications/:notificationId", () => {
  /**
   * Test: Eliminar notificación
   * Verifica que se puede eliminar una notificación específica de la base de datos
   */
  it("elimina una notificación correctamente", async () => {
    const user = await User.create({
      username: "pepe",
      email: "pepe@example.com",
      password: "pikachu123",
    });

    const notification = await Notification.create({
      userId: user._id,
      type: "trade",
      title: "Test",
      message: "Test",
      isRead: false,
    });

    const res = await request(app)
      .delete(`/notifications/${notification._id}`)
      .expect(200);

    expect(res.body.message).toContain("eliminada");

    const check = await Notification.findById(notification._id);
    expect(check).toBeNull();
  });

  /**
   * Test: Eliminar notificación inexistente
   * Verifica que retorna 404 cuando se intenta eliminar una notificación que no existe
   */
  it("devuelve 404 si no existe", async () => {
    const res = await request(app)
      .delete(`/notifications/${new mongoose.Types.ObjectId()}`)
      .expect(404);

    expect(res.body.error).toBe("Notificación no encontrada");
  });

  /**
   * Test: ID de notificación inválido para delete
   * Verifica que retorna error 400 cuando se intenta eliminar con un ID inválido
   */
  it("devuelve 400 si el ID es inválido", async () => {
    const res = await request(app)
      .delete(`/notifications/invalid-id`)
      .expect(400);

    expect(res.body).toHaveProperty("error");
  });
});
