import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/apiService'
import { UserOwnedCard } from "../../types";

interface WishlistState {
  cards: UserOwnedCard[]
  loading: boolean
  error: string | null
}

const initialState: WishlistState = {
  cards: [],
  loading: false,
  error: null,
}
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetch',
  async (username: string) => await api.getUserWishlist(username)
)

export const addToWishlist = createAsyncThunk(
  'wishlist/add',
  async ({ userId, cardId }: { userId: string; cardId: string }) => {
    const success = await api.addToWishlist(userId, cardId)
    if (!success) throw new Error('Error adding card to wishlist')
    return cardId
  }
)

export const removeFromWishlist = createAsyncThunk(
  'wishlist/remove',
  async ({ userId, cardId }: { userId: string; cardId: string }) => {
    const success = await api.removeFromWishlist(userId, cardId)
    if (!success) throw new Error('Error removing card from wishlist')
    return cardId
  }
)

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false
        state.cards = action.payload
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Error al cargar wishlist'
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        if (!state.cards.some(card => card.id === action.payload)) {
          state.cards.push({ id: action.payload } as UserOwnedCard);
        }
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.cards = state.cards.filter(card => card.id !== action.payload)
      })
  },
})

export default wishlistSlice.reducer
