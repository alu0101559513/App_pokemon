import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ChatMessage } from "../models/Chat.js";
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
import { authMiddleware, AuthRequest, optionalAuthMiddleware } from '../middleware/authMiddleware.js';

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
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).send({ error: 'Todos los campos son requeridos' });
    }

    if (password !== confirmPassword) {
      return res.status(400).send({ error: 'Las contraseñas no coinciden' });
    }

    if (password.length < 6) {
      return res.status(400).send({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).send({ error: 'El usuario o correo ya existen' });
    }

    // Hashear la contraseña (10 rondas de salt)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).send({
      message: 'Usuario registrado correctamente',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    res.status(500).send({ error: (error as Error).message ?? String(error) });
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
      return res.status(400).send({ error: 'Username y contraseña requeridos' });
    }

    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      return res.status(401).send({ error: 'Usuario o contraseña incorrectos' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send({ error: 'Usuario o contraseña incorrectos' });
    }


    const secret: string = process.env.JWT_SECRET || 'tu-clave-secreta';
    const expiresIn: string = process.env.JWT_EXPIRY || '7d';
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        username: user.username
      },
      secret,
      { expiresIn: expiresIn as any }
    );

    // Login exitoso: devolver información del usuario + token
    res.status(200).send({
      message: 'Sesión iniciada correctamente',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage || ""
      },
      token  // JWT para mantener sesión segura
    });
  } catch (error) {
    res.status(500).send({ error: (error as Error).message ?? String(error) });
  }
});


/**
 * GET /users/:identifier
 * Devuelve info básica de un usuario (por id o username)
 */
userRouter.get("/users/:identifier",optionalAuthMiddleware,async (req: any, res: Response) => {
  try {
    const { identifier } = req.params;

    const filter = mongoose.Types.ObjectId.isValid(identifier)
      ? { _id: identifier }
      : { username: identifier };

    const user = await User.findOne(filter).select(
      "username email profileImage"
    );

    if (!user) {
      return res.status(404).send({ error: "Usuario no encontrado" });
    }

    res.send({
      id: user._id,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage || "",
    });
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
});

/**
 * PATCH /users/:username/profile-image
 * Actualiza la imagen de perfil
 */
userRouter.patch('/users/:username/profile-image',authMiddleware,async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;
    const { profileImage } = req.body;

    if (!profileImage) {
      return res.status(400).send({ error: "No se envió ninguna imagen" });
    }

    if (req.username !== username) {
      return res.status(403).send({ error: "No puedes modificar otro usuario" });
    }

    const user = await User.findOneAndUpdate(
      { username },
      { profileImage },
      { new: true }
    );

    if (!user) return res.status(404).send({ error: "Usuario no encontrado" });

    res.send({
      message: "Imagen actualizada",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (err: any) {
    res.status(500).send({ error: err.message });
  }
});

/**
 * DELETE /users/:username/profile-image
 * Elimina la foto de perfil (la deja vacía)
 */
userRouter.delete('/users/:username/profile-image', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { username } = req.params;

    if (req.username !== username) {
      return res.status(403).send({ error: "No puedes modificar otro usuario" });
    }

    const user = await User.findOneAndUpdate(
      { username },
      { profileImage: "" },
      { new: true }
    );

    if (!user) return res.status(404).send({ error: "Usuario no encontrado" });

    res.send({
      message: "Foto eliminada",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: ""
      }
    });
  } catch (err: any) {
    res.status(500).send({ error: err.message });
  }
});



/**
 * PATCH /users/:username
 * Actualizar un usuario (por id o username)
 */
