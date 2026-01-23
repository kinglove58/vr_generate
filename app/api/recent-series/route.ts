import { NextResponse } from "next/server";
import { fetchAllSeries } from "@/lib/grid/central";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Fetch recent series for LoL (3) and Val (6)
    const [lol, val] = await Promise.all([
      fetchAllSeries({ first: 10, titleId: 3 }),
      fetchAllSeries({ first: 10, titleId: 6 })
    ]);

    const all = [...lol.edges, ...val.edges].map(edge => {
      const s = edge.series;
      const teamNames = s.teams.map(t => t.name || t.nameShortened || t.id);
      
      return {
        id: s.id,
        startTime: s.startTimeScheduled,
        tournamentName: s.tournament?.name || "Global Tournament",
        titleName: s.title?.nameShortened || s.title?.name || "Game",
        matchLabel: teamNames.length >= 2 ? `${teamNames[0]} vs ${teamNames[1]}` : teamNames[0] || "Match"
      };
    });

    // Sort by start time descending
    all.sort((a, b) => {
      const ta = a.startTime ? new Date(a.startTime).getTime() : 0;
      const tb = b.startTime ? new Date(b.startTime).getTime() : 0;
      return tb - ta;
    });

    return NextResponse.json({ series: all.slice(0, 10) });
  } catch (error) {
    console.error("Failed to fetch recent series", error);
    return NextResponse.json({ series: [] }, { status: 500 });
  }
}
