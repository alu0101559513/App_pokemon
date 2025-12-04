import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { TradeRequest } from "../models/TradeRequest.js";
import { Trade } from "../models/Trade.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware.js";

export const tradeRequestRouter = express.Router();

/**
 * POST /trade-requests
 * Crear nueva solicitud de intercambio
 */
tradeRequestRouter.post("/trade-requests", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      receiverIdentifier,
      pokemonTcgId,
      cardName = "",
      cardImage = "",
      note = "",
      isManual = false, 
    } = req.body as {
      receiverIdentifier?: string;
      pokemonTcgId?: string;
      cardName?: string;
      cardImage?: string;
      note?: string;
      isManual?: boolean;
    };

    const currentUserId = req.userId;

    if (!receiverIdentifier) {
      return res.status(400).send({
        error: "receiverIdentifier es obligatorio",
      });
    }

    if (!isManual && !pokemonTcgId) {
      return res.status(400).send({
        error: "pokemonTcgId es obligatorio para solicitudes de carta",
      });
    }

    const me = await User.findById(currentUserId);
    if (!me) {
      return res
        .status(404)
        .send({ error: "Usuario actual no encontrado" });
    }

    const receiver = await (mongoose.Types.ObjectId.isValid(
      receiverIdentifier
    )
      ? User.findById(receiverIdentifier)
      : User.findOne({
          $or: [{ username: receiverIdentifier }, { email: receiverIdentifier }],
        }));

    if (!receiver) {
      return res
        .status(404)
        .send({ error: "Usuario destino no encontrado" });
    }

    if (receiver._id.equals(me._id)) {
      return res
        .status(400)
        .send({ error: "No puedes enviarte una solicitud a ti mismo" });
    }

    
    const existsQuery: any = {
      status: "pending",
      $or: [
        { from: me._id, to: receiver._id },
        { from: receiver._id, to: me._id },
      ],
    };

    if (isManual) {
      existsQuery.isManual = true;
    } else {
      existsQuery.pokemonTcgId = pokemonTcgId;
      existsQuery.isManual = false;
    }

    const exists = await TradeRequest.findOne(existsQuery);

    if (exists) {
      return res.status(400).send({
        error: isManual
          ? "Ya existe una invitación pendiente de sala entre estos usuarios"
          : "Ya existe una solicitud pendiente para esta carta entre estos usuarios",
      });
    }

    const request = await TradeRequest.create({
      from: me._id,
      to: receiver._id,
      pokemonTcgId: isManual ? null : pokemonTcgId,
      cardName: isManual ? cardName || "Sala privada de intercambio" : cardName,
      cardImage: isManual ? "" : cardImage,
      note,
      status: "pending",
      isManual,
    });
    const notification = await Notification.create({
      userId: receiver._id,
      title: isManual
        ? "Invitación a sala privada de intercambio"
        : "Nueva solicitud de intercambio",
      message: isManual
        ? `${me.username} quiere abrir una sala privada de intercambio contigo.`
        : `${me.username} quiere intercambiar por ${
            cardName || "una carta"
          }.`,
      isRead: false,
    });

    if ((req as any).io) {
      (req as any).io
        .to(`user:${receiver._id}`)
        .emit("notification", notification);
    }

    res.status(201).send({
      message: isManual
        ? "Invitación a sala privada enviada"
        : "Solicitud de intercambio enviada",
      request,
    });
  } catch (error: any) {
    console.error("Error creando solicitud de intercambio:", error);
    res
      .status(500)
      .send({ error: error.message ?? "Error creando solicitud" });
  }
});

/**
 * GET /trade-requests/sent/:userId
 * Obtener solicitudes enviadas por un usuario
 */
tradeRequestRouter.get("/trade-requests/received/:userId",authMiddleware,async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    if (!req.userId || req.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .send({ error: "No puedes ver las solicitudes de otro usuario" });
    }

    const requests = await TradeRequest.find({
      to: userId,
    })
      .populate("from", "username email profileImage")
      .populate("tradeId", "privateRoomCode status")
      .sort({ createdAt: -1 });

    res.send({ requests });
  } catch (error: any) {
    res
      .status(500)
      .send({ error: error.message ?? "Error obteniendo solicitudes" });
  }
});

/**
 * GET /trade-requests/sent/:userId
 * Todas las solicitudes enviadas.
 */