userRouter.patch('/users/:username', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { username } = req.params;
    const { username: newUsername, email: newEmail } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).send({ error: "USER_NOT_FOUND" });

    if (newUsername && newUsername !== user.username) {
      const existsUser = await User.findOne({ username: newUsername });
      if (existsUser) {
        return res.status(400).send({ error: "USERNAME_EXISTS" });
      }
    }

    if (newEmail && newEmail !== user.email) {
      const existsEmail = await User.findOne({ email: newEmail });
      if (existsEmail) {
        return res.status(400).send({ error: "EMAIL_EXISTS" });
      }
    }

    if (newUsername) user.username = newUsername;
    if (newEmail) user.email = newEmail;

    await user.save();
    const secret = process.env.JWT_SECRET || "tu-clave-secreta";
    const token = jwt.sign(
      { userId: user._id.toString(), username: user.username },
      secret,
      { expiresIn: "7d" }
    );

    res.send({
      message: "Perfil actualizado",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage
      },
      token
    });

  } catch (err: any) {
    res.status(500).send({ error: err.message });
  }
});

/**
 * DELETE /users/:username
 * Eliminar cuenta de usuario
 */
userRouter.delete('/users/:username', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { username } = req.params;

    if (req.username !== username) {
      return res.status(403).send({ error: "No puedes eliminar otra cuenta" });
    }

    const user = await User.findOneAndDelete({ username });

    if (!user) {
      return res.status(404).send({ error: "Usuario no encontrado" });
    }

    res.send({ message: "Cuenta eliminada correctamente" });

  } catch (err: any) {
    res.status(500).send({ error: err.message });
  }
});

/**
 * GET /users/:identifier/cards
 * Obtiene cartas de la colección o wishlist de un usuario.
 * Query params: collection=collection|wishlist, page, limit
 * Si el requester no es el propio usuario, sólo devolverá las cartas publicadas (isPublic=true).
 */
userRouter.get('/users/:identifier/cards', optionalAuthMiddleware, async (req: any, res) => {
  try {
    const { identifier } = req.params;
    const { collection = 'collection', page = 1, limit = 20 } = req.query as any;
    const filterUser = mongoose.Types.ObjectId.isValid(identifier) ? { _id: identifier } : { username: identifier };
    const user = await User.findOne(filterUser);
    if (!user) return res.status(404).send({ error: 'Usuario no encontrado' });

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

    res.send({ page: Number(page), totalResults: total, resultsPerPage: Number(limit), cards });
  } catch (error) {
    res.status(500).send({ error: (error as Error).message ?? String(error) });
  }
});

/**
 * POST /users/:identifier/cards
 * Agregar una carta a la colección o wishlist del usuario.
 * Body: { pokemonTcgId?, cardId?, autoFetch?, quantity?, condition?, isPublic?, isFavorite?, collectionType?, notes?, forTrade? }
 */
userRouter.post('/users/:identifier/cards', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { identifier } = req.params;
    const filterUser = mongoose.Types.ObjectId.isValid(identifier) ? { _id: identifier } : { username: identifier };
    const user = await User.findOne(filterUser);
    if (!user) return res.status(404).send({ error: 'Usuario no encontrado' });

    // sólo el propio usuario puede modificar su colección
    if (req.userId?.toString() !== user._id.toString()) return res.status(403).send({ error: 'No autorizado' });

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
      forTrade = false
    } = req.body;

    let cardRefId = cardId;

    // buscar por pokemonTcgId si no se proporcionó cardId
    if (!cardRefId && pokemonTcgId) {
      const found = await Promise.any([
        PokemonCard.findOne({ pokemonTcgId }).lean(),
        TrainerCard.findOne({ pokemonTcgId }).lean(),
        EnergyCard.findOne({ pokemonTcgId }).lean(),
        Card.findOne({ pokemonTcgId }).lean()
      ]).catch(() => null);

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

    if (!cardRefId) return res.status(404).send({ error: 'Card not found. Provide cardId or pokemonTcgId (use autoFetch=true to fetch)' });

    // si ya existe una entrada idéntica (mismo user, misma carta, mismo tipo de colección y condición), aumentar cantidad
    const existingFilter: any = {
      userId: user._id,
      cardId: cardRefId,
      collectionType,
      condition
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
            isPublic: typeof isPublic === 'boolean' ? isPublic : existing.isPublic,
            isFavorite: typeof isFavorite === 'boolean' ? isFavorite : existing.isFavorite,
            forTrade: typeof forTrade === 'boolean' ? forTrade : existing.forTrade,
            // sólo sobreescribir notas si se envían
            notes: notes !== '' ? notes : existing.notes
          }
        },
        { new: true }
      );

      return res.status(200).send({ message: 'Existing card quantity incremented', userCard: updated });
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
      collectionType
    });

    await userCard.save();
    return res.status(201).send({ message: 'Card added to user collection', userCard });
  } catch (error) {
    res.status(500).send({ error: (error as Error).message ?? String(error) });
  }
});

