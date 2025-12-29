import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { ChatMessage } from '../models/Chat.js';
import { UserCard } from '../models/UserCard.js';
import { Card } from '../models/Card.js';
import { PokemonCard } from '../models/PokemonCard.js';
import { TrainerCard } from '../models/TrainerCard.js';
import { EnergyCard } from '../models/EnergyCard.js';
import { getCardById } from '../services/pokemon.js';
import { upsertCardFromRaw } from '../services/cards.js';
import { normalizeImageUrl } from '../services/tcgdx.js';
import { Notification } from '../models/Notification.js';
import { PackOpen } from '../models/PackOpen.js';
import {
  authMiddleware,
  AuthRequest,
  optionalAuthMiddleware,
} from '../middleware/authMiddleware.js';
import {
  sendSuccess,
  sendError,
} from '../utils/responseHelpers.js';
import {
  findUserByIdentifier,
  validateOwnership,
  findFriendByIdentifier,
  getCurrentUserOrFail,
} from '../utils/userHelpers.js';
import {
  computePackTokens,
  validatePackTokens,
  consumePackToken,
  getPackOpenCount24h,
  generatePackCards,
} from '../utils/packHelpers.js';
import {
  removeFriendRequest,
  hasPendingFriendRequest,
  addFriendBidirectional,
  removeFriendBidirectional,
  getChatHistoryBetween,
  deleteChatHistoryBetween,
} from '../utils/friendHelpers.js';
import {
  findUserByUsernameOrEmail,
  validateUsernameEmail,
  validateUsernameOwnership,
  validateRegistrationInput,
} from '../utils/validationHelpers.js';
import { generateAuthToken } from '../utils/jwtHelpers.js';
import { emitToUser, emitMultipleToUser } from '../utils/socketHelpers.js';

const MS_HOUR = 1000 * 60 * 60;

export const userRouter = express.Router();

/**
 * POST /users/register
 * Registrar un nuevo usuario con username, email y contraseña
 */
userRouter.post('/users/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validaciones básicas
    const validation = validateRegistrationInput(username, email, password, confirmPassword);
    if (!validation.valid) {
      return res.status(400).send({ error: validation.error });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .send({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await findUserByUsernameOrEmail(username || email);
    if (existingUser) {
      return res.status(400).send({ error: 'El usuario o correo ya existen' });
    }

    // Hashear la contraseña (10 rondas de salt)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario con pack tokens inicializados
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      packTokens: 2,
      packLastRefill: new Date(),
    });

    await newUser.save();

    return res.status(201).send({
      message: 'Usuario registrado correctamente',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    sendError(res, (error as Error).message ?? String(error), 500);
  }
});

/**
 * POST /users/login
 * Iniciar sesión con username/email y contraseña
 * Devuelve JWT para mantener sesión segura
 */
userRouter.post('/users/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return sendError(res, 'Username y contraseña requeridos', 400);
    }

    const user = await findUserByUsernameOrEmail(username);

    if (!user) {
      return sendError(res, 'Usuario o contraseña incorrectos', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return sendError(res, 'Usuario o contraseña incorrectos', 401);
    }

    const expiresIn: string = process.env.JWT_EXPIRY || '7d';
    const token = generateAuthToken(
      user._id.toString(),
      user.username,
      expiresIn
    );

    // Login exitoso: devolver información del usuario + token
    return res.status(200).send({
      message: 'Sesión iniciada correctamente',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage || '',
      },
      token, // JWT para mantener sesión segura
    });
  } catch (error) {
    sendError(res, (error as Error).message ?? String(error), 500);
  }
});

/**
 * GET /users/:identifier
 * Devuelve info básica de un usuario (por id o username)
 */
