import { type PayloadAction } from "@reduxjs/toolkit";
import {
  call,
  debounce,
  delay,
  put,
  select,
  takeLatest,
  all,
  fork,
} from "redux-saga/effects";
import {
  fetchAiringNowMovies,
  fetchMovieDetails,
  fetchPopularMovies,
  searchMovies,
} from "@/lib/api-client";
import {
  SEARCH_DEBOUNCE_MS,
  SEARCH_MAX_REQUESTS,
  SEARCH_MIN_CHARS,
  SEARCH_WINDOW_MS,
} from "@/lib/constants";
import type { CategoryFilter, MovieDetails, MovieSummary } from "@/lib/types";
import { moviesActions } from "@/store/moviesSlice";
import type { RootState } from "@/store";

const searchRequestWindow: number[] = [];

function* enforceSearchRateLimit() {
  while (true) {
    const now = Date.now();

    while (searchRequestWindow.length > 0 && now - searchRequestWindow[0] >= SEARCH_WINDOW_MS) {
      searchRequestWindow.shift();
    }

    if (searchRequestWindow.length < SEARCH_MAX_REQUESTS) {
      searchRequestWindow.push(now);
      return;
    }

    const waitTime = SEARCH_WINDOW_MS - (now - searchRequestWindow[0]);
    if (waitTime > 0) {
      yield delay(waitTime);
    }
  }
}

function* handleCategoryRequest(
  action: PayloadAction<{ category: CategoryFilter; page: number; force?: boolean }>,
) {
  const { category, page } = action.payload;

  try {
    const response: { page: number; totalPages: number; results: MovieSummary[] } =
      category === "popular"
        ? yield call(fetchPopularMovies, page)
        : yield call(fetchAiringNowMovies, page);

    yield put(
      moviesActions.receiveCategoryPageSuccess({
        category,
        page: response.page,
        totalPages: response.totalPages,
        results: response.results,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load movies.";
    yield put(moviesActions.receiveCategoryPageFailure({ category, error: message }));
  }
}

function* handleSearchQueryUpdate(action: PayloadAction<string>) {
  const query = action.payload.trim();

  if (query.length < SEARCH_MIN_CHARS) {
    yield put(moviesActions.clearSearchResults());
    return;
  }

  yield put(moviesActions.requestSearch());

  try {
    yield call(enforceSearchRateLimit);
    const response: { query: string; results: MovieSummary[] } = yield call(searchMovies, query);
    yield put(moviesActions.receiveSearchSuccess({ query: response.query, results: response.results }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed.";
    yield put(moviesActions.receiveSearchFailure(message));
  }
}

function* handleMovieDetailsRequest(action: PayloadAction<number>) {
  const movieId = action.payload;

  const hasCachedDetails: boolean = yield select((state: RootState) => {
    const details = state.movies.detailsById[movieId];
    return Boolean(details?.data);
  });

  if (hasCachedDetails) {
    yield put(
      moviesActions.receiveMovieDetailsSuccess(
        (yield select((state: RootState) => state.movies.detailsById[movieId]?.data)) as MovieDetails,
      ),
    );
    return;
  }

  try {
    const details: MovieDetails = yield call(fetchMovieDetails, movieId);
    yield put(moviesActions.receiveMovieDetailsSuccess(details));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load movie details.";
    yield put(moviesActions.receiveMovieDetailsFailure({ movieId, error: message }));
  }
}

function* watchCategoryRequests() {
  yield takeLatest(moviesActions.requestCategoryPage.type, handleCategoryRequest);
}

function* watchSearchRequests() {
  yield debounce(SEARCH_DEBOUNCE_MS, moviesActions.setSearchQuery.type, handleSearchQueryUpdate);
}

function* watchMovieDetailsRequests() {
  yield takeLatest(moviesActions.requestMovieDetails.type, handleMovieDetailsRequest);
}

export function* rootSaga() {
  yield all([
    fork(watchCategoryRequests),
    fork(watchSearchRequests),
    fork(watchMovieDetailsRequests),
  ]);
}
