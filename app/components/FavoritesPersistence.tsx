"use client";

import { useEffect, useRef } from "react";
import { FAVORITES_MOVIES_STORAGE_KEY, FAVORITES_STORAGE_KEY } from "@/lib/constants";
import type { MovieSummary } from "@/lib/types";
import { favoritesActions } from "@/store/favoritesSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { moviesActions } from "@/store/moviesSlice";

function normalizeFavoriteIds(rawValue: unknown): number[] {
  if (!Array.isArray(rawValue)) {
    return [];
  }

  return Array.from(new Set(rawValue.filter((id): id is number => Number.isInteger(id) && id > 0)));
}

function isMovieSummary(rawValue: unknown): rawValue is MovieSummary {
  if (typeof rawValue !== "object" || rawValue === null) {
    return false;
  }

  const movie = rawValue as Partial<MovieSummary>;
  const id = movie.id;
  return (
    typeof id === "number" &&
    Number.isInteger(id) &&
    id > 0 &&
    typeof movie.title === "string" &&
    typeof movie.overview === "string" &&
    (typeof movie.posterUrl === "string" || movie.posterUrl === null) &&
    (typeof movie.releaseDate === "string" || movie.releaseDate === null) &&
    ((typeof movie.voteAverage === "number" && Number.isFinite(movie.voteAverage)) || movie.voteAverage === null)
  );
}

function normalizeFavoriteMovies(rawValue: unknown): MovieSummary[] {
  if (!Array.isArray(rawValue)) {
    return [];
  }

  const moviesById = new Map<number, MovieSummary>();
  for (const movie of rawValue) {
    if (isMovieSummary(movie)) {
      moviesById.set(movie.id, movie);
    }
  }

  return Array.from(moviesById.values());
}

export function FavoritesPersistence() {
  const dispatch = useAppDispatch();
  const favoriteIds = useAppSelector((state) => state.favorites.ids);
  const movieEntities = useAppSelector((state) => state.movies.entities);
  const hydratedRef = useRef(false);
  const lastSerializedMoviesRef = useRef<string | null>(null);

  useEffect(() => {
    let favoriteIdsFromStorage: number[] = [];
    let favoriteMoviesFromStorage: MovieSummary[] = [];

    try {
      const rawFavoriteIds = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (rawFavoriteIds) {
        favoriteIdsFromStorage = normalizeFavoriteIds(JSON.parse(rawFavoriteIds));
      }
    } catch {
      favoriteIdsFromStorage = [];
    }

    try {
      const rawFavoriteMovies = localStorage.getItem(FAVORITES_MOVIES_STORAGE_KEY);
      if (rawFavoriteMovies) {
        favoriteMoviesFromStorage = normalizeFavoriteMovies(JSON.parse(rawFavoriteMovies));
      }
    } catch {
      favoriteMoviesFromStorage = [];
    } finally {
      if (favoriteIdsFromStorage.length > 0 && favoriteMoviesFromStorage.length > 0) {
        const favoriteIdSet = new Set(favoriteIdsFromStorage);
        favoriteMoviesFromStorage = favoriteMoviesFromStorage.filter((movie) => favoriteIdSet.has(movie.id));
      }

      if (favoriteIdsFromStorage.length > 0 && favoriteMoviesFromStorage.length > 0) {
        dispatch(moviesActions.hydrateMovieEntities(favoriteMoviesFromStorage));
      }
      if (favoriteIdsFromStorage.length > 0) {
        dispatch(favoritesActions.hydrateFavorites(favoriteIdsFromStorage));
      }
      hydratedRef.current = true;
    }
  }, [dispatch]);

  useEffect(() => {
    if (!hydratedRef.current) {
      return;
    }

    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
    } catch {
      return;
    }
  }, [favoriteIds]);

  useEffect(() => {
    if (!hydratedRef.current) {
      return;
    }

    const favoriteMovies = favoriteIds
      .map((id) => movieEntities[id])
      .filter((movie): movie is MovieSummary => Boolean(movie) && movie.id > 0);
    const serializedFavoriteMovies = JSON.stringify(favoriteMovies);

    if (serializedFavoriteMovies === lastSerializedMoviesRef.current) {
      return;
    }

    lastSerializedMoviesRef.current = serializedFavoriteMovies;

    try {
      localStorage.setItem(FAVORITES_MOVIES_STORAGE_KEY, serializedFavoriteMovies);
    } catch {
      return;
    }
  }, [favoriteIds, movieEntities]);

  return null;
}