userRouter.get(
  '/users/:identifier',
  optionalAuthMiddleware,
  async (req: any, res: Response) => {
    try {
      const { identifier } = req.params;

      const user = await findUserByIdentifier(identifier);
      if (!user) {
        return sendError(res, 'Usuario no encontrado', 404);
      }

      res.send({
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage || '',
      });
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }
);

/**
 * PATCH /users/:username/profile-image
 * Actualiza la imagen de perfil
 */
userRouter.patch(
  '/users/:username/profile-image',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { username } = req.params;
      const { profileImage } = req.body;

      if (!profileImage) {
        return sendError(res, 'No se envió ninguna imagen', 400);
      }

      if (!validateUsernameOwnership(req.username || '', username)) {
        return sendError(res, 'No puedes modificar otro usuario', 403);
      }

      const user = await User.findOneAndUpdate(
        { username },
        { profileImage },
        { new: true }
      );

      if (!user)
        return sendError(res, 'Usuario no encontrado', 404);

      sendSuccess(res, {
        message: 'Imagen actualizada',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profileImage: user.profileImage,
        },
      });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }
);

/**
 * DELETE /users/:username/profile-image
 * Elimina la foto de perfil (la deja vacía)
 */
userRouter.delete(
  '/users/:username/profile-image',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { username } = req.params;

      if (!validateUsernameOwnership(req.username || '', username)) {
        return sendError(res, 'No puedes modificar otro usuario', 403);
      }

      const user = await User.findOneAndUpdate(
        { username },
        { profileImage: '' },
        { new: true }
      );

      if (!user)
        return sendError(res, 'Usuario no encontrado', 404);

      sendSuccess(res, {
        message: 'Foto eliminada',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profileImage: '',
        },
      });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }
);

/**
 * PATCH /users/:username
 * Actualizar un usuario (por id o username)
 */
userRouter.patch(
  '/users/:username',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { username } = req.params;
      const { username: newUsername, email: newEmail } = req.body;

      const user = await findUserByIdentifier(username);
      if (!user) return sendError(res, 'USER_NOT_FOUND', 404);

      // Usar helper para validar cambios de username/email
      const validation = await validateUsernameEmail(newUsername, newEmail, user.username, user.email);
      if (!validation.valid) {
        return sendError(res, validation.error || 'Validation error', 400);
      }

      if (newUsername) user.username = newUsername;
      if (newEmail) user.email = newEmail;

      await user.save();
      const token = generateAuthToken(user._id.toString(), user.username);

      sendSuccess(res, {
        message: 'Perfil actualizado',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profileImage: user.profileImage,
        },
        token,
      });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }
);

/**
 * DELETE /users/:username
 * Eliminar cuenta de usuario
 */
userRouter.delete(
  '/users/:username',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { username } = req.params;

      if (!validateUsernameOwnership(req.username || '', username)) {
        return sendError(res, 'No puedes eliminar otra cuenta', 403);
      }

      const user = await User.findOneAndDelete({ username });

      if (!user) {
        return sendError(res, 'Usuario no encontrado', 404);
      }

      sendSuccess(res, { message: 'Cuenta eliminada correctamente' });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }
);

/**
 * GET /users/:identifier/cards
 * Obtiene cartas de la colección o wishlist de un usuario.
 * Query params: collection=collection|wishlist, page, limit
 * Si el requester no es el propio usuario, sólo devolverá las cartas publicadas (isPublic=true).
 */
userRouter.get(
  '/users/:identifier/cards',
  optionalAuthMiddleware,
  async (req: any, res) => {
    try {
      const { identifier } = req.params;
      const {
        collection = 'collection',
        page = 1,
        limit = 20,
      } = req.query as any;

      const user = await findUserByIdentifier(identifier);
      if (!user)
        return sendError(res, 'Usuario no encontrado', 404);

      const skip = (Number(page) - 1) * Number(limit);

      const filter: any = { userId: user._id, collectionType: collection };

      // si el requester no es el owner, mostrar sólo públicas
      const requesterId = (req as AuthRequest).userId;
      if (!requesterId || requesterId.toString() !== user._id.toString()) {
        filter.isPublic = true;
      }

      const total = await UserCard.countDocuments(filter);
      const cards = await UserCard.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('cardId');

      sendSuccess(res, {
        page: Number(page),
        totalResults: total,
        resultsPerPage: Number(limit),
        cards,
      });
    } catch (error) {
      sendError(res, (error as Error).message ?? String(error), 500);
    }
  }
);

