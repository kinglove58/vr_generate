import { NextResponse } from "next/server";
import { z } from "zod";
import { scoutingReportSchema } from "@/lib/validate";
import { rateLimit } from "@/lib/rateLimit";
import { generateReport, TeamNotFoundError, InsufficientDataError } from "@/lib/report/generator";
import {
  GridAuthError,
  GridGraphQLError,
  GridRequestError,
  isFieldNotFound,
  isPermissionDenied,
  isRateLimited,
} from "@/lib/grid/client";

export const runtime = "nodejs";

const limiter = rateLimit({ capacity: 20, refillPerMinute: 30 });

export async function POST(request: Request) {
  const limit = limiter(request);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfterMs: limit.retryAfterMs },
      { status: 429 }
    );
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const parsed = scoutingReportSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.issues }, { status: 400 });
  }

  try {
    const result = await generateReport(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid environment", details: error.issues }, { status: 500 });
    }

    if (error instanceof GridAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof GridGraphQLError) {
      if (isRateLimited(error)) {
        return NextResponse.json({ error: "GRID rate limit exceeded", errors: error.errors }, { status: 429 });
      }
      if (isPermissionDenied(error)) {
        return NextResponse.json({ error: "GRID permission denied", errors: error.errors }, { status: 403 });
      }
      if (isFieldNotFound(error)) {
        return NextResponse.json({ error: "GRID field not found", errors: error.errors }, { status: 502 });
      }
      return NextResponse.json({ error: "GRID GraphQL error", errors: error.errors }, { status: 502 });
    }

    if (error instanceof GridRequestError) {
      return NextResponse.json(
        { error: "GRID request failed", status: error.status, gridBody: error.gridBody },
        { status: 502 }
      );
    }

    if (error instanceof TeamNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof InsufficientDataError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to generate scouting report", details: message }, { status: 500 });
  }
}