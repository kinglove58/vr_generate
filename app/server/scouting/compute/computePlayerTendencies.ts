import { z } from "zod";
import { requestGrid } from "@/app/server/grid/gridClient";
import { PLAYER_STATISTICS_QUERY } from "@/app/server/grid/queries/statsQueries";
import type { Series } from "@/app/server/grid/mappers";
import type { PlayerTendencies } from "@/app/server/scouting/types";
import { mapWithConcurrency } from "@/lib/utils/concurrency";

const playerStatsSchema = z.object({
  playerStatistics: z
    .object({
      game: z
        .object({
          wins: z.object({ percentage: z.number().optional().nullable() }).optional().nullable(),
        })
        .optional()
        .nullable(),
      series: z
        .object({
          kills: z.object({ avg: z.number().optional().nullable() }).optional().nullable(),
          deaths: z.object({ avg: z.number().optional().nullable() }).optional().nullable(),
        })
        .optional()
        .nullable(),
    })
    .optional()
    .nullable(),
});

export type PlayerTendenciesResult = {
  playerTendencies: PlayerTendencies;
  raw: Record<string, unknown>;
};

export async function computePlayerTendencies(options: {
  seriesList: Series[];
  timeWindow: "LAST_6_MONTHS";
}): Promise<PlayerTendenciesResult> {
  const playerCounts = new Map<string, { name: string | null; count: number }>();

  for (const series of options.seriesList) {
    for (const player of series.players) {
      const current = playerCounts.get(player.id) ?? { name: player.name ?? null, count: 0 };
      current.count += 1;
      if (!current.name && player.name) {
        current.name = player.name;
      }
      playerCounts.set(player.id, current);
    }
  }

  const ranked = Array.from(playerCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([id, info]) => ({ id, name: info.name }));

  if (ranked.length === 0) {
    return {
      playerTendencies: { players: [], note: "No player data available from series." },
      raw: { playerCount: 0 },
    };
  }

  const players = await mapWithConcurrency(ranked, 4, async (player) => {
    try {
      const data = await requestGrid({
        endpoint: "statistics",
        query: PLAYER_STATISTICS_QUERY,
        variables: { playerId: player.id, filter: { timeWindow: options.timeWindow } },
        cacheTtlMs: 5 * 60 * 1000,
      });

      const parsed = playerStatsSchema.parse(data ?? {});
      const stats = parsed.playerStatistics ?? {};

      return {
        playerId: player.id,
        name: player.name ?? null,
        winRate: toNumber(stats.game?.wins?.percentage ?? null),
        killsAvg: toNumber(stats.series?.kills?.avg ?? null),
        deathsAvg: toNumber(stats.series?.deaths?.avg ?? null),
      };
    } catch {
      return {
        playerId: player.id,
        name: player.name ?? null,
        winRate: null,
        killsAvg: null,
        deathsAvg: null,
      };
    }
  });

  const sorted = players.sort((a, b) => (b.killsAvg ?? 0) - (a.killsAvg ?? 0));

  const failedCount = sorted.filter((player) => player.killsAvg === null && player.winRate === null).length;

  return {
    playerTendencies: {
      players: sorted,
      note: failedCount > 0 ? `${failedCount} player statistics lookups failed.` : null,
    },
    raw: { playerCount: players.length, failedCount },
  };
}

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
