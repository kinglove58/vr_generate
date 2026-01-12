import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    centralData: true,
    statisticsFeed: true,
    seriesState: false,
    features: {
      scoutingReport: true,
      teamsSearch: true,
      seriesByTournament: true,
    },
  });
}