/**
 * POST /users/:identifier/open-pack
 * Server-side pack opening with rate limits: max 2 opens per 24h and at least 12h between opens.
 * Body: { setId?: string }
 */
userRouter.post('/users/:identifier/open-pack', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { identifier } = req.params;
    const { setId } = req.body;
    const filterUser = mongoose.Types.ObjectId.isValid(identifier) ? { _id: identifier } : { username: identifier };
    const user = await User.findOne(filterUser);
    if (!user) return res.status(404).send({ error: 'Usuario no encontrado' });
    if (req.userId?.toString() !== user._id.toString()) return res.status(403).send({ error: 'No autorizado' });

    // Token-bucket rate limiting
    // capacity = 2, refill 1 token every 12 hours
    const REFILL_MS = 12 * MS_HOUR;
    // ensure fields exist
    if (typeof (user as any).packTokens !== 'number' || !(user as any).packLastRefill) {
      (user as any).packTokens = 2;
      (user as any).packLastRefill = new Date();
    }
    const now = Date.now();
    const lastRefill = new Date((user as any).packLastRefill).getTime();
    const refillCount = Math.floor((now - lastRefill) / REFILL_MS);
    if (refillCount > 0) {
      (user as any).packTokens = Math.min(2, ((user as any).packTokens || 0) + refillCount);
      (user as any).packLastRefill = new Date(lastRefill + refillCount * REFILL_MS);
      await user.save();
    }

    if (((user as any).packTokens || 0) <= 0) {
      const nextAllowed = new Date((user as any).packLastRefill).getTime() + REFILL_MS;
      return res.status(429).send({ error: 'No quedan tokens para abrir sobres. Espera para recargar.', nextAllowed: new Date(nextAllowed) });
    }

    // choose a set to open (fallback to a default)
    const sid = setId || 'me01';

    // fetch set cards server-side
    const setResp = await (await import('../services/pokemon.js')).getCardsBySet(sid);
    let cards = setResp?.data ?? setResp;
    if (!cards || !Array.isArray(cards)) cards = cards?.cards ?? [];
    if (!cards || cards.length === 0) return res.status(500).send({ error: 'No se pudieron obtener cartas del set' });

    // pick 9 random + 1 rare (reuse RARITY_ORDER logic client-side minimal)
    const RARITY_ORDER = ['Common','Uncommon','Rare','Holo Rare','Rare Holo','Ultra Rare','Secret Rare'];
    const chosen: any[] = [];
    const pool = [...cards];
    for (let i = 0; i < 9; i++) {
      if (pool.length === 0) break;
      const idx = Math.floor(Math.random() * pool.length);
      chosen.push(pool.splice(idx,1)[0]);
    }
    const rarityIndex = RARITY_ORDER.indexOf('Rare');
    const rarePool = cards.filter((c:any) => {
      const r = (c.rarity || c.rarityText || '').toString();
      const idx = RARITY_ORDER.findIndex(x => x.toLowerCase() === r.toLowerCase());
      return idx >= 0 && idx >= rarityIndex;
    });
    const pickRandom = (arr:any[]) => arr[Math.floor(Math.random()*arr.length)];
    const last = (rarePool.length>0) ? pickRandom(rarePool) : pickRandom(cards);
    const pack = [...chosen, last];

    // persist PackOpen record
    await PackOpen.create({ userId: user._id });
    // consume a token and persist user token state
    (user as any).packTokens = Math.max(0, ((user as any).packTokens || 0) - 1);
    await user.save();

    // For each card, upsert into Card collections and create UserCard
    const createdUserCards: any[] = [];
    for (const c of pack) {
      const tcgId = c.id || c.pokemonTcgId || '';
      if (!tcgId) continue;
      // try to find existing Card in DB
      const found = await Promise.any([
        PokemonCard.findOne({ pokemonTcgId: tcgId }).lean(),
        TrainerCard.findOne({ pokemonTcgId: tcgId }).lean(),
        EnergyCard.findOne({ pokemonTcgId: tcgId }).lean(),
        Card.findOne({ pokemonTcgId: tcgId }).lean()
      ]).catch(() => null);

      let cardRefId = found?._id;
      if (!cardRefId) {
        // try to fetch and upsert raw card
        try {
          const raw = await (await import('../services/pokemon.js')).getCardById(tcgId);
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
        collectionType: 'collection'
      });
      await userCard.save();

      // derive image for response
      let image = c.images?.large || c.images?.small || c.imageUrl || c.image || '';
      // ensure image URL points to high-res PNG
      image = normalizeImageUrl(image);
      if (!image && (c.id || c.pokemonTcgId)) {
        const [setCode, num] = (c.id || c.pokemonTcgId).split('-');
        const m = setCode ? String(setCode).match(/^[a-zA-Z]+/) : null;
        const series = m ? m[0] : (setCode ? setCode.slice(0,2) : '');
        if (setCode && num) image = `https://assets.tcgdex.net/en/${series}/${setCode}/${num}/high.png`;
      }

      createdUserCards.push({ userCard, image, name: c.name || c.title || tcgId, pokemonTcgId: tcgId });
    }

    return res.status(201).send({ message: 'Pack opened', cards: createdUserCards });
  } catch (err:any) {
    return res.status(500).send({ error: err?.message ?? String(err) });
  }
});

