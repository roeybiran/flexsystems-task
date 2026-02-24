import { notFound } from "next/navigation";
import { MovieDetailsView } from "@/app/components/MovieDetailsView";

interface MoviePageProps {
  params: Promise<{ id: string }>;
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = await params;
  const movieId = Number(id);

  if (!Number.isFinite(movieId) || movieId <= 0) {
    notFound();
  }

  return <MovieDetailsView movieId={Math.floor(movieId)} />;
}
