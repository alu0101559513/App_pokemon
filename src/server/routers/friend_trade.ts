import express, { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest, authMiddleware } from "../middleware/authMiddleware.js";
import { User } from "../models/User.js";
import { Trade } from "../models/Trade.js";
import { FriendTradeRoomInvite } from "../models/FriendTrade.js";

export const friendTradeRoomsRouter = express.Router();

/**
 * GET /friend-trade-rooms/invites
 * Obtener invitaciones enviadas y recibidas
 */
friendTradeRoomsRouter.get("/friend-trade-rooms/invites", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId;
    if (!currentUserId) {
      return res.status(401).send({ error: "No autenticado" });
    }

    const received = await FriendTradeRoomInvite.find({
      to: currentUserId,
    })
      .populate("from", "username email profileImage")
      .sort({ createdAt: -1 });

    const sent = await FriendTradeRoomInvite.find({
      from: currentUserId,
    })
      .populate("to", "username email profileImage")
      .sort({ createdAt: -1 });

    res.send({ received, sent });
  } catch (error: any) {
    console.error("Error cargando invitaciones:", error);
    res
      .status(500)
      .send({ error: error.message ?? "Error cargando invitaciones" });
  }
});

/**
 * POST /friend-trade-rooms/invite
 * Crear invitación a amigo
 */
friendTradeRoomsRouter.post("/friend-trade-rooms/invite", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { friendId } = req.body as { friendId?: string };
    const currentUserId = req.userId;

    if (!currentUserId) {
      return res.status(401).send({ error: "No autenticado" });
    }

    if (!friendId || !mongoose.Types.ObjectId.isValid(friendId)) {
      return res
        .status(400)
        .send({ error: "friendId es obligatorio y debe ser válido" });
    }

    const me = await User.findById(currentUserId);
    if (!me) {
      return res
        .status(404)
        .send({ error: "Usuario actual no encontrado" });
    }

    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).send({ error: "Amigo no encontrado" });
    }
    const isFriend = me.friends.some(
      (id: any) => id.toString() === friend._id.toString()
    );
    if (!isFriend) {
      return res
        .status(400)
        .send({ error: "Sólo puedes invitar a usuarios que sean tus amigos" });
    }

    if (friend._id.equals(me._id)) {
      return res
        .status(400)
        .send({ error: "No puedes invitarte a ti mismo" });
    }
    const existing = await FriendTradeRoomInvite.findOne({
      from: me._id,
      to: friend._id,
      status: "pending",
    });

    if (existing) {
      return res.status(400).send({
        error: "Ya tienes una invitación pendiente a este amigo",
      });
    }

    const invite = await FriendTradeRoomInvite.create({
      from: me._id,
      to: friend._id,
      status: "pending",
      tradeId: null,
      privateRoomCode: null,
    });

    return res.status(201).send({
      message: "Invitación enviada correctamente",
      invite,
    });
  } catch (error: any) {
    console.error("Error creando invitación de sala:", error);
    return res.status(500).send({
      error: error.message ?? "Error creando invitación de sala",
    });
  }
});

/**
 * POST /friend-trade-rooms/invites/:id/accept
 * Aceptar invitación
 */
friendTradeRoomsRouter.post("/friend-trade-rooms/invites/:id/accept", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.userId;

    const invite = await FriendTradeRoomInvite.findById(id);
    if (!invite) {
      return res.status(404).send({ error: "Invitación no encontrada" });
    }

    if (invite.to.toString() !== currentUserId?.toString()) {
      return res
        .status(403)
        .send({ error: "No puedes aceptar esta invitación" });
    }

    if (invite.status !== "pending") {
      return res
        .status(400)
        .send({ error: "La invitación ya no está pendiente" });
    }
    const trade = new Trade({
      initiatorUserId: invite.from,
      receiverUserId: invite.to,
      initiatorCards: [],
      receiverCards: [],
      tradeType: "private",
      status: "pending",
    });

    await trade.save();

    if (!trade.privateRoomCode) {
      return res.status(500).send({
        error: "No se pudo generar el código de sala privada",
      });
    }

    invite.status = "accepted";
    invite.tradeId = trade._id;
    invite.privateRoomCode = trade.privateRoomCode;
    await invite.save();
    const populatedInvite = await FriendTradeRoomInvite.findById(invite._id)
      .populate("from", "username email profileImage")
      .populate("to", "username email profileImage");

    return res.send({
      message: "Invitación aceptada",
      invite: populatedInvite,
      privateRoomCode: trade.privateRoomCode,
    });
  } catch (error: any) {
    console.error("Error aceptando invitación:", error);
    return res
      .status(500)
      .send({ error: error.message ?? "Error aceptando invitación" });
  }
});
/**
 * POST /friend-trade-rooms/invites/:id/reject
 * Rechazar invitación
 */
friendTradeRoomsRouter.post("/friend-trade-rooms/invites/:id/reject",authMiddleware,async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.userId;

    if (!currentUserId) {
      return res.status(401).send({ error: "No autenticado" });
    }

    const invite = await FriendTradeRoomInvite.   findById(id);
    if (!invite) {
      return res.status(404).send({ error: "Invitación no encontrada" });
    }

    if (invite.to.toString() !== currentUserId.toString()) {
      return res
        .status(403)
        .send({ error: "No puedes rechazar una invitación ajena" });
    }

    if (invite.status !== "pending") {
      return res
        .status(400)
        .send({ error: "La invitación ya no está pendiente" });
    }

    invite.status = "rejected";
    await invite.save();

    res.send({ message: "Invitación rechazada", invite });
  } catch (error: any) {
    console.error("Error rechazando invitación:", error);
    res
      .status(500)
      .send({ error: error.message ?? "Error rechazando invitación" });
  }
});
