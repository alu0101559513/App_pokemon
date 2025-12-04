/**
 * @file store.ts
 * @description Configuración del store Redux para la aplicación
 * 
 * Gestiona el estado global de:
 * - Usuarios (authentication, profile)
 * - Cartas (featured, búsqueda)
 * - Colección personal del usuario
 * - Trading y solicitudes
 * - Lista de deseos (wishlist)
 * - Notificaciones
 * - Preferencias de usuario
 * 
 * @requires @reduxjs/toolkit - Toolkit para Redux
 * @requires react-redux - Bindings de React para Redux
 * @module store
 */

import { configureStore } from '@reduxjs/toolkit'
import cardsReducer from '../features/cards/cardsSlice'
import collectionReducer from '../features/collection/collectionSlice'
import tradesReducer from '../features/trades/tradesSlice'
import usersReducer from '../features/users/usersSlice'
import wishlistReducer from '../features/whislist/whislistSlice'
import notificationsReducer from '../features/notifications/notificationsSlice'
import preferencesReducer from '../features/preferences/preferencesSlice'

/**
 * Store de Redux
 * Contiene todos los reducers del estado global
 * @type {ReturnType<typeof configureStore>}
 */
export const store = configureStore({
  /**
   * Reducers del store
   * Cada uno maneja una parte del estado global
   */
  reducer: {
    users: usersReducer,
    cards: cardsReducer,
    collection: collectionReducer,
    trades: tradesReducer,
    wishlist: wishlistReducer,
    notifications: notificationsReducer,
    preferences: preferencesReducer,
  },
})

/**
 * Tipo para acceder al estado global completo
 * @type {ReturnType<typeof store.getState>}
 */
export type RootState = ReturnType<typeof store.getState>

/**
 * Tipo para el dispatch de acciones
 * @type {typeof store.dispatch}
 */
export type AppDispatch = typeof store.dispatch