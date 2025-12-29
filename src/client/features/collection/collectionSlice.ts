import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/apiService';
import { UserOwnedCard } from '../../types';

interface CollectionState {
  cards: UserOwnedCard[];
  loading: boolean;
  error: string | null;
}

const initialState: CollectionState = {
  cards: [],
  loading: false,
  error: null,
};

export const fetchUserCollection = createAsyncThunk(
  'collection/fetch',
  async (username: string) => await api.getUserCollection(username)
);

export const addToCollection = createAsyncThunk(
  'collection/add',
  async ({ userId, cardId }: { userId: string; cardId: string }) => {
    const success = await api.addToCollection(userId, cardId);
    if (success) return cardId;
    throw new Error('Error al añadir carta');
  }
);

export const removeFromCollection = createAsyncThunk(
  'collection/remove',
  async ({ userId, cardId }: { userId: string; cardId: string }) => {
    const success = await api.removeFromCollection(userId, cardId);
    if (success) return cardId;
    throw new Error('Error al eliminar carta');
  }
);

const collectionSlice = createSlice({
  name: 'collection',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserCollection.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserCollection.fulfilled, (state, action) => {
        state.loading = false;
        state.cards = action.payload;
      })
      .addCase(fetchUserCollection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Error al cargar colección';
      })
      .addCase(removeFromCollection.fulfilled, (state, action) => {
        state.cards = state.cards.filter((c) => c.id !== action.payload);
      });
  },
});

export default collectionSlice.reducer;
