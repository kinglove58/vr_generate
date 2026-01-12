import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error: "Deprecated endpoint",
      message: "Use GET /api/series/by-tournament or POST /api/scouting-report instead.",
    },
    { status: 410 }
  );
}
