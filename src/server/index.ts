/**
 * @file index.ts
 * @description Archivo principal del servidor Express con configuración de Socket.io
 *
 * Configura:
 * - Servidor Express con CORS
 * - Websocket (Socket.io) para comunicación en tiempo real
 * - Autenticación JWT para conexiones Socket.io
 * - Enrutadores de la API REST
 * - Eventos de Socket.io para salas de trading y mensajes privados
 *
 * @requires express - Framework web
 * @requires http - Módulo HTTP de Node.js
 * @requires cors - Middleware CORS
 * @requires jsonwebtoken - Autenticación JWT
 * @requires socket.io - Websocket para tiempo real
 */

import express from 'express';
import http from 'http';
import cors from 'cors';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Server } from 'socket.io';
import './db/mongoose.js';

import { defaultRouter } from './routers/default.js';
import { userRouter } from './routers/users.js';
import { pokemonRouter } from './routers/pokemon.js';
import { userCardRouter } from './routers/usercard.js';
import { tradeRouter } from './routers/trade.js';
import { cardRouter } from './routers/card.js';
import { syncRouter } from './routers/api.js';
import { notificationRouter } from './routers/notification.js';
import { preferencesRouter } from './routers/preferences.js';
import { tradeRequestRouter } from './routers/trade_request.js';
import { friendTradeRoomsRouter } from './routers/friend_trade.js';
import { ChatMessage } from './models/Chat.js';

/**
 * Instancia de la aplicación Express
 * @type {Express.Application}
 */
const app = express();

/**
 * Configuración de CORS
 * Permite solicitudes desde localhost:5173 (Vite dev server)
 * @type {cors.CorsOptions}
 */
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

/**
 * Middleware de parseo de JSON y formularios
 * Límite de 10MB para uploads
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Crear servidor HTTP con Socket.io
 * @type {http.Server}
 */
const server = http.createServer(app);

/**
 * Instancia de Socket.io para comunicación en tiempo real
 * @type {Server}
 */
export const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  },
});

/**
 * Middleware que inyecta la instancia de Socket.io en cada request
 * Permite que los routers accedan a Socket.io mediante req.io
 */
app.use((req: any, _res, next) => {
  req.io = io;
  next();
});

/**
 * Middleware de autenticación para Socket.io
 * Valida el JWT proporcionado en el handshake
 * Si el token es válido, almacena userId y username en socket.data
 */
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token provided'));

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'tu-clave-secreta'
    ) as JwtPayload;

    socket.data.userId = decoded.userId;
    socket.data.username = decoded.username;

    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

/**
 * Evento de conexión de Socket.io
 * Gestiona:
 * - Unión automática a sala privada del usuario
 * - Eventos de sala (joinRoom, selectCard, tradeReady)
 * - Mensajes privados
 * - Notificaciones de desconexión
 */
io.on('connection', (socket) => {
  console.log(`Usuario conectado: ${socket.data.username}`);

  const privateRoom = `user:${socket.data.userId}`;
  socket.join(privateRoom);

  socket.on('joinRoom', (roomCode: string) => {
    socket.join(roomCode);
    console.log(`${socket.data.username} se unió a sala ${roomCode}`);

    socket.to(roomCode).emit('userJoined', {
      user: socket.data.username,
      userId: socket.data.userId,
    });

    const usersInRoom = Array.from(io.sockets.adapter.rooms.get(roomCode) || [])
      .map((id) => io.sockets.sockets.get(id)?.data.username)
      .filter(Boolean) as string[];

    socket.emit('roomUsers', { users: usersInRoom });
  });

  socket.on('typing', ({ to }) => {
    if (!to) return;

    socket.to(`user:${to}`).emit('typing', {
      from: socket.data.userId,
    });
  });

  socket.on('stopTyping', ({ to }) => {
    if (!to) return;

    socket.to(`user:${to}`).emit('stopTyping', {
      from: socket.data.userId,
    });
  });
  /**
   * Evento: sendMessage
   * Envía un mensaje a TODOS los usuarios en la sala (incluyendo el remitente)
   * @param {Object} data - Objeto con roomCode y text
   */
  socket.on('sendMessage', (data: any) => {
    const message = {
      user: socket.data.username,
      userId: socket.data.userId,
      text: data.text,
    };
    
    // Enviar a todos en la sala incluyendo el remitente
    io.to(data.roomCode).emit('receiveMessage', message);
  });

  /**
   * Evento: selectCard
   * Notifica cuando un usuario selecciona una carta para trading
   * @param {Object} data - Objeto con roomCode y card
   */
  socket.on('selectCard', (data: any) => {
    const { roomCode, card } = data;
    socket.to(roomCode).emit('cardSelected', {
      user: socket.data.username,
      userId: socket.data.userId,
      card,
    });
  });

  /**
   * Evento: tradeReady
   * Indica si el usuario está listo para completar el trading
   * @param {Object} data - Objeto con roomCode y accepted
   */
  socket.on('tradeReady', (data: any) => {
    const { roomCode, accepted } = data;
    socket.to(roomCode).emit('tradeReady', {
      user: socket.data.username,
      userId: socket.data.userId,
      accepted: !!accepted,
    });
  });

  /**
   * Evento: privateMessage
   * Envía mensajes privados entre usuarios
   * Guarda el mensaje en la base de datos
   * @param {Object} msg - Objeto con from, to, text
   */
  socket.on('privateMessage', async (msg: any) => {
    const { from, to, text } = msg;

    if (!from || !to || !text) return;

    try {
      const saved = await ChatMessage.create({
        from,
        to,
        text,
      });

      const payload = {
        from,
        to,
        text,
        createdAt: saved.createdAt,
      };
      io.to(`user:${to}`).emit('privateMessage', payload);
      io.to(`user:${from}`).emit('privateMessage', payload);
    } catch (err) {
      console.error('Error guardando mensaje privado:', err);
    }
  });

  /**
   * Evento: disconnect
   * Se ejecuta cuando un usuario se desconecta
   */
  socket.on('disconnect', () => {
    console.log(`Usuario desconectado: ${socket.data.username}`);
  });
});

/**
 * Registro de todos los routers de la API
 * Orden: usuarios, notificaciones, preferencias, sync, cartas, trading, etc.
 */
app.use(userRouter);
app.use(notificationRouter);
app.use(preferencesRouter);
app.use(syncRouter);
app.use(cardRouter);
app.use(tradeRouter);
app.use(userCardRouter);
app.use(pokemonRouter);
app.use(tradeRequestRouter);
app.use(friendTradeRoomsRouter);
app.use(defaultRouter);

/**
 * Iniciar servidor en el puerto especificado
 * Puerto por defecto: 3000
 */
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Servidor listo en http://localhost:${port}`);
});
