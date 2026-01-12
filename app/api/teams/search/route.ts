import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { teamsSearchSchema } from "@/lib/validate";
import { searchTeamsByName } from "@/lib/grid/central";
import { GridAuthError, GridGraphQLError, GridRequestError, isPermissionDenied } from "@/lib/grid/client";
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
  const parsed = teamsSearchSchema.safeParse({
    q: searchParams.get("q"),
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", details: parsed.error.issues }, { status: 400 });
  }

  try {
    const matches = await searchTeamsByName({ query: parsed.data.q });
    return NextResponse.json({
      query: parsed.data.q,
      results: matches.slice(0, parsed.data.limit),
    });
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
      return NextResponse.json({ error: "GRID GraphQL error", errors: error.errors }, { status: 502 });
    }
    if (error instanceof GridRequestError) {
      return NextResponse.json(
        { error: "GRID request failed", status: error.status, gridBody: error.gridBody },
        { status: 502 }
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to search teams", details: message }, { status: 500 });
  }
}