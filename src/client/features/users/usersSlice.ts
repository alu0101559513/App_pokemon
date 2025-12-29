import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '../../types';
import api from '../../services/apiService';

interface UsersState {
  currentUser: User | null;
  friends: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  currentUser: null,
  friends: [],
  loading: false,
  error: null,
};

export const fetchUserById = createAsyncThunk(
  'users/fetchById',
  async (userId: string) => {
    const user = await api.getUserById(userId);
    if (!user) throw new Error('Error fetching user');
    return user;
  }
);

export const fetchUserFriends = createAsyncThunk(
  'users/fetchFriends',
  async (userId: string) => {
    return await api.getUserFriends(userId);
  }
);

// Agregar amigo
export const addFriend = createAsyncThunk(
  'users/addFriend',
  async ({ userId, friendId }: { userId: string; friendId: string }) => {
    const friend = await api.addFriend(userId, friendId);
    if (!friend) throw new Error('Error adding friend');
    return friend;
  }
);

export const removeFriend = createAsyncThunk(
  'users/removeFriend',
  async ({ userId, friendId }: { userId: string; friendId: string }) => {
    const success = await api.removeFriend(userId, friendId);
    if (!success) throw new Error('Error removing friend');
    return friendId;
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    logoutUser(state) {
      state.currentUser = null;
      state.friends = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Error al cargar usuario';
      })
      .addCase(fetchUserFriends.fulfilled, (state, action) => {
        state.friends = action.payload;
      })
      .addCase(addFriend.fulfilled, (state, action) => {
        state.friends.push(action.payload);
      })
      .addCase(removeFriend.fulfilled, (state, action) => {
        state.friends = state.friends.filter((f) => f.id !== action.payload);
      });
  },
});

export const { logoutUser } = usersSlice.actions;
export default usersSlice.reducer;
