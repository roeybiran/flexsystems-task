import { API_TIMEOUT_MS } from "@/lib/constants";
import type { MovieDetails, MovieSummary, PagedMoviesResponse } from "@/lib/types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/w1280";

function ensureCredentials() {
  const readToken = process.env.TMDB_API_READ_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;

  if (!readToken && !apiKey) {
    throw new Error("Missing TMDB credentials. Set TMDB_API_READ_TOKEN or TMDB_API_KEY.");
  }

  return { readToken, apiKey };
}

function toNumberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toStringOrNull(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function toPosterUrl(posterPath: unknown) {
  const path = toStringOrNull(posterPath);
  return path ? `${TMDB_POSTER_BASE_URL}${path}` : null;
}

function toBackdropUrl(backdropPath: unknown) {
  const path = toStringOrNull(backdropPath);
  return path ? `${TMDB_BACKDROP_BASE_URL}${path}` : null;
}

function normalizeTitle(value: unknown) {
  const title = toStringOrNull(value);
  return title ?? "Untitled movie";
}

function mapMovieSummary(rawMovie: unknown): MovieSummary {
  const source = typeof rawMovie === "object" && rawMovie ? rawMovie : {};

  return {
    id: typeof (source as { id?: unknown }).id === "number" ? (source as { id: number }).id : -1,
    title: normalizeTitle((source as { title?: unknown; name?: unknown }).title ?? (source as { name?: unknown }).name),
    overview: toStringOrNull((source as { overview?: unknown }).overview) ?? "No overview available.",
    posterUrl: toPosterUrl((source as { poster_path?: unknown }).poster_path),
    releaseDate:
      toStringOrNull((source as { release_date?: unknown }).release_date) ??
      toStringOrNull((source as { first_air_date?: unknown }).first_air_date),
    voteAverage: toNumberOrNull((source as { vote_average?: unknown }).vote_average),
  };
}

function mapMovieDetails(rawMovie: unknown): MovieDetails {
  const summary = mapMovieSummary(rawMovie);
  const source = typeof rawMovie === "object" && rawMovie ? rawMovie : {};

  const genresRaw = Array.isArray((source as { genres?: unknown }).genres)
    ? ((source as { genres: Array<{ name?: unknown }> }).genres ?? [])
    : [];

  return {
    ...summary,
    backdropUrl: toBackdropUrl((source as { backdrop_path?: unknown }).backdrop_path),
    runtime: toNumberOrNull((source as { runtime?: unknown }).runtime),
    genres: genresRaw
      .map((genre) => toStringOrNull(genre?.name))
      .filter((genre): genre is string => Boolean(genre)),
    tagline: toStringOrNull((source as { tagline?: unknown }).tagline),
  };
}

async function tmdbRequest(pathname: string, params?: Record<string, string | number>) {
  const { readToken, apiKey } = ensureCredentials();

  const url = new URL(`${TMDB_BASE_URL}${pathname}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
  }

  if (apiKey && !readToken) {
    url.searchParams.set("api_key", apiKey);
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (readToken) {
    headers.Authorization = `Bearer ${readToken}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`TMDB request failed with status ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("TMDB request timed out.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function sanitizePage(rawPage: string | null) {
  const parsed = Number(rawPage);
  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.max(1, Math.floor(parsed));
}

function mapPagedMoviesResponse(payload: unknown, pageFallback: number): PagedMoviesResponse {
  const source = typeof payload === "object" && payload ? payload : {};
  const rawResults = Array.isArray((source as { results?: unknown }).results)
    ? ((source as { results: unknown[] }).results ?? [])
    : [];

  const results = rawResults
    .map(mapMovieSummary)
    .filter((movie) => movie.id > 0);

  const totalPagesRaw = (source as { total_pages?: unknown }).total_pages;
  const totalPages =
    typeof totalPagesRaw === "number" && Number.isFinite(totalPagesRaw)
      ? Math.max(1, Math.floor(totalPagesRaw))
      : 1;

  const pageRaw = (source as { page?: unknown }).page;
  const page =
    typeof pageRaw === "number" && Number.isFinite(pageRaw)
      ? Math.max(1, Math.floor(pageRaw))
      : pageFallback;

  return {
    page,
    totalPages,
    results,
  };
}

export async function getPopularMovies(pageInput: string | null) {
  const page = sanitizePage(pageInput);
  const payload = await tmdbRequest("/movie/popular", { page });
  return mapPagedMoviesResponse(payload, page);
}

export async function getAiringNowMovies(pageInput: string | null) {
  const page = sanitizePage(pageInput);
  const payload = await tmdbRequest("/movie/now_playing", { page });
  return mapPagedMoviesResponse(payload, page);
}

export async function getSearchMovies(queryInput: string | null) {
  const query = typeof queryInput === "string" ? queryInput.trim() : "";

  if (query.length < 2) {
    return {
      query,
      results: [],
    };
  }

  const payload = await tmdbRequest("/search/movie", {
    query,
    include_adult: "false",
  });

  const mapped = mapPagedMoviesResponse(payload, 1);

  return {
    query,
    results: mapped.results,
  };
}

export async function getMovieDetails(movieId: string) {
  const parsedId = Number(movieId);

  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    throw new Error("Invalid movie id.");
  }

  const payload = await tmdbRequest(`/movie/${Math.floor(parsedId)}`);
  const details = mapMovieDetails(payload);

  if (details.id <= 0) {
    throw new Error("Movie details response is missing a valid id.");
  }

  return details;
}
