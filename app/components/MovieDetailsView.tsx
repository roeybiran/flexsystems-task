"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { favoritesActions } from "@/store/favoritesSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { moviesActions } from "@/store/moviesSlice";

interface MovieDetailsViewProps {
  movieId: number;
}

export function MovieDetailsView({ movieId }: MovieDetailsViewProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const detailsState = useAppSelector((state) => state.movies.detailsById[movieId]);
  const fallbackMovie = useAppSelector((state) => state.movies.entities[movieId]);
  const favoriteIds = useAppSelector((state) => state.favorites.ids);

  const isFavorite = favoriteIds.includes(movieId);

  const backButtonRef = useRef<HTMLButtonElement | null>(null);
  const favoriteButtonRef = useRef<HTMLButtonElement | null>(null);
  const detailsScrollRef = useRef<HTMLDivElement | null>(null);
  const [focusedAction, setFocusedAction] = useState<0 | 1>(0);

  const title = detailsState?.data?.title ?? fallbackMovie?.title ?? `Movie #${movieId}`;
  const posterUrl = detailsState?.data?.posterUrl ?? fallbackMovie?.posterUrl ?? null;
  const backdropUrl = detailsState?.data?.backdropUrl ?? null;
  const overview = detailsState?.data?.overview ?? fallbackMovie?.overview ?? "No overview available.";
  const runtime = detailsState?.data?.runtime ?? null;
  const genres = detailsState?.data?.genres ?? [];
  const releaseDate = detailsState?.data?.releaseDate ?? fallbackMovie?.releaseDate ?? null;
  const voteAverage = detailsState?.data?.voteAverage ?? fallbackMovie?.voteAverage ?? null;
  const tagline = detailsState?.data?.tagline ?? null;

  const detailMeta = useMemo(() => {
    const values: string[] = [];

    if (releaseDate) {
      values.push(releaseDate);
    }

    if (runtime) {
      values.push(`${runtime} min`);
    }

    if (voteAverage !== null) {
      values.push(`Rating ${voteAverage.toFixed(1)}`);
    }

    return values.join(" • ");
  }, [releaseDate, runtime, voteAverage]);

  const navigateHome = () => {
    router.push("/");
  };

  const scrollDetails = (deltaPixels: number) => {
    detailsScrollRef.current?.scrollBy({ top: deltaPixels });
  };

  const focusAction = (index: 0 | 1) => {
    setFocusedAction(index);

    if (index === 0) {
      backButtonRef.current?.focus();
    } else {
      favoriteButtonRef.current?.focus();
    }
  };

  const handleKeyboardNavigation = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Tab") {
      event.preventDefault();
      return;
    }

    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", "Escape"].includes(event.key)) {
      return;
    }

    event.preventDefault();

    if (event.key === "ArrowDown") {
      scrollDetails(220);
      return;
    }

    if (event.key === "ArrowUp") {
      scrollDetails(-220);
      return;
    }

    if (event.key === "Escape" || event.key === "ArrowLeft") {
      navigateHome();
      return;
    }

    if (event.key === "ArrowRight") {
      focusAction(focusedAction === 0 ? 1 : 0);
      return;
    }

    if (event.key === "Enter") {
      if (focusedAction === 0) {
        navigateHome();
      } else {
        dispatch(favoritesActions.toggleFavorite(movieId));
      }
    }
  };

  useEffect(() => {
    dispatch(moviesActions.requestMovieDetails(movieId));
    backButtonRef.current?.focus();
  }, [dispatch, movieId]);

  return (
    <main className="bg-background flex h-screen flex-col overflow-hidden" onKeyDown={handleKeyboardNavigation}>
      <div className="relative h-[32vh] min-h-[220px] max-h-[340px] w-full overflow-hidden">
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt="Movie backdrop"
            className="object-cover"
            fill
            priority
            sizes="100vw"
          />
        ) : (
          <div className="bg-muted h-full w-full" />
        )}
      </div>

      <section className="flex min-h-0 flex-1 flex-col gap-4 p-3 md:p-5">
        <div className="flex flex-wrap gap-2">
          <Button
            ref={backButtonRef}
            type="button"
            variant="outline"
            className={cn(focusedAction === 0 && "ring-ring ring-2")}
            onFocus={() => setFocusedAction(0)}
            onClick={navigateHome}
            tabIndex={-1}
          >
            Back
          </Button>

          <Button
            ref={favoriteButtonRef}
            type="button"
            variant={isFavorite ? "default" : "secondary"}
            className={cn(focusedAction === 1 && "ring-ring ring-2")}
            onFocus={() => setFocusedAction(1)}
            onClick={() => dispatch(favoritesActions.toggleFavorite(movieId))}
            tabIndex={-1}
          >
            {isFavorite ? "Remove From Favorites" : "Add To Favorites"}
          </Button>
        </div>

        <div ref={detailsScrollRef} className="grid min-h-0 flex-1 gap-4 overflow-y-auto md:grid-cols-[260px_1fr]">
          <Card className="h-fit overflow-hidden">
            <CardContent className="p-0">
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={`${title} poster`}
                  className="h-auto w-full object-cover"
                  width={480}
                  height={720}
                  sizes="(max-width: 1000px) 100vw, 260px"
                />
              ) : (
                <div className="text-muted-foreground grid min-h-[380px] place-items-center">No Image</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
                {tagline ? <p className="text-muted-foreground italic">{tagline}</p> : null}
                {detailMeta ? <p className="text-muted-foreground font-mono text-sm">{detailMeta}</p> : null}
                {genres.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {genres.map((genre) => (
                      <Badge key={genre} variant="secondary">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>

              <p className="text-base leading-relaxed">{overview}</p>

              {detailsState?.loading ? <p className="text-muted-foreground text-sm">Loading movie details...</p> : null}
              {detailsState?.error ? (
                <Alert variant="destructive">
                  <AlertTitle>Failed to load details</AlertTitle>
                  <AlertDescription>{detailsState.error}</AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