/**
 * POST /users/:identifier/cards
 * Agregar una carta a la colección o wishlist del usuario.
 * Body: { pokemonTcgId?, cardId?, autoFetch?, quantity?, condition?, isPublic?, isFavorite?, collectionType?, notes?, forTrade? }
 */
userRouter.post(
  '/users/:identifier/cards',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { identifier } = req.params;

      const user = await findUserByIdentifier(identifier);
      if (!user)
        return sendError(res, 'Usuario no encontrado', 404);

      // sólo el propio usuario puede modificar su colección
      if (!validateOwnership(req.userId, user._id))
        return sendError(res, 'No autorizado', 403);

      const {
        pokemonTcgId,
        cardId,
        autoFetch = false,
        quantity = 1,
        condition = 'Near Mint',
        isPublic = false,
        isFavorite = false,
        collectionType = 'collection',
        notes = '',
        forTrade = false,
      } = req.body;

      let cardRefId = cardId;

      // buscar por pokemonTcgId si no se proporcionó cardId
      if (!cardRefId && pokemonTcgId) {
        // Usar discriminator: buscar en la colección unificada 'cards'
        const found = await Card.findOne({ pokemonTcgId }).lean();

        if (found) {
          cardRefId = (found as any)._id;
        } else if (autoFetch && pokemonTcgId) {
          // traer de la API externa y persistir con el helper
          const apiResp = await getCardById(pokemonTcgId);
          const raw = apiResp.data ?? apiResp;
          const saved = await upsertCardFromRaw(raw);
          cardRefId = saved?._id;
        }
      }

      if (!cardRefId)
        return res.status(404).send({
          error:
            'Card not found. Provide cardId or pokemonTcgId (use autoFetch=true to fetch)',
        });

      // si ya existe una entrada idéntica (mismo user, misma carta, mismo tipo de colección y condición), aumentar cantidad
      const existingFilter: any = {
        userId: user._id,
        cardId: cardRefId,
        collectionType,
        condition,
      };

      const existing = await UserCard.findOne(existingFilter);
      if (existing) {
        // incrementar cantidad de forma atómica
        const updated = await UserCard.findOneAndUpdate(
          existingFilter,
          {
            $inc: { quantity: Number(quantity) || 1 },
            $set: {
              // actualizar flags si se pasan en la petición
              isPublic:
                typeof isPublic === 'boolean' ? isPublic : existing.isPublic,
              isFavorite:
                typeof isFavorite === 'boolean'
                  ? isFavorite
                  : existing.isFavorite,
              forTrade:
                typeof forTrade === 'boolean' ? forTrade : existing.forTrade,
              // sólo sobreescribir notas si se envían
              notes: notes !== '' ? notes : existing.notes,
            },
          },
          { new: true }
        );

        return res.status(200).send({
          message: 'Existing card quantity incremented',
          userCard: updated,
        });
      }

      const userCard = new UserCard({
        userId: user._id,
        cardId: cardRefId,
        pokemonTcgId: pokemonTcgId || '',
        condition,
        isPublic,
        isFavorite,
        acquisitionDate: new Date(),
        notes,
        quantity,
        forTrade,
        collectionType,
      });

      await userCard.save();
      return res
        .status(201)
        .send({ message: 'Card added to user collection', userCard });
    } catch (error) {
      res
        .status(500)
        .send({ error: (error as Error).message ?? String(error) });
    }
  }
);

/**
 * POST /users/:identifier/open-pack
 * Server-side pack opening with rate limits: max 2 opens per 24h and at least 12h between opens.
 * Body: { setId?: string }
 */
