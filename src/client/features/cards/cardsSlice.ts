import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/apiService'
import { PokemonCard, PaginatedResponse } from '../../types'

interface CardsState {
  list: PokemonCard[]
  selectedCard: PokemonCard | null
  loading: boolean
  error: string | null
  total: number
}

const initialState: CardsState = {
  list: [],
  selectedCard: null,
  loading: false,
  error: null,
  total: 0,
}

export const fetchFeaturedCards = createAsyncThunk(
  'cards/fetchFeatured',
  async () => await api.fetchFeaturedCards()
)

export const searchCards = createAsyncThunk(
  'cards/search',
  async ({ query, page = 1 }: { query: string; page?: number }) => {
    const response: PaginatedResponse<PokemonCard> = await api.searchCards(query, page)
    return response
  }
)

export const fetchCardById = createAsyncThunk(
  'cards/fetchById',
  async (id: string) => await api.getCardById(id)
)

const cardsSlice = createSlice({
  name: 'cards',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeaturedCards.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchFeaturedCards.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload
      })
      .addCase(searchCards.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload.data
        state.total = action.payload.total
      })
      .addCase(fetchCardById.fulfilled, (state, action) => {
        state.selectedCard = action.payload
      })
  },
})

export default cardsSlice.reducer
