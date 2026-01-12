import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error: "Deprecated endpoint",
      message: "Use POST /api/scouting-report for the current scouting report pipeline.",
    },
    { status: 410 }
  );
}