userRouter.post(
  '/users/:identifier/open-pack',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { identifier } = req.params;
      const { setId } = req.body;

      const user = await findUserByIdentifier(identifier);
      if (!user)
        return sendError(res, 'Usuario no encontrado', 404);
      if (!validateOwnership(req.userId, user._id))
        return sendError(res, 'No autorizado', 403);

      // Token-bucket rate limiting
      const { tokens, nextAllowed } = computePackTokens(user);
      if (tokens <= 0) {
        return res.status(429).send({
          error: 'No quedan tokens para abrir sobres. Espera para recargar.',
          nextAllowed,
        });
      }

      // choose a set to open (fallback to a default)
      const sid = setId || 'me01';

      // fetch set cards server-side
      const setResp = await (
        await import('../services/pokemon.js')
      ).getCardsBySet(sid);
      let cards = setResp?.data ?? setResp;
      if (!cards || !Array.isArray(cards)) cards = cards?.cards ?? [];
      if (!cards || cards.length === 0)
        return sendError(res, 'No se pudieron obtener cartas del set', 500);

      // Generar pack de 10 cartas (9 aleatorias + 1 rara)
      const pack = generatePackCards(cards);

      // persist PackOpen record
      await PackOpen.create({ userId: user._id });
      
      // consume a token
      await consumePackToken(user);

      // For each card, upsert into Card collections and create UserCard
      const createdUserCards: any[] = [];
      for (const c of pack) {
        const tcgId = c.id || c.pokemonTcgId || '';
        if (!tcgId) continue;
        // try to find existing Card in DB (using discriminator)
        const found = await Card.findOne({ pokemonTcgId: tcgId }).lean();

        let cardRefId = found?._id;
        if (!cardRefId) {
          // try to fetch and upsert raw card
          try {
            const raw = await (
              await import('../services/pokemon.js')
            ).getCardById(tcgId);
            const saved = await upsertCardFromRaw(raw);
            cardRefId = saved?._id;
          } catch (e) {
            // skip if can't fetch
            continue;
          }
        }

        if (!cardRefId) continue;

        const userCard = new UserCard({
          userId: user._id,
          cardId: cardRefId,
          pokemonTcgId: tcgId,
          condition: 'Near Mint',
          isPublic: false,
          isFavorite: false,
          acquisitionDate: new Date(),
          notes: 'From pack',
          quantity: 1,
          forTrade: false,
          collectionType: 'collection',
        });
        await userCard.save();

        // derive image for response
        let image =
          c.images?.large || c.images?.small || c.imageUrl || c.image || '';
        // ensure image URL points to high-res PNG
        image = normalizeImageUrl(image);
        if (!image && (c.id || c.pokemonTcgId)) {
          const [setCode, num] = (c.id || c.pokemonTcgId).split('-');
          const m = setCode ? String(setCode).match(/^[a-zA-Z]+/) : null;
          const series = m ? m[0] : setCode ? setCode.slice(0, 2) : '';
          if (setCode && num)
            image = `https://assets.tcgdex.net/en/${series}/${setCode}/${num}/high.png`;
        }

        createdUserCards.push({
          userCard,
          image,
          name: c.name || c.title || tcgId,
          pokemonTcgId: tcgId,
        });
      }

      return res
        .status(201)
        .send({ message: 'Pack opened', cards: createdUserCards });
    } catch (err: any) {
      return sendError(res, err?.message ?? String(err), 500);
    }
  }
);

/**
 * GET /users/:identifier/pack-status
 * Returns how many opens remain and nextAllowed timestamp if rate-limited
 */
userRouter.get(
  '/users/:identifier/pack-status',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { identifier } = req.params;

      const user = await findUserByIdentifier(identifier);
      if (!user)
        return sendError(res, 'Usuario no encontrado', 404);
      if (!validateOwnership(req.userId, user._id))
        return sendError(res, 'No autorizado', 403);

      // Check if we need to initialize pack tokens
      const needsInit = typeof (user as any).packTokens !== 'number' || !(user as any).packLastRefill;
      
      // compute token-based status
      const { tokens, nextAllowed } = computePackTokens(user);
      
      // Save if we just initialized
      if (needsInit) {
        await user.save();
      }
      
      // still return count24 for compatibility
      const count24 = await getPackOpenCount24h(PackOpen, user._id);
      return sendSuccess(res, { remaining: tokens, count24, nextAllowed });
    } catch (err: any) {
      return sendError(res, err?.message ?? String(err), 500);
    }
  }
);

/**
 * POST /users/:identifier/reset-pack-limit
 * Reset pack opens for testing. Requires auth and a code (default 'ADMIN').
 */
