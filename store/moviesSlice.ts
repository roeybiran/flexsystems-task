import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CategoryFilter,
  FilterOption,
  MovieDetails,
  MovieSummary,
} from "@/lib/types";

interface CategoryState {
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  pageToMovieIds: Record<number, number[]>;
}

interface SearchState {
  query: string;
  loading: boolean;
  error: string | null;
  resultIds: number[];
}

interface MovieDetailsState {
  data: MovieDetails | null;
  loading: boolean;
  error: string | null;
}

export interface MoviesState {
  entities: Record<number, MovieSummary>;
  categories: Record<CategoryFilter, CategoryState>;
  activeFilter: FilterOption;
  focusedFilter: FilterOption;
  lastFocusedMovieId: number | null;
  search: SearchState;
  detailsById: Record<number, MovieDetailsState>;
}

interface CategoryPagePayload {
  category: CategoryFilter;
  page: number;
  force?: boolean;
}

interface CategoryPageSuccessPayload {
  category: CategoryFilter;
  page: number;
  totalPages: number;
  results: MovieSummary[];
}

interface CategoryPageFailurePayload {
  category: CategoryFilter;
  error: string;
}

interface SearchSuccessPayload {
  query: string;
  results: MovieSummary[];
}

interface MovieDetailsFailurePayload {
  movieId: number;
  error: string;
}

const createInitialCategoryState = (): CategoryState => ({
  page: 1,
  totalPages: 1,
  loading: false,
  error: null,
  pageToMovieIds: {},
});

const initialState: MoviesState = {
  entities: {},
  categories: {
    popular: createInitialCategoryState(),
    airingNow: createInitialCategoryState(),
  },
  activeFilter: "popular",
  focusedFilter: "popular",
  lastFocusedMovieId: null,
  search: {
    query: "",
    loading: false,
    error: null,
    resultIds: [],
  },
  detailsById: {},
};

function indexMovies(state: MoviesState, movies: MovieSummary[]) {
  for (const movie of movies) {
    state.entities[movie.id] = movie;
  }
}

export const moviesSlice = createSlice({
  name: "movies",
  initialState,
  reducers: {
    setActiveFilter(state, action: PayloadAction<FilterOption>) {
      state.activeFilter = action.payload;
    },
    setFocusedFilter(state, action: PayloadAction<FilterOption>) {
      state.focusedFilter = action.payload;
    },
    setLastFocusedMovieId(state, action: PayloadAction<number | null>) {
      state.lastFocusedMovieId = action.payload;
    },
    setCategoryPage(state, action: PayloadAction<{ category: CategoryFilter; page: number }>) {
      const { category, page } = action.payload;
      state.categories[category].page = Math.max(1, Math.floor(page));
    },
    requestCategoryPage(state, action: PayloadAction<CategoryPagePayload>) {
      const { category } = action.payload;
      state.categories[category].loading = true;
      state.categories[category].error = null;
    },
    receiveCategoryPageSuccess(state, action: PayloadAction<CategoryPageSuccessPayload>) {
      const { category, page, totalPages, results } = action.payload;
      const categoryState = state.categories[category];
      categoryState.loading = false;
      categoryState.error = null;
      categoryState.page = Math.max(1, Math.floor(page));
      categoryState.totalPages = Math.max(1, Math.floor(totalPages));
      categoryState.pageToMovieIds[page] = results.map((movie) => movie.id);
      indexMovies(state, results);
    },
    receiveCategoryPageFailure(state, action: PayloadAction<CategoryPageFailurePayload>) {
      const { category, error } = action.payload;
      state.categories[category].loading = false;
      state.categories[category].error = error;
    },
    hydrateMovieEntities(state, action: PayloadAction<MovieSummary[]>) {
      const validMovies = action.payload.filter((movie) => Number.isInteger(movie.id) && movie.id > 0);
      indexMovies(state, validMovies);
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.search.query = action.payload;

      if (action.payload.trim().length < 2) {
        state.search.loading = false;
        state.search.error = null;
        state.search.resultIds = [];
      }
    },
    clearSearchResults(state) {
      state.search.loading = false;
      state.search.error = null;
      state.search.resultIds = [];
    },
    requestSearch(state) {
      state.search.loading = true;
      state.search.error = null;
    },
    receiveSearchSuccess(state, action: PayloadAction<SearchSuccessPayload>) {
      const activeQuery = state.search.query.trim();
      if (activeQuery !== action.payload.query.trim()) {
        return;
      }

      state.search.loading = false;
      state.search.error = null;
      state.search.resultIds = action.payload.results.map((movie) => movie.id);
      indexMovies(state, action.payload.results);
    },
    receiveSearchFailure(state, action: PayloadAction<string>) {
      state.search.loading = false;
      state.search.error = action.payload;
    },
    requestMovieDetails(state, action: PayloadAction<number>) {
      const movieId = action.payload;
      const existing = state.detailsById[movieId];
      state.detailsById[movieId] = {
        data: existing?.data ?? null,
        loading: true,
        error: null,
      };
    },
    receiveMovieDetailsSuccess(state, action: PayloadAction<MovieDetails>) {
      const details = action.payload;
      state.detailsById[details.id] = {
        data: details,
        loading: false,
        error: null,
      };

      state.entities[details.id] = {
        id: details.id,
        title: details.title,
        overview: details.overview,
        posterUrl: details.posterUrl,
        releaseDate: details.releaseDate,
        voteAverage: details.voteAverage,
      };
    },
    receiveMovieDetailsFailure(state, action: PayloadAction<MovieDetailsFailurePayload>) {
      const { movieId, error } = action.payload;
      const existing = state.detailsById[movieId];
      state.detailsById[movieId] = {
        data: existing?.data ?? null,
        loading: false,
        error,
      };
    },
  },
});

export const moviesActions = moviesSlice.actions;
export const moviesReducer = moviesSlice.reducer;