/**
 * GET /users/:identifier/pack-status
 * Returns how many opens remain and nextAllowed timestamp if rate-limited
 */
userRouter.get('/users/:identifier/pack-status', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { identifier } = req.params;
    const filterUser = mongoose.Types.ObjectId.isValid(identifier) ? { _id: identifier } : { username: identifier };
    const user = await User.findOne(filterUser);
    if (!user) return res.status(404).send({ error: 'Usuario no encontrado' });
    if (req.userId?.toString() !== user._id.toString()) return res.status(403).send({ error: 'No autorizado' });

    // compute token-based status
    const REFILL_MS = 12 * MS_HOUR;
    const now = Date.now();
    const lastRefill = new Date((user as any).packLastRefill).getTime();
    let tokens = typeof (user as any).packTokens === 'number' ? (user as any).packTokens : 2;
    const refillCount = Math.floor((now - lastRefill) / REFILL_MS);
    if (refillCount > 0) tokens = Math.min(2, tokens + refillCount);
    let nextAllowed: Date | null = null;
    if (tokens <= 0) {
      nextAllowed = new Date(lastRefill + REFILL_MS);
    }
    // still return count24 for compatibility
    const dayAgo = new Date(now - 24 * MS_HOUR);
    const count24 = await PackOpen.countDocuments({ userId: user._id, createdAt: { $gte: dayAgo } });
    return res.send({ remaining: tokens, count24, nextAllowed });
  } catch (err: any) {
    return res.status(500).send({ error: err?.message ?? String(err) });
  }
});

/**
 * POST /users/:identifier/reset-pack-limit
 * Reset pack opens for testing. Requires auth and a code (default 'ADMIN').
 */
userRouter.post('/users/:identifier/reset-pack-limit', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { identifier } = req.params;
    const { code } = req.body || {};
    const filterUser = mongoose.Types.ObjectId.isValid(identifier) ? { _id: identifier } : { username: identifier };
    const user = await User.findOne(filterUser);
    if (!user) return res.status(404).send({ error: 'Usuario no encontrado' });
    if (req.userId?.toString() !== user._id.toString()) return res.status(403).send({ error: 'No autorizado' });

    const adminCode = process.env.ADMIN_RESET_CODE || 'ADMIN';
    if (!code || String(code) !== adminCode) return res.status(403).send({ error: 'Código inválido' });

    await PackOpen.deleteMany({ userId: user._id });
    // reset token bucket on user
    (user as any).packTokens = 2;
    (user as any).packLastRefill = new Date();
    await user.save();
    return res.send({ message: 'Reset de límites de sobres realizado' });
  } catch (err: any) {
    return res.status(500).send({ error: err?.message ?? String(err) });
  }
});