userRouter.post(
  '/users/:identifier/reset-pack-limit',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { identifier } = req.params;
      const { code } = req.body || {};

      const user = await findUserByIdentifier(identifier);
      if (!user)
        return sendError(res, 'Usuario no encontrado', 404);
      if (!validateOwnership(req.userId, user._id))
        return sendError(res, 'No autorizado', 403);

      const adminCode = process.env.ADMIN_RESET_CODE || 'ADMIN';
      if (!code || String(code) !== adminCode)
        return sendError(res, 'Código inválido', 403);

      await PackOpen.deleteMany({ userId: user._id });
      // reset token bucket on user
      (user as any).packTokens = 2;
      (user as any).packLastRefill = new Date();
      await user.save();
      return sendSuccess(res, { message: 'Reset de límites de sobres realizado' });
    } catch (err: any) {
      return sendError(res, err?.message ?? String(err), 500);
    }
  }
);

/**
 * PATCH /users/:identifier/cards/:userCardId
 * Actualiza campos de una UserCard (quantity, condition, forTrade, isFavorite, isPublic, notes)
 */
userRouter.patch(
  '/users/:identifier/cards/:userCardId',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { identifier, userCardId } = req.params;

      const user = await findUserByIdentifier(identifier);
      if (!user)
        return sendError(res, 'Usuario no encontrado', 404);
      if (!validateOwnership(req.userId, user._id))
        return sendError(res, 'No autorizado', 403);

      const allowed = [
        'quantity',
        'condition',
        'forTrade',
        'isFavorite',
        'isPublic',
        'notes',
        'collectionType',
      ];
      const updates = Object.keys(req.body);
      const valid = updates.every((k) => allowed.includes(k));
      if (!valid)
        return sendError(res, 'Actualización no permitida', 400);

      const userCard = await UserCard.findOne({
        _id: userCardId,
        userId: user._id,
      });
      if (!userCard)
        return sendError(res, 'UserCard no encontrada', 404);

      updates.forEach((k) => ((userCard as any)[k] = req.body[k]));
      await userCard.save();
      sendSuccess(res, { message: 'UserCard actualizada', userCard });
    } catch (error) {
      sendError(res, (error as Error).message ?? String(error), 500);
    }
  }
);

/**
 * DELETE /users/:identifier/cards/:userCardId
 * Elimina una UserCard
 */
userRouter.delete(
  '/users/:identifier/cards/:userCardId',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { identifier, userCardId } = req.params;

      const user = await findUserByIdentifier(identifier);
      if (!user)
        return sendError(res, 'Usuario no encontrado', 404);
      if (!validateOwnership(req.userId, user._id))
        return sendError(res, 'No autorizado', 403);

      const removed = await UserCard.findOneAndDelete({
        _id: userCardId,
        userId: user._id,
      });
      if (!removed)
        return sendError(res, 'UserCard no encontrada', 404);
      sendSuccess(res, { message: 'UserCard eliminada', removed });
    } catch (error) {
      sendError(res, (error as Error).message ?? String(error), 500);
    }
  }
);

/**
 * DELETE /users/:username
 * Eliminar cuenta de usuario
 */
userRouter.delete(
  '/users/:username',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { username } = req.params;

      if (req.username !== username) {
        return res
          .status(403)
          .send({ error: 'No puedes eliminar otra cuenta' });
      }

      const user = await User.findOneAndDelete({ username });

      if (!user) {
        return res.status(404).send({ error: 'Usuario no encontrado' });
      }

      res.send({ message: 'Cuenta eliminada correctamente' });
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }
);

/**
 * GET /users/search/:query
 * Buscar usuarios por username
 */
userRouter.get(
  '/users/search/:query',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { query } = req.params;
      const currentUsername = req.username;

      const users = await User.find({
        $and: [
          { username: { $regex: query, $options: 'i' } },
          { username: { $ne: currentUsername } },
        ],
      }).select('username email profileImage');

      res.send(users);
    } catch (error: any) {
      res.status(500).send({ error: error.message });
    }
  }
);

/**
 * GET /friends/:username
 * Devuelve la lista de amigos del usuario
 */
