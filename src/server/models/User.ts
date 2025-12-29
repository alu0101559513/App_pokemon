/**
 * @file User.ts
 * @description Modelo de Usuario para la base de datos MongoDB
 *
 * Define la estructura de datos para los usuarios de la aplicación
 * incluyendo autenticación, configuraciones, amigos y más.
 *
 * @requires mongoose - ODM para MongoDB
 * @requires validator - Validación de datos (emails, etc)
 */

import mongoose from 'mongoose';
import validator from 'validator';
const { Schema } = mongoose;

/**
 * Esquema para solicitudes de amistad
 * @typedef {Object} FriendRequest
 * @property {ObjectId} from - ID del usuario que envía la solicitud
 * @property {Date} createdAt - Fecha de creación de la solicitud
 */
const friendRequestSchema = new Schema({
  from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

/**
 * Esquema principal del Usuario
 *
 * @typedef {Object} User
 * @property {string} username - Nombre de usuario único
 * @property {string} email - Email único del usuario (validado)
 * @property {string} password - Contraseña hasheada
 * @property {string} profileImage - URL de la imagen de perfil
 * @property {Object} settings - Configuraciones del usuario
 * @property {string} settings.language - Idioma (es/en)
 * @property {boolean} settings.darkMode - Modo oscuro habilitado
 * @property {Object} settings.notifications - Configuración de notificaciones
 * @property {boolean} settings.notifications.trades - Notificaciones de trading
 * @property {boolean} settings.notifications.messages - Notificaciones de mensajes
 * @property {boolean} settings.notifications.friendRequests - Notificaciones de solicitudes de amistad
 * @property {Object} settings.privacy - Configuración de privacidad
 * @property {boolean} settings.privacy.showCollection - Mostrar colección al público
 * @property {boolean} settings.privacy.showWishlist - Mostrar lista de deseos al público
 * @property {number} packTokens - Tokens disponibles para abrir packs
 * @property {Date} packLastRefill - Última vez que se rellenaron los tokens
 * @property {Array} friends - Lista de IDs de amigos
 * @property {Array} blockedUsers - Lista de usuarios bloqueados
 * @property {Array} friendRequests - Solicitudes de amistad pendientes
 * @property {Date} createdAt - Fecha de creación del usuario
 * @property {Date} updatedAt - Fecha de última actualización
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate(value: string) {
        if (!validator.default.isEmail(value)) {
          throw new Error('Email is invalid');
        }
      },
    },
    password: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    settings: {
      language: {
        type: String,
        default: 'es',
        enum: ['es', 'en'],
      },
      darkMode: {
        type: Boolean,
        default: false,
      },
      notifications: {
        trades: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
        friendRequests: { type: Boolean, default: true },
      },
      privacy: {
        showCollection: { type: Boolean, default: true },
        showWishlist: { type: Boolean, default: true },
      },
    },
    // pack opening token bucket
    packTokens: {
      type: Number,
      default: 2,
    },
    packLastRefill: {
      type: Date,
      default: Date.now,
    },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequests: [friendRequestSchema],
  },
  {
    timestamps: true,
  }
);

/**
 * Modelo de Usuario exportado
 * Usado en toda la aplicación para operaciones con usuarios
 * @type {mongoose.Model}
 */
export const User = mongoose.model('User', userSchema);
