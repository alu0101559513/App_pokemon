import { createSlice, PayloadAction } from '@reduxjs/toolkit';
const STORAGE_KEY = 'app_notifications';

const loadFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveToStorage = (notifications: any[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
};

export interface Notification {
  _id: string;
  userId: string;
  type: 'trade' | 'message' | 'friendRequest' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationsState {
  notifications: Notification[];
  unread: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  notifications: loadFromStorage(),
  unread: 0,
  loading: false,
  error: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Cargar notificaciones
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
      state.unread = action.payload.filter((n) => !n.isRead).length;
    },

    // Agregar nueva notificación
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unread += 1;
      }
      saveToStorage(state.notifications);
    },

    // Marcar como leída
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(
        (n) => n._id === action.payload
      );
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unread -= 1;
      }
      saveToStorage(state.notifications);
    },

    // Marcar todas como leídas
    markAllAsRead: (state) => {
      state.notifications.forEach((n) => {
        n.isRead = true;
      });
      state.unread = 0;
      saveToStorage(state.notifications);
    },

    // Eliminar notificación
    removeNotification: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(
        (n) => n._id === action.payload
      );
      if (notification && !notification.isRead) {
        state.unread -= 1;
      }
      state.notifications = state.notifications.filter(
        (n) => n._id !== action.payload
      );
      saveToStorage(state.notifications);
    },

    // Establecer carga
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Establecer error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  setLoading,
  setError,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