userRouter.get(
  '/friends/user/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      if (req.userId !== id) {
        return res
          .status(403)
          .send({ error: 'No puedes ver los amigos de otro usuario' });
      }

      const user = await User.findById(id).populate(
        'friends',
        'username email profileImage'
      );

      if (!user)
        return res.status(404).send({ error: 'Usuario no encontrado' });

      res.send({ friends: user.friends });
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }
);

/**
 * GET /friends/requests/:username
 * Ver solicitudes de amistad recibidas
 */
userRouter.get(
  '/friends/requests/user/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      if (req.userId !== id) {
        return res
          .status(403)
          .send({ error: 'No puedes ver las solicitudes de otro usuario' });
      }

      const user = await User.findById(id).populate(
        'friendRequests.from',
        'username email profileImage'
      );

      if (!user)
        return sendError(res, 'Usuario no encontrado', 404);

      const requests = user.friendRequests.map((req: any) => ({
        requestId: req._id,
        userId: req.from._id,
        username: req.from.username,
        email: req.from.email,
        profileImage: req.from.profileImage || '',
        createdAt: req.createdAt,
      }));

      sendSuccess(res, { requests });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }
);

/**
 * POST /friends/accept/:friendIdentifier
 * Aceptar solicitud de amistad
 */
userRouter.post(
  '/friends/accept/:friendIdentifier',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { friendIdentifier } = req.params;
      const currentUserId = req.userId;

      const me = await getCurrentUserOrFail(currentUserId, res);
      if (!me) return;

      const friend = await findFriendByIdentifier(friendIdentifier);
      if (!friend)
        return sendError(res, 'Usuario no encontrado', 404);

      if (!hasPendingFriendRequest(me, friend._id)) {
        return sendError(res, 'No había solicitud pendiente de este usuario', 400);
      }
      
      addFriendBidirectional(me, friend);
      removeFriendRequest(me, friend._id);
      const notification = await Notification.create({
        userId: friend._id,
        title: 'Solicitud de amistad aceptada',
        message: `${me.username} ha aceptado tu solicitud de amistad.`,
        isRead: false,
        data: {
          type: 'friendAccepted',
          friendId: me._id,
        },
      });

      req.io.to(`user:${friend._id}`).emit('notification', notification);

      await me.save();
      await friend.save();

      // Notificar al amigo que la solicitud fue aceptada
      emitToUser(req.io, friend._id, 'friendRequestAccepted', {
        userId: me._id,
        username: me.username,
        profileImage: me.profileImage || '',
      });

      sendSuccess(res, { message: 'Solicitud aceptada', friends: me.friends });
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }
);

/**
 * POST /friends/reject/:friendIdentifier
 * Rechazar solicitud de amistad
 */
userRouter.post(
  '/friends/reject/:friendIdentifier',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { friendIdentifier } = req.params;
      const currentUserId = req.userId;

      const me = await getCurrentUserOrFail(currentUserId, res);
      if (!me) return;

      const friend = await findFriendByIdentifier(friendIdentifier);
      if (!friend)
        return sendError(res, 'Usuario no encontrado', 404);

      removeFriendRequest(me, friend._id);

      await me.save();

      // Notificar al amigo que la solicitud fue rechazada
      emitToUser(req.io, friend._id, 'friendRequestRejected', {
        userId: me._id,
        username: me.username,
      });

      sendSuccess(res, { message: 'Solicitud rechazada' });
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }
);

/**
 * GET /friends/messages/:otherUserId
 * Devuelve el historial de chat entre el usuario actual y otro usuario
 */
userRouter.get(
  '/friends/messages/:otherUserId',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { otherUserId } = req.params;
      const currentUserId = req.userId;

      if (!currentUserId) {
        return sendError(res, 'No autenticado', 401);
      }

      const messages = await getChatHistoryBetween(ChatMessage, currentUserId, otherUserId);

      sendSuccess(res, { messages });
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }
);

/**
 * DELETE /friends/remove/:friendIdentifier
 * Eliminar un amigo (por id o username)
 */