/**
 * PATCH /users/:identifier/cards/:userCardId
 * Actualiza campos de una UserCard (quantity, condition, forTrade, isFavorite, isPublic, notes)
 */
userRouter.patch('/users/:identifier/cards/:userCardId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { identifier, userCardId } = req.params;
    const filterUser = mongoose.Types.ObjectId.isValid(identifier) ? { _id: identifier } : { username: identifier };
    const user = await User.findOne(filterUser);
    if (!user) return res.status(404).send({ error: 'Usuario no encontrado' });
    if (req.userId?.toString() !== user._id.toString()) return res.status(403).send({ error: 'No autorizado' });

    const allowed = ['quantity', 'condition', 'forTrade', 'isFavorite', 'isPublic', 'notes', 'collectionType'];
    const updates = Object.keys(req.body);
    const valid = updates.every((k) => allowed.includes(k));
    if (!valid) return res.status(400).send({ error: 'Actualización no permitida' });

    const userCard = await UserCard.findOne({ _id: userCardId, userId: user._id });
    if (!userCard) return res.status(404).send({ error: 'UserCard no encontrada' });

    updates.forEach((k) => (userCard as any)[k] = req.body[k]);
    await userCard.save();
    res.send({ message: 'UserCard actualizada', userCard });
  } catch (error) {
    res.status(500).send({ error: (error as Error).message ?? String(error) });
  }
});

/**
 * DELETE /users/:identifier/cards/:userCardId
 * Elimina una UserCard
 */
userRouter.delete('/users/:identifier/cards/:userCardId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { identifier, userCardId } = req.params;
    const filterUser = mongoose.Types.ObjectId.isValid(identifier) ? { _id: identifier } : { username: identifier };
    const user = await User.findOne(filterUser);
    if (!user) return res.status(404).send({ error: 'Usuario no encontrado' });
    if (req.userId?.toString() !== user._id.toString()) return res.status(403).send({ error: 'No autorizado' });

    const removed = await UserCard.findOneAndDelete({ _id: userCardId, userId: user._id });
    if (!removed) return res.status(404).send({ error: 'UserCard no encontrada' });
    res.send({ message: 'UserCard eliminada', removed });
  } catch (error) {
    res.status(500).send({ error: (error as Error).message ?? String(error) });
  }
});

/**
 * DELETE /users/:username
 * Eliminar cuenta de usuario
 */
userRouter.delete('/users/:username', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { username } = req.params;

    if (req.username !== username) {
      return res.status(403).send({ error: "No puedes eliminar otra cuenta" });
    }

    const user = await User.findOneAndDelete({ username });

    if (!user) {
      return res.status(404).send({ error: "Usuario no encontrado" });
    }

    res.send({ message: "Cuenta eliminada correctamente" });

  } catch (err: any) {
    res.status(500).send({ error: err.message });
  }
});


/**
 * GET /users/search/:query
 * Buscar usuarios por username 
 */
userRouter.get("/users/search/:query", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { query } = req.params;
    const currentUsername = req.username;

    const users = await User.find({
      $and: [
        { username: { $regex: query, $options: "i" } },
        { username: { $ne: currentUsername } }
      ]
    }).select("username email profileImage");

    res.send(users);
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
});

/**
 * GET /friends/:username
 * Devuelve la lista de amigos del usuario
 */
userRouter.get("/friends/user/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (req.userId !== id) {
      return res.status(403).send({ error: "No puedes ver los amigos de otro usuario" });
    }

    const user = await User.findById(id)
      .populate("friends", "username email profileImage");

    if (!user) return res.status(404).send({ error: "Usuario no encontrado" });

    res.send({ friends: user.friends });
  } catch (err: any) {
    res.status(500).send({ error: err.message });
  }
});

