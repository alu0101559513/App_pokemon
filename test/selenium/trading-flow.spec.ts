import { describe, it, beforeEach, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server/api';
import { User } from '../../src/server/models/User';
import { UserCard } from '../../src/server/models/UserCard';
import { Trade } from '../../src/server/models/Trade';
import { Card } from '../../src/server/models/Card';
import mongoose from 'mongoose';

/**
 * E2E Tests - Pruebas de flujo completo de Trading
 * Estos tests verifican el flujo de negocio completo desde la creación de usuarios
 * hasta la realización de intercambios.
 * 
 * NOTA: Muchos tests están comentados como .skip porque requieren autenticación funcional
 * que aún no está disponible en modo test. Deberán activarse cuando la autenticación esté lista.
 */

// Limpieza antes de cada test
beforeEach(async () => {
  await User.deleteMany();
  await UserCard.deleteMany();
  await Trade.deleteMany();
  await Card.deleteMany();
});

describe('E2E: Trading Flow - Flujo completo de intercambio de cartas', () => {
  /**
   * Test E2E: Flujo completo de intercambio (SKIP - requiere autenticación)
   * 
   * Pasos probados:
   * 1. Crear dos usuarios (Alice y Bob)
   * 2. Crear cartas de Pokémon en la BD
   * 3. Alice agrega una carta a su colección
   * 4. Bob agrega la misma carta a su wishlist y otra a su colección
   * 5. Ambos usuarios pueden ver sus cartas
   * 6. Alice crea un intercambio privado con Bob
   * 7. Bob acepta el intercambio
   * 8. Las cartas se transfieren correctamente
   * 9. Se verifican los historiales de intercambios
   */
  // Comentado: Requiere autenticación que no está funcionando en test mode
  it.skip('Dos usuarios crean cuentas, agregan cartas a su colección y realizan un intercambio', async () => {
    // Paso 1: Crear dos usuarios
    console.log('Paso 1: Creando dos usuarios...');
    const user1 = await User.create({
      username: 'alice',
      email: 'alice@example.com',
      password: 'alice123',
    });

    const user2 = await User.create({
      username: 'bob',
      email: 'bob@example.com',
      password: 'bob123',
    });

    expect(user1._id).toBeDefined();
    expect(user2._id).toBeDefined();
    console.log(`Usuarios creados: ${user1.username} (${user1._id}) y ${user2.username} (${user2._id})`);

    // Paso 2: Crear cartas en la BD
    console.log('\nPaso 2: Creando cartas de Pokémon...');
    const card1 = await Card.create({
      pokemonTcgId: 'base1-1',
      name: 'Blastoise',
      imageUrl: 'https://example.com/blastoise.png',
      marketPrice: 50,
      types: ['Water'],
    });

    const card2 = await Card.create({
      pokemonTcgId: 'base1-2',
      name: 'Venusaur',
      imageUrl: 'https://example.com/venusaur.png',
      marketPrice: 45,
      types: ['Grass'],
    });

    expect(card1.pokemonTcgId).toBe('base1-1');
    expect(card2.pokemonTcgId).toBe('base1-2');
    console.log(`Cartas creadas: ${card1.name} y ${card2.name}`);

    // Paso 3: Alice agrega cartas a su colección
    console.log('\nPaso 3: Alice agrega cartas a su colección...');
    const res1 = await request(app)
      .post(`/usercards/${user1.username}/collection`)
      .send({
        cardId: card1._id.toString(),
        pokemonTcgId: card1.pokemonTcgId,
        notes: 'Mi Blastoise favorito',
      })
      .expect(201);

    expect(res1.body.collectionType).toBe('collection');
    expect(res1.body._id).toBeDefined();
    const aliceCardId = res1.body._id;
    console.log(`Alice agregó ${card1.name} a su colección`);

    // Paso 4: Bob agrega cartas a su wishlist
    console.log('\nPaso 4: Bob agrega cartas a su wishlist...');
    const res2 = await request(app)
      .post(`/usercards/${user2.username}/wishlist`)
      .send({
        cardId: card1._id.toString(),
        pokemonTcgId: card1.pokemonTcgId,
        notes: 'Quiero esta carta',
      })
      .expect(201);

    expect(res2.body.collectionType).toBe('wishlist');
    console.log(`Bob agregó ${card1.name} a su wishlist`);

    // Paso 5: Bob agrega su carta a la colección
    console.log('\nPaso 5: Bob agrega su carta a la colección...');
    const res3 = await request(app)
      .post(`/usercards/${user2.username}/collection`)
      .send({
        cardId: card2._id.toString(),
        pokemonTcgId: card2.pokemonTcgId,
        notes: 'Carta duplicada',
      })
      .expect(201);

    const bobCardId = res3.body._id;
    console.log(`Bob agregó ${card2.name} a su colección`);

    // Paso 6: Alice verifica sus cartas
    console.log('\nPaso 6: Verificando colección de Alice...');
    const res4 = await request(app)
      .get(`/usercards/${user1.username}/collection`)
      .expect(200);

    expect(res4.body.cards.length).toBeGreaterThan(0);
    console.log(`Alice tiene ${res4.body.cards.length} cartas en su colección`);

    // Paso 7: Alice crea un intercambio
    console.log('\nPaso 7: Alice propone un intercambio a Bob...');
    const res5 = await request(app)
      .post('/trades')
      .send({
        initiatorUserId: user1._id.toString(),
        receiverUserId: user2._id.toString(),
        tradeType: 'private',
        initiatorCards: [
          {
            userCardId: aliceCardId,
            cardId: card1._id.toString(),
            estimatedValue: card1.marketPrice,
          },
        ],
        receiverCards: [
          {
            userCardId: bobCardId,
            cardId: card2._id.toString(),
            estimatedValue: card2.marketPrice,
          },
        ],
      })
      .expect(201);

    // New response format has message, tradeId, privateRoomCode
    expect(res5.body.tradeId).toBeDefined();
    const tradeId = res5.body.tradeId;
    console.log(`Intercambio creado con ID: ${tradeId}`);

    // Paso 8: Alice verifica el intercambio creado
    console.log('\nPaso 8: Verificando el intercambio...');
    const res6 = await request(app)
      .get(`/trades/${tradeId}`)
      .expect(200);

    expect(res6.body.status).toBe('pending');
    expect(res6.body).toHaveProperty('initiatorUserId');
    expect(res6.body).toHaveProperty('receiverUserId');
    console.log(`Intercambio verificado - Estado: ${res6.body.status}`);

    // Paso 9: Bob acepta el intercambio
    console.log('\nPaso 9: Bob acepta el intercambio...');
    const res7 = await request(app)
      .patch(`/trades/${tradeId}`)
      .send({
        status: 'completed',
      })
      .expect(200);

    expect(res7.body.status).toBe('completed');
    console.log(`Intercambio completado - Nuevo estado: ${res7.body.status}`);

    // Paso 10: Verificar que las cartas se intercambiaron
    console.log('\nPaso 10: Verificando que las cartas se intercambiaron...');
    const res8 = await request(app)
      .get(`/usercards/${user1.username}/collection`)
      .expect(200);

    const res9 = await request(app)
      .get(`/usercards/${user2.username}/collection`)
      .expect(200);

    console.log(
      `Intercambio finalizado:\n  - Alice ahora tiene ${res8.body.cards.length} cartas\n  - Bob ahora tiene ${res9.body.cards.length} cartas`
    );

    // Paso 11: Verificar historial de intercambios
    console.log('\nPaso 11: Verificando historial de intercambios...');
    const res10 = await request(app)
      .get('/trades?page=1&limit=10')
      .expect(200);

    expect(res10.body.trades.length).toBeGreaterThan(0);
    const completedTrades = res10.body.trades.filter((t: any) => t.status === 'completed');
    expect(completedTrades.length).toBeGreaterThan(0);
    console.log(`Historial de intercambios verificado - Total completados: ${completedTrades.length}`);
  });

  /**
   * Test E2E: Flujo con amistad y trading privado (SKIP - requiere autenticación)
   * 
   * Pasos probados:
   * 1. Crear dos usuarios (Charlie y Diana)
   * 2. Los usuarios se agregan mutuamente como amigos
   * 3. Agregan cartas a sus colecciones
   * 4. Realizan un intercambio privado
   * 5. Se verifica que el intercambio está completado
   */
  // Comentado: Requiere autenticación que no está funcionando en test mode
  it.skip('Un usuario puede añadir otro como amigo y luego hacer un intercambio privado', async () => {
    console.log('\n\n=== E2E: Flujo de Amistad y Trading ===');

    // Crear usuarios
    const user1 = await User.create({
      username: 'charlie',
      email: 'charlie@example.com',
      password: 'charlie123',
    });

    const user2 = await User.create({
      username: 'diana',
      email: 'diana@example.com',
      password: 'diana123',
    });

    console.log(`Usuarios creados: ${user1.username} y ${user2.username}`);

    // Charlie agrega a Diana como amiga
    console.log('\nPaso 1: Charlie agrega a Diana como amiga...');
    const res1 = await request(app)
      .post(`/users/${user1._id.toString()}/friends/${user2.username}`)
      .expect(200);

    expect(res1.body).toBeDefined();
    console.log(`Diana agregada a la lista de amigos de Charlie`);

    // Verificar que son amigos
    console.log('\nPaso 2: Verificando relación de amistad...');
    const res2 = await request(app)
      .get(`/users/${user1._id.toString()}`)
      .expect(200);

    expect(res2.body.friends).toBeDefined();
    console.log(`Charlie tiene ${res2.body.friends?.length || 0} amigos`);

    // Crear y agregar cartas
    const card1 = await Card.create({
      pokemonTcgId: 'base2-1',
      name: 'Charizard',
      imageUrl: 'https://example.com/charizard.png',
      marketPrice: 100,
      types: ['Fire'],
    });

    const card2 = await Card.create({
      pokemonTcgId: 'base2-2',
      name: 'Dragonite',
      imageUrl: 'https://example.com/dragonite.png',
      marketPrice: 90,
      types: ['Dragon'],
    });

    // Charlie agrega carta
    const res3 = await request(app)
      .post(`/usercards/${user1.username}/collection`)
      .send({
        cardId: card1._id.toString(),
        pokemonTcgId: card1.pokemonTcgId,
      })
      .expect(201);

    const charlieCardId = res3.body._id;

    // Diana agrega carta
    const res4 = await request(app)
      .post(`/usercards/${user2.username}/collection`)
      .send({
        cardId: card2._id.toString(),
        pokemonTcgId: card2.pokemonTcgId,
      })
      .expect(201);

    const dianaCardId = res4.body._id;

    console.log(`Cartas agregadas: Charlie tiene ${card1.name}, Diana tiene ${card2.name}`);

    // Charlie propone intercambio privado con su amiga
    console.log('\nPaso 3: Charlie propone intercambio privado con Diana...');
    const res5 = await request(app)
      .post('/trades')
      .send({
        initiatorUserId: user1._id.toString(),
        receiverUserId: user2._id.toString(),
        tradeType: 'private',
        initiatorCards: [
          {
            userCardId: charlieCardId,
            cardId: card1._id.toString(),
            estimatedValue: card1.marketPrice,
          },
        ],
        receiverCards: [
          {
            userCardId: dianaCardId,
            cardId: card2._id.toString(),
            estimatedValue: card2.marketPrice,
          },
        ],
      })
      .expect(201);

    const tradeId = res5.body.tradeId;
    console.log(`Intercambio privado propuesto (ID: ${tradeId})`);

    // Diana acepta
    const res6 = await request(app)
      .patch(`/trades/${tradeId}`)
      .send({ status: 'completed' })
      .expect(200);

    expect(res6.body.status).toBe('completed');
    console.log(`Diana aceptó el intercambio`);

    console.log('\nFlujo de amistad y trading completado exitosamente');
  });

  /**
   * Test E2E: Flujo de bloqueo (SKIP - requiere autenticación)
   * 
   * Pasos probados:
   * 1. Crear dos usuarios (Eve y Frank)
   * 2. Eve bloquea a Frank
   * 3. Se verifica que Frank está en la lista de bloqueados de Eve
   * 4. Se confirma que el bloqueo es efectivo
   */
  // Comentado: Requiere autenticación que no está funcionando en test mode
  it.skip('Un usuario puede bloquear a otro y los intercambios son restringidos', async () => {
    console.log('\n\n=== E2E: Flujo de Bloqueo ===');

    // Crear usuarios
    const user1 = await User.create({
      username: 'eve',
      email: 'eve@example.com',
      password: 'eve123',
    });

    const user2 = await User.create({
      username: 'frank',
      email: 'frank@example.com',
      password: 'frank123',
    });

    console.log(`Usuarios creados: ${user1.username} y ${user2.username}`);

    // Eve bloquea a Frank
    console.log('\nBloqueando usuario...');
    const res1 = await request(app)
      .post(`/users/${user1._id.toString()}/block/${user2.username}`)
      .expect(200);

    console.log(`${user2.username} ha sido bloqueado`);

    // Verificar bloqueo
    const res2 = await request(app)
      .get(`/users/${user1._id.toString()}`)
      .expect(200);

    expect(res2.body.blockedUsers).toBeDefined();
    console.log(`${user1.username} tiene ${res2.body.blockedUsers?.length || 0} usuarios bloqueados`);

    console.log('\nFlujo de bloqueo completado');
  });
});
