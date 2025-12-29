import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserPreferences {
  language: 'es' | 'en';
  darkMode: boolean;
  notifications: {
    trades: boolean;
    messages: boolean;
    friendRequests: boolean;
  };
  privacy: {
    showCollection: boolean;
    showWishlist: boolean;
  };
}

interface PreferencesState {
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;
}

// Leer dark mode desde localStorage
const getSavedDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('darkMode');
  return saved ? saved === 'true' : false;
};

const initialState: PreferencesState = {
  preferences: {
    language: 'es',
    darkMode: getSavedDarkMode(),
    notifications: {
      trades: true,
      messages: true,
      friendRequests: true,
    },
    privacy: {
      showCollection: true,
      showWishlist: true,
    },
  },
  loading: false,
  error: null,
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    // Cargar preferencias
    setPreferences: (state, action: PayloadAction<UserPreferences>) => {
      state.preferences = action.payload;
    },

    // Cambiar idioma
    setLanguage: (state, action: PayloadAction<'es' | 'en'>) => {
      state.preferences.language = action.payload;
    },

    // Cambiar modo oscuro
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.preferences.darkMode = action.payload;
    },

    // Actualizar notificaciones
    setNotificationPreferences: (
      state,
      action: PayloadAction<Partial<UserPreferences['notifications']>>
    ) => {
      state.preferences.notifications = {
        ...state.preferences.notifications,
        ...action.payload,
      };
    },

    // Actualizar privacidad
    setPrivacyPreferences: (
      state,
      action: PayloadAction<Partial<UserPreferences['privacy']>>
    ) => {
      state.preferences.privacy = {
        ...state.preferences.privacy,
        ...action.payload,
      };
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
  setPreferences,
  setLanguage,
  setDarkMode,
  setNotificationPreferences,
  setPrivacyPreferences,
  setLoading,
  setError,
} = preferencesSlice.actions;

export default preferencesSlice.reducer;
