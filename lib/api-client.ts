import type {
  MovieDetails,
  PagedMoviesResponse,
  SearchMoviesResponse,
} from "@/lib/types";

function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(path, "http://localhost");

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return `${url.pathname}${url.search}`;
}

async function requestJson<T>(path: string, params?: Record<string, string | number | undefined>) {
  const response = await fetch(buildUrl(path, params), {
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload.error === "string"
        ? payload.error
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return payload as T;
}

export function fetchPopularMovies(page: number) {
  return requestJson<PagedMoviesResponse>("/api/movies/popular", { page });
}

export function fetchAiringNowMovies(page: number) {
  return requestJson<PagedMoviesResponse>("/api/movies/airing-now", { page });
}

export function searchMovies(query: string) {
  return requestJson<SearchMoviesResponse>("/api/movies/search", { query });
}

export function fetchMovieDetails(movieId: number) {
  return requestJson<MovieDetails>(`/api/movies/${movieId}`);
}