/**
 * GET /friends/requests/:username
 * Ver solicitudes de amistad recibidas
 */
userRouter.get("/friends/requests/user/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    if (req.userId !== id) {
      return res.status(403).send({ error: "No puedes ver las solicitudes de otro usuario" });
    }

    const user = await User.findById(id).populate(
      "friendRequests.from",
      "username email profileImage"
    );

    if (!user) return res.status(404).send({ error: "Usuario no encontrado" });

    const requests = user.friendRequests.map((req: any) => ({
      requestId: req._id,
      userId: req.from._id,
      username: req.from.username,
      email: req.from.email,
      profileImage: req.from.profileImage || "",
      createdAt: req.createdAt,
    }));

    res.send({ requests });
  } catch (err : any) {
    res.status(500).send({ error: err.message });
  }
});

/**
 * POST /friends/accept/:friendIdentifier
 * Aceptar solicitud de amistad
 */
userRouter.post("/friends/accept/:friendIdentifier", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { friendIdentifier } = req.params;
    const currentUserId = req.userId;
    const currentUsername = req.username;

    const me = await User.findById(currentUserId);
    if (!me) return res.status(404).send({ error: "Usuario actual no encontrado" });

    const friend = await (mongoose.Types.ObjectId.isValid(friendIdentifier)
      ? User.findById(friendIdentifier)
      : User.findOne({ username: friendIdentifier }));

    if (!friend) return res.status(404).send({ error: "Usuario no encontrado" });

    const hadRequest = me.friendRequests.some((r: any) => r.from.toString() === friend._id.toString());
    if (!hadRequest) {
      return res.status(400).send({ error: "No había solicitud pendiente de este usuario" });
    }
    if (!me.friends.includes(friend._id)) {
      me.friends.push(friend._id);
    }
    if (!friend.friends.includes(me._id)) {
      friend.friends.push(me._id);
    }
    (me.friendRequests as any) = (me.friendRequests as any).filter(
      (r: any) => r.from.toString() !== friend._id.toString()
    );

    await me.save();
    await friend.save();

    res.send({ message: "Solicitud aceptada", friends: me.friends });
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
});

/**
 * POST /friends/reject/:friendIdentifier
 * Rechazar solicitud de amistad
 */
userRouter.post("/friends/reject/:friendIdentifier", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { friendIdentifier } = req.params;
    const currentUserId = req.userId;

    const me = await User.findById(currentUserId);
    if (!me) return res.status(404).send({ error: "Usuario actual no encontrado" });

    const friend = await (mongoose.Types.ObjectId.isValid(friendIdentifier)
      ? User.findById(friendIdentifier)
      : User.findOne({ username: friendIdentifier }));

    if (!friend) return res.status(404).send({ error: "Usuario no encontrado" });

    (me.friendRequests as any) = (me.friendRequests as any).filter(
      (r: any) => r.from.toString() !== friend._id.toString()
    );

    await me.save();

    res.send({ message: "Solicitud rechazada" });
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
});

/**
 * GET /friends/messages/:otherUserId
 * Devuelve el historial de chat entre el usuario actual y otro usuario
 */
userRouter.get("/friends/messages/:otherUserId", authMiddleware,async (req: AuthRequest, res: Response) => {
  try {
    const { otherUserId } = req.params;
    const currentUserId = req.userId;

    if (!currentUserId) {
      return res.status(401).send({ error: "No autenticado" });
    }

    const messages = await ChatMessage.find({
      $or: [
        { from: currentUserId, to: otherUserId },
        { from: otherUserId, to: currentUserId },
      ],
    }).sort({ createdAt: 1 }); 

    res.send({ messages });
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
});

/**
 * DELETE /friends/remove/:friendIdentifier
 * Eliminar un amigo (por id o username)
 */
userRouter.delete("/friends/remove/:friendIdentifier", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { friendIdentifier } = req.params;
    const currentUserId = req.userId;

    const me = await User.findById(currentUserId);
    if (!me) return res.status(404).send({ error: "Usuario actual no encontrado" });

    const friend = await (mongoose.Types.ObjectId.isValid(friendIdentifier)
      ? User.findById(friendIdentifier)
      : User.findOne({ username: friendIdentifier }));

    if (!friend) return res.status(404).send({ error: "Usuario no encontrado" });

    me.friends = me.friends.filter(
      (id: any) => id.toString() !== friend._id.toString()
    );

    friend.friends = friend.friends.filter(
      (id: any) => id.toString() !== me._id.toString()
    );

    await me.save();
    await friend.save();

    res.send({ message: "Amigo eliminado correctamente" });
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
});