tradeRequestRouter.get("/trade-requests/sent/:userId", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    if (!req.userId || req.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .send({ error: "No puedes ver las solicitudes de otro usuario" });
    }

    const requests = await TradeRequest.find({
      from: userId,
    })
      .populate("to", "username email profileImage")
      .populate("tradeId", "privateRoomCode status")
      .sort({ createdAt: -1 });

    res.send({ requests });
  } catch (error: any) {
    res
      .status(500)
      .send({ error: error.message ?? "Error obteniendo solicitudes" });
  }
});

/**
 * POST /trade-requests/:id/accept
 * Aceptar solicitud
 */
tradeRequestRouter.post("/trade-requests/:id/accept", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.userId;

    const request = await TradeRequest.findById(id);
    if (!request) {
      return res.status(404).send({ error: "Solicitud no encontrada" });
    }

    if (request.to.toString() !== currentUserId?.toString()) {
      return res
        .status(403)
        .send({ error: "No puedes aceptar esta solicitud" });
    }

    if (request.status !== "pending") {
      return res
        .status(400)
        .send({ error: "La solicitud ya no está pendiente" });
    }

    request.status = "accepted";

    const trade = new Trade({
      initiatorUserId: request.from,
      receiverUserId: request.to,
      initiatorCards: [],
      receiverCards: [],
      tradeType: "private",
      status: "pending",
      origin: "request",
      requestId: request._id,
      requestedPokemonTcgId: request.pokemonTcgId,
    });

    await trade.save();
    request.tradeId = trade._id as any;
    await request.save();

    const toUser = await User.findById(request.to);
    const notification = await Notification.create({
      userId: request.from,
      title: "Solicitud de intercambio aceptada",
      message: `${toUser?.username} ha aceptado tu solicitud por ${
        request.cardName || "una carta"
      }.`,
      isRead: false,
      data: {
        type: "tradeAccepted",
        tradeId: trade._id,
        privateRoomCode: (trade as any).privateRoomCode,
      },
    });

    if ((req as any).io) {
      (req as any).io
        .to(`user:${request.from}`)
        .emit("notification", notification);
    }

    res.send({
      message: "Solicitud aceptada",
      request,
      tradeId: trade._id,
      privateRoomCode: (trade as any).privateRoomCode,
    });
  } catch (error: any) {
    console.error("Error aceptando solicitud:", error);
    res
      .status(500)
      .send({ error: error.message ?? "Error aceptando solicitud" });
  }
});


/**
 * POST /trade-requests/:id/reject
 * Rechazar solicitud
 */
tradeRequestRouter.post("/trade-requests/:id/reject", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.userId;

    const request: any = await TradeRequest.findById(id);
    if (!request) {
      return res.status(404).send({ error: "Solicitud no encontrada" });
    }

    if (request.to.toString() !== currentUserId?.toString()) {
      return res
        .status(403)
        .send({ error: "No puedes rechazar esta solicitud" });
    }

    if (request.status !== "pending") {
      return res
        .status(400)
        .send({ error: "La solicitud ya no está pendiente" });
    }

    request.status = "rejected";
    request.finishedAt = new Date();
    await request.save();

    const toUser = await User.findById(request.to);

    const notification = await Notification.create({
      userId: request.from,
      title: "Solicitud de intercambio rechazada",
      message: `${toUser?.username} ha rechazado tu solicitud de intercambio.`,
      isRead: false,
    });

    if ((req as any).io) {
      (req as any).io
        .to(`user:${request.from}`)
        .emit("notification", notification);
    }

    res.send({ message: "Solicitud rechazada", request });
  } catch (error: any) {
    res
      .status(500)
      .send({ error: error.message ?? "Error rechazando solicitud" });
  }
});

/**
 * DELETE /trade-requests/:id/cancel
 * Cancelar solicitud enviada
 */
tradeRequestRouter.delete("/trade-requests/:id/cancel", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.userId;

    const request: any = await TradeRequest.findById(id);
    if (!request) {
      return res.status(404).send({ error: "Solicitud no encontrada" });
    }

    if (request.from.toString() !== currentUserId?.toString()) {
      return res
        .status(403)
        .send({ error: "No puedes cancelar esta solicitud" });
    }

    if (request.status !== "pending") {
      return res
        .status(400)
        .send({ error: "La solicitud ya no está pendiente" });
    }

    request.status = "cancelled";
    request.finishedAt = new Date();
    await request.save();

    res.send({ message: "Solicitud cancelada", request });
  } catch (error: any) {
    res
      .status(500)
      .send({ error: error.message ?? "Error cancelando solicitud" });
  }
});
