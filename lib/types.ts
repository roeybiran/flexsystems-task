export type CategoryFilter = "popular" | "airingNow";

export type FilterOption = CategoryFilter | "favorites";

export interface MovieSummary {
  id: number;
  title: string;
  overview: string;
  posterUrl: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
}

export interface MovieDetails extends MovieSummary {
  backdropUrl: string | null;
  runtime: number | null;
  genres: string[];
  tagline: string | null;
}

export interface PagedMoviesResponse {
  page: number;
  totalPages: number;
  results: MovieSummary[];
}

export interface SearchMoviesResponse {
  query: string;
  results: MovieSummary[];
}
