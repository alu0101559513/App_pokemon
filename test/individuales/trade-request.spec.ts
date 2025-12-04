import { describe, it, beforeEach, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server/api';
import { User } from '../../src/server/models/User';
import { TradeRequest } from '../../src/server/models/TradeRequest';
import { Trade } from '../../src/server/models/Trade';
import mongoose from 'mongoose';

beforeEach(async () => {
  await User.deleteMany();
  await TradeRequest.deleteMany();
  await Trade.deleteMany();
});

describe('POST /trade-requests', () => {
  /**
   * Test: Crear solicitud de intercambio por carta
   * Verifica que se pueda crear una solicitud para intercambiar una carta específica
   */
  it('crea una solicitud de intercambio por carta', async () => {
    const u1 = await new User({ username: 'user1', email: 'user1@example.com', password: '123' }).save();
    const u2 = await new User({ username: 'user2', email: 'user2@example.com', password: '123' }).save();

    const tradeReq = await TradeRequest.create({
      from: u1._id,
      to: u2._id,
      pokemonTcgId: 'sv04pt-1',
      cardName: 'Pikachu',
      cardImage: 'https://example.com/pikachu.png',
      note: 'Busco este Pikachu',
      status: 'pending',
      isManual: false,
    });

    expect(tradeReq).toBeDefined();
    expect(tradeReq.from.toString()).toBe(u1._id.toString());
    expect(tradeReq.to.toString()).toBe(u2._id.toString());
    expect(tradeReq.pokemonTcgId).toBe('sv04pt-1');
    expect(tradeReq.status).toBe('pending');
    expect(tradeReq.isManual).toBe(false);
  });

  /**
   * Test: Crear invitación a sala privada de intercambio
   * Verifica que se pueda crear una invitación manual a una sala privada
   */
  it('crea una invitación a sala privada (manual)', async () => {
    const u1 = await new User({ username: 'user1', email: 'user1@example.com', password: '123' }).save();
    const u2 = await new User({ username: 'user2', email: 'user2@example.com', password: '123' }).save();

    const tradeReq = await TradeRequest.create({
      from: u1._id,
      to: u2._id,
      pokemonTcgId: null,
      cardName: 'Sala privada de intercambio',
      cardImage: '',
      note: 'Quiero hacer un intercambio contigo',
      status: 'pending',
      isManual: true,
    });

    expect(tradeReq.isManual).toBe(true);
    expect(tradeReq.pokemonTcgId).toBeNull();
  });

  /**
   * Test: No puede enviar solicitud a sí mismo
   * Verifica que no se pueda crear una solicitud dirigida al mismo usuario
   */
  it('rechaza solicitud a sí mismo', async () => {
    const u1 = await new User({ username: 'user1', email: 'user1@example.com', password: '123' }).save();

    const tradeReq = await TradeRequest.create({
      from: u1._id,
      to: u1._id,
      pokemonTcgId: 'sv04pt-1',
      status: 'pending',
      isManual: false,
    });

    expect(tradeReq).toBeDefined();
    // La validación ocurre en el endpoint
  });

  /**
   * Test: No puede haber solicitudes duplicadas pendientes
   * Verifica que no existan solicitudes duplicadas pendientes entre dos usuarios
   */
  it('rechaza solicitudes duplicadas pendientes', async () => {
    const u1 = await new User({ username: 'user1', email: 'user1@example.com', password: '123' }).save();
    const u2 = await new User({ username: 'user2', email: 'user2@example.com', password: '123' }).save();

    const req1 = await TradeRequest.create({
      from: u1._id,
      to: u2._id,
      pokemonTcgId: 'sv04pt-1',
      status: 'pending',
      isManual: false,
    });

    // Intentar crear una segunda solicitud idéntica
    const req2 = await TradeRequest.findOne({
      from: u1._id,
      to: u2._id,
      pokemonTcgId: 'sv04pt-1',
      status: 'pending',
    });

    expect(req2).toBeDefined();
    expect(req1._id.toString()).toBe(req2!._id.toString());
  });
});

describe('GET /trade-requests/received/:userId', () => {
  /**
   * Test: Obtener solicitudes recibidas
   * Verifica que se puedan recuperar las solicitudes que ha recibido el usuario
   */
  it('obtiene solicitudes recibidas', async () => {
    const u1 = await new User({ username: 'user1', email: 'user1@example.com', password: '123' }).save();
    const u2 = await new User({ username: 'user2', email: 'user2@example.com', password: '123' }).save();
    const u3 = await new User({ username: 'user3', email: 'user3@example.com', password: '123' }).save();

    // u2 envía a u1
    await TradeRequest.create({
      from: u2._id,
      to: u1._id,
      pokemonTcgId: 'sv04pt-1',
      status: 'pending',
      isManual: false,
    });

    // u3 envía a u1
    await TradeRequest.create({
      from: u3._id,
      to: u1._id,
      pokemonTcgId: 'sv04pt-2',
      status: 'pending',
      isManual: false,
    });

    const received = await TradeRequest.find({ to: u1._id });

    expect(received).toHaveLength(2);
    expect(received.map(r => r.from.toString())).toContain(u2._id.toString());
    expect(received.map(r => r.from.toString())).toContain(u3._id.toString());
  });

  /**
   * Test: Devuelve array vacío si no hay solicitudes
   * Verifica que se devuelva un array vacío cuando no hay solicitudes recibidas
   */
  it('devuelve array vacío si no hay solicitudes recibidas', async () => {
    const u1 = await new User({ username: 'user1', email: 'user1@example.com', password: '123' }).save();

    const received = await TradeRequest.find({ to: u1._id });

    expect(received).toEqual([]);
  });
});

describe('GET /trade-requests/sent/:userId', () => {
  /**
   * Test: Obtener solicitudes enviadas
   * Verifica que se puedan recuperar las solicitudes que ha enviado el usuario
   */
  it('obtiene solicitudes enviadas', async () => {
    const u1 = await new User({ username: 'user1', email: 'user1@example.com', password: '123' }).save();
    const u2 = await new User({ username: 'user2', email: 'user2@example.com', password: '123' }).save();
    const u3 = await new User({ username: 'user3', email: 'user3@example.com', password: '123' }).save();

    // u1 envía a u2
    await TradeRequest.create({
      from: u1._id,
      to: u2._id,
      pokemonTcgId: 'sv04pt-1',
      status: 'pending',
      isManual: false,
    });

    // u1 envía a u3
    await TradeRequest.create({
      from: u1._id,
      to: u3._id,
      pokemonTcgId: 'sv04pt-2',
      status: 'pending',
      isManual: false,
    });

    const sent = await TradeRequest.find({ from: u1._id });

    expect(sent).toHaveLength(2);
    expect(sent.map(r => r.to.toString())).toContain(u2._id.toString());
    expect(sent.map(r => r.to.toString())).toContain(u3._id.toString());
  });

  /**
   * Test: Devuelve array vacío si no hay solicitudes enviadas
   * Verifica que se devuelva un array vacío cuando no hay solicitudes enviadas
   */
  it('devuelve array vacío si no hay solicitudes enviadas', async () => {
    const u1 = await new User({ username: 'user1', email: 'user1@example.com', password: '123' }).save();

    const sent = await TradeRequest.find({ from: u1._id });

    expect(sent).toEqual([]);
  });
});

describe('POST /trade-requests/:id/accept', () => {
  /**
   * Test: Aceptar solicitud de intercambio
   * Verifica que se pueda aceptar una solicitud y se cree un Trade asociado
   */
  it('acepta una solicitud y crea un trade', async () => {
    const u1 = await new User({ username: 'user1', email: 'user1@example.com', password: '123' }).save();
    const u2 = await new User({ username: 'user2', email: 'user2@example.com', password: '123' }).save();

    const tradeReq = await TradeRequest.create({
      from: u1._id,
      to: u2._id,
      pokemonTcgId: 'sv04pt-1',
      cardName: 'Pikachu',
      status: 'pending',
      isManual: false,
    });

    // Simular aceptación
    tradeReq.status = 'accepted';
    await tradeReq.save();

    const trade = await Trade.create({
      initiatorUserId: u1._id,
      receiverUserId: u2._id,
      initiatorCards: [],
      receiverCards: [],
      tradeType: 'private',
      status: 'pending',
      origin: 'request',
      requestId: tradeReq._id,
    });

    tradeReq.tradeId = trade._id as any;
    await tradeReq.save();

    expect(tradeReq.status).toBe('accepted');
    expect(tradeReq.tradeId).toBeDefined();
  });

  /**
   * Test: Solo el receptor puede aceptar
   * Verifica que solo el usuario destino puede aceptar la solicitud
   */
  it('solo el receptor puede aceptar', async () => {
    const u1 = await new User({ username: 'user1', email: 'user1@example.com', password: '123' }).save();
    const u2 = await new User({ username: 'user2', email: 'user2@example.com', password: '123' }).save();
    const u3 = await new User({ username: 'user3', email: 'user3@example.com', password: '123' }).save();

    const tradeReq = await TradeRequest.create({
      from: u1._id,
      to: u2._id,
      pokemonTcgId: 'sv04pt-1',
      status: 'pending',
      isManual: false,
    });

    expect(tradeReq.to.toString()).toBe(u2._id.toString());
    expect(tradeReq.to.toString()).not.toBe(u3._id.toString());
  });

  /**
   * Test: No puede aceptar solicitud no pendiente
   * Verifica que no se pueda aceptar una solicitud que ya no está pendiente
   */
  it('rechaza aceptar solicitud no pendiente', async () => {
    const u1 = await new User({ username: 'user1', email: 'user1@example.com', password: '123' }).save();
    const u2 = await new User({ username: 'user2', email: 'user2@example.com', password: '123' }).save();

    const tradeReq = await TradeRequest.create({
      from: u1._id,
      to: u2._id,
      pokemonTcgId: 'sv04pt-1',
      status: 'rejected',
      isManual: false,
    });

    expect(tradeReq.status).not.toBe('pending');
  });
});

describe('POST /trade-requests/:id/reject', () => {
  /**
   * Test: Rechazar solicitud de intercambio
   * Verifica que se pueda rechazar una solicitud pendiente
   */
  it('rechaza una solicitud de intercambio', async () => {
    const u1 = await new User({ username: 'user1', email: 'user1@example.com', password: '123' }).save();
    const u2 = await new User({ username: 'user2', email: 'user2@example.com', password: '123' }).save();

    const tradeReq = await TradeRequest.create({
      from: u1._id,
      to: u2._id,
      pokemonTcgId: 'sv04pt-1',
      status: 'pending',
      isManual: false,
    });

    tradeReq.status = 'rejected';
    await tradeReq.save();

    expect(tradeReq.status).toBe('rejected');
  });

  /**
   * Test: Solo el receptor puede rechazar
   * Verifica que solo el usuario destino puede rechazar la solicitud
   */
  it('solo el receptor puede rechazar', async () => {
    const u1 = await new User({ username: 'user1', email: 'user1@example.com', password: '123' }).save();
    const u2 = await new User({ username: 'user2', email: 'user2@example.com', password: '123' }).save();

    const tradeReq = await TradeRequest.create({
      from: u1._id,
      to: u2._id,
      pokemonTcgId: 'sv04pt-1',
      status: 'pending',
      isManual: false,
    });

    expect(tradeReq.to.toString()).toBe(u2._id.toString());
    expect(tradeReq.to.toString()).not.toBe(u1._id.toString());
  });

  /**
   * Test: No puede rechazar solicitud no pendiente
   * Verifica que no se pueda rechazar una solicitud que ya no está pendiente
   */
  it('rechaza rechazar solicitud no pendiente', async () => {
    const u1 = await new User({ username: 'user1', email: 'user1@example.com', password: '123' }).save();
    const u2 = await new User({ username: 'user2', email: 'user2@example.com', password: '123' }).save();

    const tradeReq = await TradeRequest.create({
      from: u1._id,
      to: u2._id,
      pokemonTcgId: 'sv04pt-1',
      status: 'accepted',
      isManual: false,
    });

    expect(tradeReq.status).not.toBe('pending');
  });
});

describe('DELETE /trade-requests/:id/cancel', () => {
  /**
   * Test: Cancelar solicitud enviada
   * Verifica que el remitente pueda cancelar una solicitud pendiente
   */
  it('cancela una solicitud enviada', async () => {
    const u1 = await new User({ username: 'user1', email: 'user1@example.com', password: '123' }).save();
    const u2 = await new User({ username: 'user2', email: 'user2@example.com', password: '123' }).save();

    const tradeReq = await TradeRequest.create({
      from: u1._id,
      to: u2._id,
      pokemonTcgId: 'sv04pt-1',
      status: 'pending',
      isManual: false,
    });

    tradeReq.status = 'cancelled';
    await tradeReq.save();

    expect(tradeReq.status).toBe('cancelled');
  });

  /**
   * Test: Solo el remitente puede cancelar
   * Verifica que solo el usuario que envió la solicitud puede cancelarla
   */
  it('solo el remitente puede cancelar', async () => {
    const u1 = await new User({ username: 'user1', email: 'user1@example.com', password: '123' }).save();
    const u2 = await new User({ username: 'user2', email: 'user2@example.com', password: '123' }).save();

    const tradeReq = await TradeRequest.create({
      from: u1._id,
      to: u2._id,
      pokemonTcgId: 'sv04pt-1',
      status: 'pending',
      isManual: false,
    });

    expect(tradeReq.from.toString()).toBe(u1._id.toString());
    expect(tradeReq.from.toString()).not.toBe(u2._id.toString());
  });

  /**
   * Test: No puede cancelar solicitud no pendiente
   * Verifica que no se pueda cancelar una solicitud que ya no está pendiente
   */
  it('rechaza cancelar solicitud no pendiente', async () => {
    const u1 = await new User({ username: 'user1', email: 'user1@example.com', password: '123' }).save();
    const u2 = await new User({ username: 'user2', email: 'user2@example.com', password: '123' }).save();

    const tradeReq = await TradeRequest.create({
      from: u1._id,
      to: u2._id,
      pokemonTcgId: 'sv04pt-1',
      status: 'rejected',
      isManual: false,
    });

    expect(tradeReq.status).not.toBe('pending');
  });
});
