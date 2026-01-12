import type { NormalizedSeries } from "@/lib/analysis/normalize";
import { getSeriesTeamIds } from "@/lib/analysis/normalize";

export type RecentFormEntry = {
  seriesId: string;
  outcome: "WIN" | "LOSS" | "UNKNOWN";
  startTimeScheduled?: string | null;
};

export type MapWinRate = {
  mapName: string;
  wins: number;
  losses: number;
  winRate: number | null;
  sampleSize: number;
};

export type ScoutingMetrics = {
  teamId: string;
  sampleSize: number;
  wins: number;
  losses: number;
  unknown: number;
  winRate: number | null;
  recentForm: RecentFormEntry[];
  mapWinRates: MapWinRate[];
  mapPool: string[];
  dataQuality: string[];
};

/*
Assumed:
- Series list is pre-sorted by recency when provided by the caller.
- Opponent participation is confirmed only via detected team ids.
Derived:
- Win rates use explicit series/map winner ids only.
*/
export function computeMetrics(seriesList: NormalizedSeries[], opponentTeamId: string): ScoutingMetrics {
  const notes = new Set<string>();
  const mapStats = new Map<string, { wins: number; losses: number }>();
  const mapPool = new Set<string>();
  const recentForm: RecentFormEntry[] = [];

  let wins = 0;
  let losses = 0;
  let unknown = 0;

  for (const series of seriesList) {
    series.dataQuality.forEach((note) => notes.add(note));

    const seriesTeamIds = getSeriesTeamIds(series);
    const seriesHasOpponent = seriesTeamIds.has(opponentTeamId);

    let outcome: RecentFormEntry["outcome"] = "UNKNOWN";

    if (!seriesHasOpponent) {
      notes.add(`Series ${series.seriesId} does not include the opponent team id in detected teams.`);
    } else if (series.seriesWinnerTeamId) {
      outcome = series.seriesWinnerTeamId === opponentTeamId ? "WIN" : "LOSS";
    } else {
      notes.add(`Series ${series.seriesId} is missing winner data.`);
    }

    if (outcome === "WIN") {
      wins += 1;
    } else if (outcome === "LOSS") {
      losses += 1;
    } else {
      unknown += 1;
    }

    recentForm.push({
      seriesId: series.seriesId,
      outcome,
      startTimeScheduled: series.startTimeScheduled ?? null,
    });

    if (!seriesHasOpponent) {
      continue;
    }

    for (const map of series.maps) {
      if (!map.mapName) {
        continue;
      }

      mapPool.add(map.mapName);

      if (!map.winnerTeamId) {
        continue;
      }

      const current = mapStats.get(map.mapName) ?? { wins: 0, losses: 0 };
      if (map.winnerTeamId === opponentTeamId) {
        current.wins += 1;
      } else {
        current.losses += 1;
      }
      mapStats.set(map.mapName, current);
    }
  }

  const totalResolved = wins + losses;
  const winRate = totalResolved > 0 ? wins / totalResolved : null;

  const mapWinRates: MapWinRate[] = Array.from(mapStats.entries()).map(([mapName, stat]) => {
    const sampleSize = stat.wins + stat.losses;
    return {
      mapName,
      wins: stat.wins,
      losses: stat.losses,
      winRate: sampleSize > 0 ? stat.wins / sampleSize : null,
      sampleSize,
    };
  });

  mapWinRates.sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0));

  return {
    teamId: opponentTeamId,
    sampleSize: seriesList.length,
    wins,
    losses,
    unknown,
    winRate,
    recentForm,
    mapWinRates,
    mapPool: Array.from(mapPool),
    dataQuality: Array.from(notes),
  };
}
