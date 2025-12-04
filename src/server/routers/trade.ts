import express, { Response } from "express";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Trade } from "../models/Trade.js";
import { UserCard } from "../models/UserCard.js";
import { TradeRequest } from "../models/TradeRequest.js";
import { AuthRequest, authMiddleware } from "../middleware/authMiddleware.js";
import { FriendTradeRoomInvite } from "../models/FriendTrade.js";

export const tradeRouter = express.Router();

/**
 * POST /trades
 * Crear un nuevo intercambio
 */
tradeRouter.post("/trades",authMiddleware,async (req: AuthRequest, res: Response) => {
  try {
    const {
      receiverUserId,
      initiatorCards,
      receiverCards,
      tradeType = "private",
      privateRoomCode,
      requestId,
      requestedPokemonTcgId,
      origin, 
    } = req.body;

    const initiatorUserId = req.userId;
    if (!initiatorUserId) {
      return res.status(401).send({ error: "No autenticado" });
    }

    let resolvedReceiverId: mongoose.Types.ObjectId;

    if (mongoose.Types.ObjectId.isValid(receiverUserId)) {
      resolvedReceiverId = new mongoose.Types.ObjectId(receiverUserId);
    } else {
      const receiverUser = await User.findOne({
        $or: [{ username: receiverUserId }, { email: receiverUserId }],
      });

      if (!receiverUser) {
        return res.status(404).send({
          error: `Usuario receptor no encontrado: ${receiverUserId}`,
        });
      }

      resolvedReceiverId = receiverUser._id as mongoose.Types.ObjectId;
    }

    const trade = new Trade({
      initiatorUserId,
      receiverUserId: resolvedReceiverId,
      initiatorCards: initiatorCards || [],
      receiverCards: receiverCards || [],
      tradeType,
      privateRoomCode,
      requestId: requestId || null,
      requestedPokemonTcgId: requestedPokemonTcgId || null,
      origin: origin || "request",
      status: "pending",
    });

    await trade.save();

    res.status(201).send({
      message: "Intercambio creado correctamente",
      tradeId: trade._id,
      privateRoomCode: trade.privateRoomCode,
    });
  } catch (error: any) {
    console.error("Error creando intercambio:", error);
    res.status(400).send({ error: error.message });
  }
});

/**
 * GET /trades
 * Obtener lista de intercambios con paginación y filtros
 */
tradeRouter.get("/trades",authMiddleware,async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, status, tradeType } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {};
    if (status) filter.status = status;
    if (tradeType) filter.tradeType = tradeType;

    const trades = await Trade.find(filter)
      .populate("initiatorUserId", "username email")
      .populate("receiverUserId", "username email")
      .populate("initiatorCards.cardId", "name imageUrl rarity")
      .populate("receiverCards.cardId", "name imageUrl rarity")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Trade.countDocuments(filter);
    const totalPages = Math.ceil(total / Number(limit));

    res.send({
      page: Number(page),
      totalPages,
      totalResults: total,
      resultsPerPage: Number(limit),
      trades,
    });
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
});

/**
 * GET /trades/:id
 * Obtener un intercambio por ID
 */
tradeRouter.get("/trades/:id",authMiddleware,async (req: AuthRequest, res: Response) => {
  try {
    const trade = await Trade.findById(req.params.id)
      .populate("initiatorUserId", "username email")
      .populate("receiverUserId", "username email")
      .populate("initiatorCards.cardId", "name imageUrl rarity")
      .populate("receiverCards.cardId", "name imageUrl rarity");

    if (!trade) {
      return res.status(404).send({ error: "Intercambio no encontrado" });
    }
    res.send(trade);
  } catch (error) {
    res
      .status(500)
      .send({ error: (error as Error).message ?? String(error) });
  }
});

/**
 * GET /trades/room/:code
 * Obtener intercambio por código de sala privada
 */
