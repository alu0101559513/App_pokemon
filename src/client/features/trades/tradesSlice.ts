import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/apiService'
import { Trade, TradeStatus } from '../../types'

interface TradesState {
  list: Trade[]
  loading: boolean
  error: string | null
}

const initialState: TradesState = {
  list: [],
  loading: false,
  error: null,
}

export const fetchUserTrades = createAsyncThunk(
  "trades/fetchUserTrades",
  async (userId: string, { rejectWithValue }) => {
    try {
      return await api.getUserTrades(userId);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createTrade = createAsyncThunk(
  "trades/createTrade",
  async (
    data: {
      initiatorUserId: string;
      receiverUserId: string;
      initiatorCards?: any[];
      receiverCards?: any[];
      tradeType?: "private" | "public";
    },
    { rejectWithValue }
  ) => {
    try {
      const trade = await api.createTrade(data);
      return trade;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateTradeStatus = createAsyncThunk(
  "trades/updateStatus",
  async (
    { tradeId, status }: { tradeId: string; status: TradeStatus },
    { rejectWithValue }
  ) => {
    try {
      return await api.updateTradeStatus(tradeId, status);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);


const tradesSlice = createSlice({
  name: "trades",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserTrades.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserTrades.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload as Trade[];
      })
      .addCase(fetchUserTrades.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? action.error.message ?? "Error al cargar intercambios";
      })
      .addCase(createTrade.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTrade.fulfilled, (state, action) => {
        state.loading = false;
        state.list.push(action.payload as Trade);
      })
      .addCase(createTrade.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? action.error.message ?? "Error creando intercambio";
      })
      .addCase(updateTradeStatus.fulfilled, (state, action) => {
        const updated: any = action.payload;
        const targetId = updated.id ?? updated.tradeId;
        const trade = state.list.find((t) => t.id === targetId);
        if (trade && updated.status) {
          trade.status = updated.status as TradeStatus;
        }
      });
  },
});

export default tradesSlice.reducer
