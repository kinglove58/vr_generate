import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      error: "Endpoint disabled",
      message: "Series state downloads are not available in GRID Open Access.",
    },
    { status: 410 }
  );
}