tradeRouter.get("/trades/room/:code",authMiddleware,async (req: AuthRequest, res: Response) => {
  try {
    const trade = await Trade.findOne({
      privateRoomCode: req.params.code,
    })
      .populate("initiatorUserId", "username email")
      .populate("receiverUserId", "username email")
      .populate("initiatorCards.cardId", "name imageUrl rarity")
      .populate("receiverCards.cardId", "name imageUrl rarity");

    if (!trade) return res.status(404).send({ error: "Sala no encontrada" });
    res.send(trade);
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
});

/**
 * PATCH /trades/:id
 * Actualizar un intercambio
 */
tradeRouter.patch("/trades/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const allowed = ["status", "completedAt", "messages"];
    const updates = Object.keys(req.body);

    const valid = updates.every((u) => allowed.includes(u));
    if (!valid) {
      return res.status(400).send({ error: "Actualización no permitida" });
    }

    const trade: any = await Trade.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!trade) {
      return res.status(404).send({ error: "Intercambio no encontrado" });
    }

    const newStatus = (req.body as any).status;
    if (newStatus === "rejected" || newStatus === "cancelled") {
      try {
        await FriendTradeRoomInvite.updateMany(
          { tradeId: trade._id },
          {
            $set: {
              status: "cancelled",
              completedAt: new Date(),
            },
          }
        );
      } catch (e) {
        console.warn(
          "Error actualizando invitaciones de sala privada al cancelar:",
          e
        );
      }
      if (trade.privateRoomCode && (req as any).io) {
        (req as any).io.to(trade.privateRoomCode).emit("tradeRejected", {
          tradeId: trade._id,
          roomCode: trade.privateRoomCode,
        });
      }
    }
    if (newStatus === "rejected") {
      try {
        const requestId = trade.requestId;
        if (requestId) {
          await TradeRequest.findByIdAndDelete(requestId).catch(() => {});
        }
      } catch (e) {
        console.warn("Error borrando TradeRequest al rechazar:", e);
      }
    }

    res.send(trade);
  } catch (error) {
    res
      .status(400)
      .send({ error: (error as Error).message ?? String(error) });
  }
});

/**
 * DELETE /trades/:id
 */
tradeRouter.delete(
  "/trades/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const trade = await Trade.findByIdAndDelete(req.params.id);
      if (!trade) {
        return res.status(404).send({ error: "Intercambio no encontrado" });
      }
      res.send({ message: "Intercambio eliminado", trade });
    } catch (error) {
      res
        .status(500)
        .send({ error: (error as Error).message ?? String(error) });
    }
  }
);


/**
 * POST /trades/:id/complete
 * Completar un intercambio (ambos usuarios han aceptado)
 */
