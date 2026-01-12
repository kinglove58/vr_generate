import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { seriesByTournamentSchema } from "@/lib/validate";
import { fetchAllSeries } from "@/lib/grid/central";
import { GridAuthError, GridGraphQLError, GridRequestError, isFieldNotFound, isPermissionDenied } from "@/lib/grid/client";
import { z } from "zod";

export const runtime = "nodejs";

const limiter = rateLimit({ capacity: 30, refillPerMinute: 60 });

export async function GET(request: Request) {
  const limit = limiter(request);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfterMs: limit.retryAfterMs },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = seriesByTournamentSchema.safeParse({
    titleId: searchParams.get("titleId") ? Number(searchParams.get("titleId")) : undefined,
    tournament: searchParams.get("tournament"),
    first: searchParams.get("first") ? Number(searchParams.get("first")) : undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", details: parsed.error.issues }, { status: 400 });
  }

  try {
    const series = await fetchAllSeries({
      first: parsed.data.first,
      titleId: parsed.data.titleId,
      tournamentNameContains: parsed.data.tournament,
    });

    return NextResponse.json(series);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid environment", details: error.issues }, { status: 500 });
    }
    if (error instanceof GridAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof GridGraphQLError) {
      if (isPermissionDenied(error)) {
        return NextResponse.json({ error: "GRID permission denied", errors: error.errors }, { status: 403 });
      }
      if (isFieldNotFound(error)) {
        // Fallback: fetch without tournament filter and filter client-side.
        const series = await fetchAllSeries({
          first: parsed.data.first,
          titleId: parsed.data.titleId,
        });
        const filtered = series.edges.filter((edge) => {
          const name = edge.series.tournament?.name ?? "";
          return name.toLowerCase().includes(parsed.data.tournament.toLowerCase());
        });
        return NextResponse.json({
          ...series,
          edges: filtered,
        });
      }
      return NextResponse.json({ error: "GRID GraphQL error", errors: error.errors }, { status: 502 });
    }
    if (error instanceof GridRequestError) {
      return NextResponse.json(
        { error: "GRID request failed", status: error.status, gridBody: error.gridBody },
        { status: 502 }
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch series", details: message }, { status: 500 });
  }
}