import { NextResponse } from "next/server";
import { searchTeamsByName } from "@/lib/grid/central";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.length < 2) {
    return NextResponse.json({ teams: [] });
  }

  try {
    const teams = await searchTeamsByName({ query: q });
    return NextResponse.json({ 
      teams: teams.map(t => ({ id: t.id, name: t.name || t.nameShortened || t.id })) 
    });
  } catch (error) {
    return NextResponse.json({ teams: [] }, { status: 500 });
  }
}