/**
 * GET /friends/requests/sent/:userId
 * Ver solicitudes de amistad enviadas
 */
userRouter.get("/friends/requests/sent/:userId", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;

    const users = await User.find({
      friendRequests: { $elemMatch: { from: userId } }
    }).select("username _id");

    res.send({ sent: users });
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
});

/**
 * DELETE /friends/requests/cancel/:friendIdentifier
 * Cancelar solicitud de amistad enviada (por id o username)
 */
userRouter.delete("/friends/requests/cancel/:friendIdentifier", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { friendIdentifier } = req.params;
    const currentUserId = req.userId;

    const friend = await (
      mongoose.Types.ObjectId.isValid(friendIdentifier)
        ? User.findById(friendIdentifier)
        : User.findOne({ username: friendIdentifier })
    );

    if (!friend) return res.status(404).send({ error: "Usuario no encontrado" });

    friend.friendRequests = (friend.friendRequests as any).filter(
      (r: any) => r.from.toString() !== currentUserId!.toString()
    );


    await friend.save();

    res.send({ message: "Solicitud enviada cancelada correctamente" });

  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
});

/**
 * POST /friends/request/:friendIdentifier
 * Enviar solicitud de amistad (por id o username)
 */
userRouter.post("/friends/request/:friendIdentifier", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { friendIdentifier } = req.params;
    const currentUserId = req.userId;

    const me = await User.findById(currentUserId);
    if (!me) return res.status(404).send({ error: "Usuario actual no encontrado" });

    const friend = await (
      mongoose.Types.ObjectId.isValid(friendIdentifier)
        ? User.findById(friendIdentifier)
        : User.findOne({ username: friendIdentifier })
    );

    if (!friend) return res.status(404).send({ error: "Usuario no encontrado" });

    if (friend._id.equals(me._id)) {
      return res.status(400).send({ error: "No puedes enviarte solicitud a ti mismo" });
    }

    if (me.friends.includes(friend._id)) {
      return res.status(400).send({ error: "Ya sois amigos" });
    }

    const already = friend.friendRequests.some(
      (r: any) => r.from.toString() === me._id.toString()
    );

    if (already) {
      return res.status(400).send({ error: "La solicitud ya está pendiente" });
    }

    friend.friendRequests.push({ from: me._id });
    await friend.save();

    const notification = await Notification.create({
      userId: friend._id,
      title: "Nueva solicitud de amistad",
      message: `${me.username} te ha enviado una solicitud de amistad.`,
      isRead: false,
    });

    req.io.to(`user:${friend._id}`).emit("notification", notification);

    res.send({ message: "Solicitud enviada correctamente" });

  } catch (error) {
    res.status(500).send({ error: "Error procesando solicitud" });
  }
});

/**
 * GET /friends
 * Devuelve la lista de amigos del usuario actual
 */
userRouter.get("/friends", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId;
    if (!currentUserId) {
      return res.status(401).send({ error: "No autenticado" });
    }

    const me = await User.findById(currentUserId).populate(
      "friends",
      "username email profileImage"
    );

    if (!me) {
      return res
        .status(404)
        .send({ error: "Usuario actual no encontrado" });
    }

    return res.send({
      friends: me.friends || [],
    });
  } catch (error: any) {
    console.error("Error cargando amigos:", error);
    return res
      .status(500)
      .send({ error: error.message ?? "Error cargando amigos" });
  }
});