tradeRouter.post("/trades/:id/complete",authMiddleware,async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { myUserCardId, opponentUserCardId } = req.body as {
      myUserCardId?: string;
      opponentUserCardId?: string;
    };

    if (!myUserCardId || !opponentUserCardId) {
      return res.status(400).send({
        error: "myUserCardId y opponentUserCardId son obligatorios",
      });
    }

    const currentUserId = req.userId;
    if (!currentUserId) {
      return res.status(401).send({ error: "No autenticado" });
    }

    const trade: any = await Trade.findById(id);
    if (!trade) {
      return res.status(404).send({ error: "Intercambio no encontrado" });
    }

    const isInitiator =
      trade.initiatorUserId.toString() === currentUserId.toString();
    const isReceiver =
      trade.receiverUserId.toString() === currentUserId.toString();

    if (!isInitiator && !isReceiver) {
      return res
        .status(403)
        .send({ error: "No puedes completar un intercambio ajeno" });
    }
    if (trade.status !== "pending") {
      return res
        .status(400)
        .send({ error: "El intercambio ya no está pendiente" });
    }

    
    const mySide = isInitiator ? "initiator" : "receiver";
    const otherSide = isInitiator ? "receiver" : "initiator";

    if (!Array.isArray(trade.initiatorCards)) trade.initiatorCards = [];
    if (!Array.isArray(trade.receiverCards)) trade.receiverCards = [];

    const setSideCard = (side: "initiator" | "receiver", userCardId: string) => {
      const key = side === "initiator" ? "initiatorCards" : "receiverCards";

      if (!trade[key] || trade[key].length === 0) {
        trade[key] = [{ userCardId: new mongoose.Types.ObjectId(userCardId) }];
      } else {
        
        trade[key][0].userCardId = new mongoose.Types.ObjectId(userCardId);
      }
    };

    if (typeof trade.initiatorAccepted !== "boolean") {
      trade.initiatorAccepted = false;
    }
    if (typeof trade.receiverAccepted !== "boolean") {
      trade.receiverAccepted = false;
    }

    
    if (isInitiator && trade.initiatorAccepted) {
      return res.status(400).send({ error: "Ya has aceptado este intercambio" });
    }
    if (isReceiver && trade.receiverAccepted) {
      return res.status(400).send({ error: "Ya has aceptado este intercambio" });
    }
    setSideCard(mySide, myUserCardId);
    if (isInitiator) trade.initiatorAccepted = true;
    if (isReceiver) trade.receiverAccepted = true;
    const bothAccepted = trade.initiatorAccepted && trade.receiverAccepted;
    if (!bothAccepted) {
      await trade.save();
      return res.send({
        message: "WAITING_OTHER_USER",
        tradeId: trade._id,
        initiatorAccepted: trade.initiatorAccepted,
        receiverAccepted: trade.receiverAccepted,
      });
    }

    if (
      !trade.initiatorCards ||
      !trade.initiatorCards.length ||
      !trade.receiverCards ||
      !trade.receiverCards.length
    ) {
      return res
        .status(400)
        .send({ error: "El intercambio no tiene cartas asociadas" });
    }

    const initiatorUserCardId = trade.initiatorCards[0].userCardId;
    const receiverUserCardId = trade.receiverCards[0].userCardId;

    const initiatorCard = await UserCard.findById(initiatorUserCardId);
    const receiverCard = await UserCard.findById(receiverUserCardId);

    if (!initiatorCard || !receiverCard) {
      return res
        .status(404)
        .send({ error: "Alguna de las cartas no existe" });
    }
    if (
      initiatorCard.userId.toString() !== trade.initiatorUserId.toString()
    ) {
      return res.status(400).send({
        error: "La carta del iniciador no pertenece al usuario iniciador",
      });
    }

    if (
      receiverCard.userId.toString() !== trade.receiverUserId.toString()
    ) {
      return res.status(400).send({
        error: "La carta del receptor no pertenece al usuario receptor",
      });
    }

    const a =
      typeof initiatorCard.estimatedValue === "number"
        ? initiatorCard.estimatedValue
        : null;
    const b =
      typeof receiverCard.estimatedValue === "number"
        ? receiverCard.estimatedValue
        : null;

    if (a != null && b != null) {
      const max = Math.max(a, b);
      if (max > 0) {
        const diffRatio = Math.abs(a - b) / max; 
        const MAX_DIFF = 0.25; 

        if (diffRatio > MAX_DIFF) {
          return res.status(400).send({
            error: "TRADE_VALUE_DIFF_TOO_HIGH",
            details: { initiatorValue: a, receiverValue: b, diffRatio },
          });
        }
      }
    }
    try {
      if (trade.requestId) {
        const reqDoc: any = await TradeRequest.findById(trade.requestId).lean();
        if (reqDoc && reqDoc.pokemonTcgId) {
          const requestedId = reqDoc.pokemonTcgId;
          const iniTcg = initiatorCard.pokemonTcgId;
          const recTcg = receiverCard.pokemonTcgId;

          if (iniTcg !== requestedId && recTcg !== requestedId) {
            return res.status(400).send({
              error: "REQUESTED_CARD_MISMATCH",
              details: {
                requestedPokemonTcgId: requestedId,
                initiatorPokemonTcgId: iniTcg,
                receiverPokemonTcgId: recTcg,
              },
            });
          }
        }
      }
    } catch (e) {
      console.warn(
        "Error comprobando carta solicitada en TradeRequest:",
        e
      );
    }

    const transferOneCopy = async (
      sourceUserCard: any,
      targetUserId: mongoose.Types.ObjectId
    ) => {
      const {
        cardId,
        pokemonTcgId,
        condition,
        collectionType,
        estimatedValue,
        isPublic,
      } = sourceUserCard;
      const existing = await UserCard.findOne({
        userId: targetUserId,
        cardId,
        collectionType: collectionType || "collection",
        condition: condition || "Near Mint",
      });

      if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
        existing.forTrade = false;
        await existing.save();
      } else {
        await UserCard.create({
          userId: targetUserId,
          cardId,
          pokemonTcgId,
          condition: condition || "Near Mint",
          collectionType: collectionType || "collection",
          quantity: 1,
          isPublic,
          isFavorite: false,
          notes: "",
          estimatedValue,
          forTrade: false, 
        });
      }

      if (sourceUserCard.quantity && sourceUserCard.quantity > 1) {
        sourceUserCard.quantity = sourceUserCard.quantity - 1;
        sourceUserCard.forTrade = false;
        await sourceUserCard.save();
      } else {
        await UserCard.findByIdAndDelete(sourceUserCard._id);
      }
    };
    await transferOneCopy(
      initiatorCard,
      trade.receiverUserId as mongoose.Types.ObjectId
    );
    await transferOneCopy(
      receiverCard,
      trade.initiatorUserId as mongoose.Types.ObjectId
    );

    trade.status = "completed";
    trade.completedAt = new Date();
    await trade.save();

    try {
      const requestId = trade.requestId;
      if (requestId) {
        await TradeRequest.findByIdAndDelete(requestId).catch(() => {});
      }
    } catch (e) {
      console.warn("Error borrando TradeRequest al completar:", e);
    }
    try {
      await FriendTradeRoomInvite.updateMany(
        { tradeId: trade._id },
        {
          $set: {
            status: "completed",
            completedAt: new Date(),
          },
        }
      );
    } catch (e) {
      console.warn(
        "Error actualizando invitaciones de sala privada al completar:",
        e
      );
    }
    if (trade.privateRoomCode && (req as any).io) {
      (req as any).io.to(trade.privateRoomCode).emit("tradeCompleted", {
        tradeId: trade._id,
        roomCode: trade.privateRoomCode,
      });
    }

    return res.send({
      message: "TRADE_COMPLETED",
      tradeId: trade._id,
    });
  } catch (error: any) {
    console.error("Error completando intercambio:", error);
    return res.status(500).send({
      error: error.message ?? "Error completando intercambio",
    });
  }
});