userRouter.delete(
  '/friends/remove/:friendIdentifier',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { friendIdentifier } = req.params;
      const currentUserId = req.userId;

      const me = await getCurrentUserOrFail(currentUserId, res);
      if (!me) return;

      const friend = await findFriendByIdentifier(friendIdentifier);
      if (!friend)
        return sendError(res, 'Usuario no encontrado', 404);

      removeFriendBidirectional(me, friend);
      await deleteChatHistoryBetween(ChatMessage, currentUserId, friend._id);

      await me.save();
      await friend.save();

      sendSuccess(res, { message: 'Amigo eliminado correctamente' });
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }
);

/**
 * GET /friends/requests/sent/:userId
 * Ver solicitudes de amistad enviadas
 */
userRouter.get(
  '/friends/requests/sent/:userId',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;

      // Convertir a ObjectId si es válido
      const userObjectId = userId.match(/^[0-9a-fA-F]{24}$/)
        ? new mongoose.Types.ObjectId(userId)
        : userId;

      const users = await User.find({
        friendRequests: { $elemMatch: { from: userObjectId } },
      }).select('username _id profileImage');

      sendSuccess(res, { sent: users });
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }
);

/**
 * DELETE /friends/requests/cancel/:friendIdentifier
 * Cancelar solicitud de amistad enviada (por id o username)
 */
userRouter.delete(
  '/friends/requests/cancel/:friendIdentifier',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { friendIdentifier } = req.params;
      const currentUserId = req.userId;

      const friend = await findFriendByIdentifier(friendIdentifier);

      if (!friend)
        return sendError(res, 'Usuario no encontrado', 404);

      friend.friendRequests = (friend.friendRequests as any).filter(
        (r: any) => r.from.toString() !== currentUserId!.toString()
      );

      await friend.save();

      sendSuccess(res, { message: 'Solicitud enviada cancelada correctamente' });
    } catch (error: any) {
      sendError(res, error.message, 500);
    }
  }
);

/**
 * POST /friends/request/:friendIdentifier
 * Enviar solicitud de amistad (por id o username)
 */
userRouter.post(
  '/friends/request/:friendIdentifier',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { friendIdentifier } = req.params;
      const currentUserId = req.userId;

      const me = await User.findById(currentUserId);
      if (!me)
        return sendError(res, 'Usuario actual no encontrado', 404);

      const friend = await findFriendByIdentifier(friendIdentifier);

      if (!friend)
        return sendError(res, 'Usuario no encontrado', 404);

      if (friend._id.equals(me._id)) {
        return sendError(res, 'No puedes enviarte solicitud a ti mismo', 400);
      }

      if (me.friends.includes(friend._id)) {
        return sendError(res, 'Ya sois amigos', 400);
      }

      const already = friend.friendRequests.some(
        (r: any) => r.from.toString() === me._id.toString()
      );

      if (already) {
        return sendError(res, 'La solicitud ya está pendiente', 400);
      }

      friend.friendRequests.push({ from: me._id });
      await friend.save();

      const notification = await Notification.create({
        userId: friend._id,
        title: 'Nueva solicitud de amistad',
        message: `${me.username} te ha enviado una solicitud de amistad.`,
        isRead: false,
      });

      // Emitir notificación y evento de solicitud recibida
      emitMultipleToUser(req.io, friend._id, [
        { eventName: 'notification', data: notification },
        {
          eventName: 'friendRequestReceived',
          data: {
            userId: me._id,
            username: me.username,
            email: me.email,
            profileImage: me.profileImage || '',
          },
        },
      ]);

      sendSuccess(res, { message: 'Solicitud enviada correctamente' });
    } catch (error) {
      sendError(res, 'Error procesando solicitud', 500);
    }
  }
);

/**
 * GET /friends
 * Devuelve la lista de amigos del usuario actual
 */
userRouter.get(
  '/friends',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const currentUserId = req.userId;
      if (!currentUserId) {
        return sendError(res, 'No autenticado', 401);
      }

      const me = await User.findById(currentUserId).populate(
        'friends',
        'username email profileImage'
      );

      if (!me) {
        return sendError(res, 'Usuario actual no encontrado', 404);
      }

      return sendSuccess(res, {
        friends: me.friends || [],
      });
    } catch (error: any) {
      console.error('Error cargando amigos:', error);
      return sendError(res, error.message ?? 'Error cargando amigos', 500);
    }
  }
);
