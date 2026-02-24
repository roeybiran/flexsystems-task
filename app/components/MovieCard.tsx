"use client";

import { forwardRef } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MovieSummary } from "@/lib/types";

interface MovieCardProps {
  movie: MovieSummary;
  isFavorite: boolean;
  isFocused: boolean;
  onFocus: () => void;
  onActivate: () => void;
}

export const MovieCard = forwardRef<HTMLButtonElement, MovieCardProps>(function MovieCard(
  { movie, isFavorite, isFocused, onFocus, onActivate },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className="h-full text-left focus-visible:outline-none"
      onFocus={onFocus}
      onClick={onActivate}
      aria-label={`Open details for ${movie.title}`}
      tabIndex={-1}
    >
      <Card
        className={cn(
          "h-full overflow-hidden",
          isFocused && "ring-ring ring-2",
        )}
      >
        <div className="bg-muted relative h-52 w-full">
          {movie.posterUrl ? (
            <Image
              className="object-cover"
              src={movie.posterUrl}
              alt={`${movie.title} poster`}
              fill
              sizes="(max-width: 1200px) 25vw, 18vw"
            />
          ) : (
            <div className="text-muted-foreground grid h-full place-items-center text-sm">No Image</div>
          )}
          {isFavorite ? <Badge variant="secondary" className="absolute right-2 top-2">Favorite</Badge> : null}
        </div>

        <CardContent className="space-y-2 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight">{movie.title}</h3>
          <p className="text-muted-foreground font-mono text-[11px]">
            {movie.releaseDate ? movie.releaseDate : "Unknown date"}
            {movie.voteAverage !== null ? ` • ${movie.voteAverage.toFixed(1)}` : ""}
          </p>
          <p className="text-foreground/85 line-clamp-3 text-xs leading-5">{movie.overview}</p>
        </CardContent>
      </Card>
    </button>
  );
});
