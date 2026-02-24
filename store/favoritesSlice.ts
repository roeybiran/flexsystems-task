import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface FavoritesState {
  ids: number[];
}

const initialState: FavoritesState = {
  ids: [],
};

export const favoritesSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    hydrateFavorites(state, action: PayloadAction<number[]>) {
      state.ids = Array.from(new Set(action.payload.filter((id) => Number.isInteger(id) && id > 0)));
    },
    toggleFavorite(state, action: PayloadAction<number>) {
      const movieId = action.payload;
      const existingIndex = state.ids.indexOf(movieId);

      if (existingIndex === -1) {
        state.ids.push(movieId);
        return;
      }

      state.ids.splice(existingIndex, 1);
    },
  },
});

export const favoritesActions = favoritesSlice.actions;
export const favoritesReducer = favoritesSlice.reducer;
