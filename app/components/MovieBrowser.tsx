"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORY_FOCUS_DELAY_MS, GRID_COLUMNS } from "@/lib/constants";
import type { CategoryFilter, FilterOption, MovieSummary } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { moviesActions } from "@/store/moviesSlice";
import { MovieCard } from "@/app/components/MovieCard";
import { PaginationControls } from "@/app/components/PaginationControls";

type FocusZone = "filters" | "search" | "grid" | "pagination";

const CONTROL_ORDER: Array<FilterOption | "search"> = ["popular", "airingNow", "favorites", "search"];

export function MovieBrowser() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const moviesState = useAppSelector((state) => state.movies);
  const favoriteIds = useAppSelector((state) => state.favorites.ids);
  const lastFocusedMovieId = useAppSelector((state) => state.movies.lastFocusedMovieId);

  const [focusZone, setFocusZone] = useState<FocusZone>("filters");
  const [focusedControlIndex, setFocusedControlIndex] = useState(0);
  const [focusedCardIndex, setFocusedCardIndex] = useState(0);
  const [focusedPaginationIndex, setFocusedPaginationIndex] = useState(0);

  const categoryFocusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popularButtonRef = useRef<HTMLButtonElement | null>(null);
  const airingNowButtonRef = useRef<HTMLButtonElement | null>(null);
  const favoritesButtonRef = useRef<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const previousPageRef = useRef<HTMLButtonElement | null>(null);
  const nextPageRef = useRef<HTMLButtonElement | null>(null);
  const initializedFocusRef = useRef(false);

  const searchIsActive = moviesState.search.query.trim().length >= 2;

  const visibleMovieIds = useMemo(() => {
    if (searchIsActive) {
      return moviesState.search.resultIds;
    }

    if (moviesState.activeFilter === "favorites") {
      return favoriteIds;
    }

    const categoryState = moviesState.categories[moviesState.activeFilter];
    return categoryState.pageToMovieIds[categoryState.page] ?? [];
  }, [
    favoriteIds,
    moviesState.activeFilter,
    moviesState.categories,
    moviesState.search.resultIds,
    searchIsActive,
  ]);

  const visibleMovies = useMemo<MovieSummary[]>(() => {
    return visibleMovieIds
      .map((id) =>
        moviesState.entities[id]
          ? moviesState.entities[id]
          : {
              id,
              title: `Movie #${id}`,
              overview: "No cached data. Open details to load this movie.",
              posterUrl: null,
              releaseDate: null,
              voteAverage: null,
            },
      )
      .filter((movie) => movie.id > 0);
  }, [visibleMovieIds, moviesState.entities]);

  const activeCategoryState =
    moviesState.activeFilter === "popular" || moviesState.activeFilter === "airingNow"
      ? moviesState.categories[moviesState.activeFilter]
      : null;

  const paginationVisible = Boolean(activeCategoryState && !searchIsActive);
  const loading = searchIsActive ? moviesState.search.loading : activeCategoryState?.loading ?? false;
  const error = searchIsActive ? moviesState.search.error : activeCategoryState?.error ?? null;

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const clearCategoryFocusTimer = () => {
    if (categoryFocusTimerRef.current) {
      clearTimeout(categoryFocusTimerRef.current);
      categoryFocusTimerRef.current = null;
    }
  };

  const requestCategory = (category: CategoryFilter, page: number) => {
    dispatch(moviesActions.requestCategoryPage({ category, page }));
  };

  const activateFilter = (filter: FilterOption) => {
    clearCategoryFocusTimer();
    const wasActiveFilter = moviesState.activeFilter === filter;
    dispatch(moviesActions.setFocusedFilter(filter));
    dispatch(moviesActions.setActiveFilter(filter));

    if (filter === "popular" || filter === "airingNow") {
      const page = moviesState.categories[filter].page;
      const hasCachedPage = (moviesState.categories[filter].pageToMovieIds[page]?.length ?? 0) > 0;
      if (!wasActiveFilter || !hasCachedPage) {
        requestCategory(filter, page);
      }
    }
  };

  const scheduleFilterActivationFromFocus = (filter: FilterOption) => {
    clearCategoryFocusTimer();

    if (filter !== "popular" && filter !== "airingNow") {
      return;
    }

    if (filter === moviesState.activeFilter) {
      return;
    }

    categoryFocusTimerRef.current = setTimeout(() => {
      dispatch(moviesActions.setActiveFilter(filter));
      const page = moviesState.categories[filter].page;
      requestCategory(filter, page);
    }, CATEGORY_FOCUS_DELAY_MS);
  };

  const goToMovieDetails = (movieId: number) => {
    dispatch(moviesActions.setLastFocusedMovieId(movieId));
    router.push(`/movie/${movieId}`);
  };

  const focusControl = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, CONTROL_ORDER.length - 1));
    const target = CONTROL_ORDER[clampedIndex];

    if (target === "popular") {
      popularButtonRef.current?.focus();
    } else if (target === "airingNow") {
      airingNowButtonRef.current?.focus();
    } else if (target === "favorites") {
      favoritesButtonRef.current?.focus();
    } else {
      searchInputRef.current?.focus();
    }
  };

  const focusCard = (index: number) => {
    if (visibleMovies.length === 0) {
      return;
    }

    const clampedIndex = Math.max(0, Math.min(index, visibleMovies.length - 1));
    setFocusedCardIndex(clampedIndex);
    setFocusZone("grid");

    const targetCard = cardRefs.current[clampedIndex];
    if (targetCard) {
      targetCard.focus();
      targetCard.scrollIntoView({ block: "center", inline: "nearest" });
    }
  };

  const focusPagination = (index: number) => {
    if (!paginationVisible) {
      return;
    }

    const targetIndex = index <= 0 ? 0 : 1;
    setFocusedPaginationIndex(targetIndex);
    setFocusZone("pagination");

    if (targetIndex === 0) {
      previousPageRef.current?.focus();
    } else {
      nextPageRef.current?.focus();
    }
  };

  const applyPageDelta = (delta: number) => {
    if (!activeCategoryState || moviesState.activeFilter === "favorites") {
      return;
    }

    const category = moviesState.activeFilter as CategoryFilter;
    const nextPage = Math.max(1, Math.min(activeCategoryState.page + delta, activeCategoryState.totalPages));
    if (nextPage === activeCategoryState.page) {
      return;
    }

    dispatch(moviesActions.setCategoryPage({ category, page: nextPage }));
    requestCategory(category, nextPage);
    setFocusedCardIndex(0);
  };

  const handleCategoryFocus = (filter: FilterOption, index: number) => {
    setFocusZone("filters");
    setFocusedControlIndex(index);
    dispatch(moviesActions.setFocusedFilter(filter));
    scheduleFilterActivationFromFocus(filter);
  };

  const handleKeyNavigation = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Tab") {
      event.preventDefault();
      return;
    }

    if (![
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Enter",
      "Escape",
    ].includes(event.key)) {
      return;
    }

    const isSearchFocused = document.activeElement === searchInputRef.current;
    if (isSearchFocused && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      return;
    }

    event.preventDefault();

    if (event.key === "Escape") {
      clearCategoryFocusTimer();
      if (moviesState.search.query.length > 0) {
        dispatch(moviesActions.setSearchQuery(""));
      }
      focusControl(0);
      return;
    }

    if (focusZone === "filters" || focusZone === "search") {
      if (event.key === "ArrowRight") {
        const nextIndex = Math.min(CONTROL_ORDER.length - 1, focusedControlIndex + 1);
        setFocusedControlIndex(nextIndex);
        focusControl(nextIndex);
        return;
      }

      if (event.key === "ArrowLeft") {
        const previousIndex = Math.max(0, focusedControlIndex - 1);
        setFocusedControlIndex(previousIndex);
        focusControl(previousIndex);
        return;
      }

      if (event.key === "ArrowDown") {
        if (visibleMovies.length > 0) {
          focusCard(focusedCardIndex);
        } else if (paginationVisible) {
          focusPagination(0);
        }
        return;
      }

      if (event.key === "Enter") {
        const focusedControl = CONTROL_ORDER[focusedControlIndex];
        if (focusedControl !== "search") {
          activateFilter(focusedControl);
        }
      }

      return;
    }

    if (focusZone === "grid") {
      if (visibleMovies.length === 0) {
        focusControl(0);
        return;
      }

      if (event.key === "ArrowRight") {
        focusCard(focusedCardIndex + 1);
        return;
      }

      if (event.key === "ArrowLeft") {
        focusCard(focusedCardIndex - 1);
        return;
      }

      if (event.key === "ArrowDown") {
        const nextRowIndex = focusedCardIndex + GRID_COLUMNS;
        if (nextRowIndex < visibleMovies.length) {
          focusCard(nextRowIndex);
        } else if (paginationVisible) {
          focusPagination(0);
        }
        return;
      }

      if (event.key === "ArrowUp") {
        const previousRowIndex = focusedCardIndex - GRID_COLUMNS;
        if (previousRowIndex >= 0) {
          focusCard(previousRowIndex);
        } else {
          focusControl(focusedControlIndex);
        }
        return;
      }

      if (event.key === "Enter") {
        const movie = visibleMovies[focusedCardIndex];
        if (movie) {
          goToMovieDetails(movie.id);
        }
      }

      return;
    }

    if (focusZone === "pagination") {
      if (event.key === "ArrowLeft") {
        focusPagination(0);
        return;
      }

      if (event.key === "ArrowRight") {
        focusPagination(1);
        return;
      }

      if (event.key === "ArrowUp") {
        if (visibleMovies.length > 0) {
          focusCard(Math.min(focusedCardIndex, visibleMovies.length - 1));
        } else {
          focusControl(0);
        }
        return;
      }

      if (event.key === "Enter") {
        if (focusedPaginationIndex === 0) {
          applyPageDelta(-1);
        } else {
          applyPageDelta(1);
        }
      }
    }
  };

  useEffect(() => {
    dispatch(moviesActions.requestCategoryPage({ category: "popular", page: 1 }));

    return () => {
      if (categoryFocusTimerRef.current) {
        clearTimeout(categoryFocusTimerRef.current);
        categoryFocusTimerRef.current = null;
      }
    };
  }, [dispatch]);

  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, visibleMovies.length);

    if (visibleMovies.length === 0) {
      const rafId = requestAnimationFrame(() => {
        setFocusedCardIndex(0);
      });
      return () => cancelAnimationFrame(rafId);
    }

    if (focusedCardIndex >= visibleMovies.length) {
      const rafId = requestAnimationFrame(() => {
        setFocusedCardIndex(visibleMovies.length - 1);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [focusedCardIndex, visibleMovies.length]);

  useEffect(() => {
    if (!paginationVisible || focusZone !== "pagination") {
      return;
    }

    const rafId = requestAnimationFrame(() => {
      if (visibleMovies.length > 0) {
        const targetCard = cardRefs.current[0];
        setFocusedCardIndex(0);
        setFocusZone("grid");
        targetCard?.focus();
        targetCard?.scrollIntoView({ block: "center", inline: "nearest" });
      } else {
        setFocusedControlIndex(0);
        setFocusZone("filters");
        popularButtonRef.current?.focus();
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [focusZone, paginationVisible, visibleMovies.length]);

  useEffect(() => {
    if (initializedFocusRef.current) {
      return;
    }

    if (lastFocusedMovieId !== null && visibleMovies.length === 0) {
      return;
    }

    const rafId = requestAnimationFrame(() => {
      const restoreIndex =
        lastFocusedMovieId === null ? -1 : visibleMovies.findIndex((movie) => movie.id === lastFocusedMovieId);

      if (restoreIndex >= 0) {
        setFocusedCardIndex(restoreIndex);
        setFocusZone("grid");
        const targetCard = cardRefs.current[restoreIndex];
        targetCard?.focus();
        targetCard?.scrollIntoView({ block: "center", inline: "nearest" });
      } else {
        popularButtonRef.current?.focus();
      }

      initializedFocusRef.current = true;
    });

    return () => cancelAnimationFrame(rafId);
  }, [lastFocusedMovieId, visibleMovies]);

  return (
    <div className="flex h-screen flex-col gap-3 overflow-hidden p-3 md:p-4" onKeyDown={handleKeyNavigation}>
      <header className="flex flex-col gap-3">
        <div
          className="grid grid-cols-1 gap-2 md:grid-cols-[200px_200px_220px_minmax(280px,1fr)]"
          role="group"
          aria-label="Movie category filters"
        >
          <Button
            ref={popularButtonRef}
            type="button"
            variant={moviesState.activeFilter === "popular" ? "default" : "secondary"}
            className="justify-start"
            onFocus={() => handleCategoryFocus("popular", 0)}
            onClick={() => activateFilter("popular")}
            tabIndex={-1}
          >
            Popular
          </Button>

          <Button
            ref={airingNowButtonRef}
            type="button"
            variant={moviesState.activeFilter === "airingNow" ? "default" : "secondary"}
            className="justify-start"
            onFocus={() => handleCategoryFocus("airingNow", 1)}
            onClick={() => activateFilter("airingNow")}
            tabIndex={-1}
          >
            Airing Now
          </Button>

          <Button
            ref={favoritesButtonRef}
            type="button"
            variant={moviesState.activeFilter === "favorites" ? "default" : "secondary"}
            className="justify-start"
            onFocus={() => handleCategoryFocus("favorites", 2)}
            onClick={() => activateFilter("favorites")}
            tabIndex={-1}
          >
            My Favorites ({favoriteIds.length})
          </Button>

          <Input
            ref={searchInputRef}
            value={moviesState.search.query}
            onFocus={() => {
              setFocusZone("search");
              setFocusedControlIndex(3);
              clearCategoryFocusTimer();
            }}
            onChange={(event) => {
              dispatch(moviesActions.setSearchQuery(event.target.value));
            }}
            placeholder="Search movies"
            aria-label="Search movies"
          />
        </div>

        <div className="flex flex-col justify-between gap-1 md:flex-row md:items-center">
          <p className="text-sm font-medium">
            {searchIsActive
              ? `Search results for "${moviesState.search.query.trim()}"`
              : moviesState.activeFilter === "favorites"
                ? "My Favorites"
                : moviesState.activeFilter === "popular"
                  ? "Popular Movies"
                  : "Airing Now"}
          </p>
          <p className="text-muted-foreground font-mono text-xs">
            Use Arrow Keys + Enter + Escape. Tab is disabled.
          </p>
        </div>
      </header>

      {error ? (
        <Alert variant="destructive" className="w-fit text-sm">
          <AlertTitle>Request failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid flex-1 grid-cols-4 auto-rows-[minmax(290px,auto)] content-start gap-3 overflow-y-auto pr-1" aria-live="polite">
        {visibleMovies.map((movie, index) => (
          <MovieCard
            key={movie.id}
            ref={(element) => {
              cardRefs.current[index] = element;
            }}
            movie={movie}
            isFavorite={favoriteIdSet.has(movie.id)}
            isFocused={focusZone === "grid" && focusedCardIndex === index}
            onFocus={() => {
              setFocusZone("grid");
              setFocusedCardIndex(index);
              dispatch(moviesActions.setLastFocusedMovieId(movie.id));
            }}
            onActivate={() => goToMovieDetails(movie.id)}
          />
        ))}

        {!loading && visibleMovies.length === 0 ? (
          <div className="text-muted-foreground col-span-4 rounded-xl border border-dashed px-6 py-8 text-center text-sm">
            No movies found for the selected criteria.
          </div>
        ) : null}
      </section>

      {loading ? <p className="text-muted-foreground text-sm">Loading movies...</p> : null}

      {paginationVisible && activeCategoryState ? (
        <PaginationControls
          page={activeCategoryState.page}
          totalPages={activeCategoryState.totalPages}
          focusedIndex={focusZone === "pagination" ? focusedPaginationIndex : -1}
          onFocusIndex={(index) => {
            setFocusZone("pagination");
            setFocusedPaginationIndex(index);
          }}
          onPrevious={() => applyPageDelta(-1)}
          onNext={() => applyPageDelta(1)}
          previousDisabled={activeCategoryState.page <= 1}
          nextDisabled={activeCategoryState.page >= activeCategoryState.totalPages}
          previousRef={previousPageRef}
          nextRef={nextPageRef}
        />
      ) : null}

      <footer>
        <p className="text-muted-foreground font-mono text-xs">
          Press Escape to clear search and return focus to Popular.
        </p>
      </footer>
    </div>
  );
}
