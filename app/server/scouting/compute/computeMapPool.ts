import { requestGrid, GridGraphQLError } from "@/app/server/grid/gridClient";
import { buildGameStatisticsQuery } from "@/app/server/grid/queries/statsQueries";
import type { MapPool } from "@/app/server/scouting/types";

export type MapPoolResult = {
  mapPool: MapPool;
  avgDurationSeconds: number | null;
  raw: Record<string, unknown>;
};

const GAME_STAT_SELECTIONS = [
  "games { map { name } count wins { percent } } duration { avg }",
  "games { map { name } count wins { percent } }",
  "games { map { name } count }",
  "maps { name count winRate }",
  "maps { name count }",
  "duration { avg }",
];

export async function computeMapPool(options: {
  titleId: string;
  gameTitle: "val" | "lol";
  timeWindow: "LAST_6_MONTHS";
}): Promise<MapPoolResult> {
  const startedAt = toStartedAt(options.timeWindow);
  let data: unknown = null;
  let selectionUsed = "";

  for (const selection of GAME_STAT_SELECTIONS) {
    try {
      data = await requestGrid({
        endpoint: "statistics",
        query: buildGameStatisticsQuery(selection),
        variables: { titleId: options.titleId, filter: { startedAt: { gte: startedAt } } },
        cacheTtlMs: 5 * 60 * 1000,
      });
      selectionUsed = selection;
      break;
    } catch (error) {
      if (error instanceof GridGraphQLError && isFieldNotFound(error)) {
        continue;
      }
      throw error;
    }
  }

  if (!data) {
    return {
      mapPool: { maps: [], note: "Map pool data unavailable." },
      avgDurationSeconds: null,
      raw: {},
    };
  }

  const stats = (data as { gameStatistics?: Record<string, unknown> }).gameStatistics ?? {};
  const maps = extractMaps(stats);
  const avgDurationSeconds = extractAvgDuration(stats);

  const sortedMaps = [...maps].sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  const note =
    maps.length === 0 && options.gameTitle === "lol"
      ? "Map pool data not available for LoL."
      : maps.length === 0
        ? "Map pool data unavailable."
        : null;
  const mapPool: MapPool = {
    maps: sortedMaps,
    note,
  };

  return {
    mapPool,
    avgDurationSeconds,
    raw: {
      selectionUsed,
      mapCount: maps.length,
      avgDurationSeconds,
    },
  };
}

function extractMaps(stats: Record<string, unknown>) {
  const maps: Array<{ name: string; count: number | null; winRate: number | null }> = [];

  const games = Array.isArray(stats.games) ? stats.games : [];
  for (const item of games) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    const mapObj = record.map as Record<string, unknown> | undefined;
    const name = typeof mapObj?.name === "string" ? mapObj.name : null;
    if (!name) {
      continue;
    }
    maps.push({
      name,
      count: toNumber(record.count),
      winRate: toNumber((record.wins as Record<string, unknown> | undefined)?.percent),
    });
  }

  const mapList = Array.isArray(stats.maps) ? stats.maps : [];
  for (const item of mapList) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name : null;
    if (!name) {
      continue;
    }
    maps.push({
      name,
      count: toNumber(record.count),
      winRate: toNumber(record.winRate),
    });
  }

  return maps;
}

function extractAvgDuration(stats: Record<string, unknown>): number | null {
  const duration = stats.duration as Record<string, unknown> | undefined;
  return toNumber(duration?.avg);
}

function toStartedAt(timeWindow: "LAST_6_MONTHS"): string {
  if (timeWindow === "LAST_6_MONTHS") {
    const now = new Date();
    const past = new Date(now);
    past.setMonth(past.getMonth() - 6);
    return past.toISOString();
  }
  return new Date().toISOString();
}

function isFieldNotFound(error: GridGraphQLError): boolean {
  return error.errors.some((entry) => {
    const message = entry.message.toLowerCase();
    return message.includes("cannot query field") || message.includes("field_not_found");
  });
}

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
