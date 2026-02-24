import { NextRequest, NextResponse } from "next/server";
import { getSearchMovies } from "@/lib/server/tmdb";

export async function GET(request: NextRequest) {
  try {
    const data = await getSearchMovies(request.nextUrl.searchParams.get("query"));
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
