import { NextResponse } from "next/server";
import { getMovieDetails } from "@/lib/server/tmdb";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function inferHttpStatus(message: string) {
  if (message === "Invalid movie id.") {
    return 400;
  }

  const statusMatch = message.match(/status (\d{3})/);
  if (statusMatch) {
    const statusCode = Number(statusMatch[1]);
    if (statusCode >= 400 && statusCode <= 599) {
      return statusCode;
    }
  }

  if (message.toLowerCase().includes("timed out")) {
    return 504;
  }

  return 500;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await getMovieDetails(id);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return NextResponse.json({ error: message }, { status: inferHttpStatus(message) });
  }
}
