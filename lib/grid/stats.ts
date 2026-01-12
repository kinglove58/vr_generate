import { z } from "zod";
import { requestGrid, GridGraphQLError, isFieldNotFound } from "@/lib/grid/client";
import {
  TEAM_STATISTICS_QUERY,
  TEAM_STATISTICS_QUERY_NO_PERCENT,
  TEAM_STATISTICS_QUERY_NO_SEGMENT,
  TEAM_STATISTICS_QUERY_NO_SEGMENT_NO_PERCENT,
  TEAM_STATISTICS_QUERY_OBJECT,
  TEAM_STATISTICS_QUERY_OBJECT_NO_PERCENT,
  TEAM_STATISTICS_QUERY_OBJECT_NO_SEGMENT,
  TEAM_STATISTICS_QUERY_OBJECT_NO_SEGMENT_NO_PERCENT,
  PLAYER_STATISTICS_QUERY,
  PLAYER_STATISTICS_QUERY_NO_PERCENT,
  PLAYER_STATISTICS_QUERY_OBJECT,
  PLAYER_STATISTICS_QUERY_OBJECT_NO_PERCENT,
  buildGameStatisticsQuery,
  buildSeriesStatisticsQuery,
} from "@/lib/grid/queries";
import type { TeamStatistics, PlayerStatistics, GameStatistics, SeriesStatistics } from "@/lib/grid/types";

const teamStatsSchema = z.object({
  teamStatistics: z
    .object({
      aggregationSeriesIds: z.array(z.union([z.string(), z.number()])).optional().nullable(),
      game: z
        .object({
          wins: z.unknown().optional().nullable(),
        })
        .optional()
        .nullable(),
      series: z
        .object({
          kills: z.object({ avg: z.number().optional().nullable() }).optional().nullable(),
        })
        .optional()
        .nullable(),
      segment: z.unknown().optional().nullable(),
    })
    .optional()
    .nullable(),
});

const playerStatsSchema = z.object({
  playerStatistics: z
    .object({
      game: z
        .object({
          wins: z.unknown().optional().nullable(),
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

const GAME_STAT_SELECTIONS = [
  "games { map { name } count wins { percent } } duration { avg }",
  "games { map { name } count wins { percent } }",
  "games { map { name } count }",
  "maps { name count winRate }",
  "maps { name count }",
  "duration { avg }",
];

const SERIES_STAT_SELECTIONS = [
  "draftActions { name type count }",
  "draftActions { name type }",
  "draftActions { name }",
];

export async function fetchTeamStatistics(options: {
  teamId: string;
  filter: Record<string, unknown>;
}): Promise<{ stats: TeamStatistics; raw: Record<string, unknown> }> {
  const variants = [
    { query: TEAM_STATISTICS_QUERY, hasSegment: true },
    { query: TEAM_STATISTICS_QUERY_NO_PERCENT, hasSegment: true },
    { query: TEAM_STATISTICS_QUERY_NO_SEGMENT, hasSegment: false },
    { query: TEAM_STATISTICS_QUERY_NO_SEGMENT_NO_PERCENT, hasSegment: false },
    { query: TEAM_STATISTICS_QUERY_OBJECT, hasSegment: true },
    { query: TEAM_STATISTICS_QUERY_OBJECT_NO_PERCENT, hasSegment: true },
    { query: TEAM_STATISTICS_QUERY_OBJECT_NO_SEGMENT, hasSegment: false },
    { query: TEAM_STATISTICS_QUERY_OBJECT_NO_SEGMENT_NO_PERCENT, hasSegment: false },
  ];

  let lastError: unknown = null;

  for (const variant of variants) {
    try {
      const data = await requestGrid({
        endpoint: "stats",
        query: variant.query,
        variables: { teamId: options.teamId, filter: options.filter },
      });
      const parsed = await parseTeamStats(data);
      if (!variant.hasSegment) {
        parsed.stats.deathsPerRound = null;
      }
      return parsed;
    } catch (error) {
      lastError = error;
      if (error instanceof GridGraphQLError && isFieldNotFound(error)) {
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("Failed to fetch team statistics");
}

export async function fetchPlayerStatistics(options: {
  playerId: string;
  filter: Record<string, unknown>;
}): Promise<PlayerStatistics> {
  const variants = [
    PLAYER_STATISTICS_QUERY,
    PLAYER_STATISTICS_QUERY_NO_PERCENT,
    PLAYER_STATISTICS_QUERY_OBJECT,
    PLAYER_STATISTICS_QUERY_OBJECT_NO_PERCENT,
  ];

  let lastError: unknown = null;

  for (const query of variants) {
    try {
      const data = await requestGrid({
        endpoint: "stats",
        query,
        variables: { playerId: options.playerId, filter: options.filter },
      });

      const parsed = playerStatsSchema.parse(data);
      const stats = parsed.playerStatistics ?? {};

      const wins = extractWinStats(stats.game?.wins ?? null);
      return {
        winCount: wins.winCount,
        winRate: wins.winRate,
        killsAvg: toNumber(stats.series?.kills?.avg ?? null),
        deathsAvg: toNumber(stats.series?.deaths?.avg ?? null),
      };
    } catch (error) {
      lastError = error;
      if (error instanceof GridGraphQLError && isFieldNotFound(error)) {
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("Failed to fetch player statistics");
}

export async function fetchGameStatistics(options: {
  titleId: string;
  filter: Record<string, unknown> | null;
}): Promise<GameStatistics> {
  let selectionUsed = "";
  let data: unknown = null;
  const filter = options.filter ?? {};

  for (const selection of GAME_STAT_SELECTIONS) {
    try {
      data = await requestGrid({
        endpoint: "stats",
        query: buildGameStatisticsQuery(selection),
        variables: { titleId: options.titleId, filter },
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
    return { mapStats: [], avgDurationSeconds: null, selectionUsed: "" };
  }

  const stats = (data as { gameStatistics?: Record<string, unknown> }).gameStatistics ?? {};
  const mapStats = extractMapStats(stats);
  const avgDurationSeconds = toNumber((stats.duration as Record<string, unknown> | undefined)?.avg ?? null);

  return { mapStats, avgDurationSeconds, selectionUsed };
}

export async function fetchSeriesStatistics(options: {
  titleId: string;
  filter: Record<string, unknown> | null;
}): Promise<SeriesStatistics> {
  let selectionUsed = "";
  let data: unknown = null;
  const filter = options.filter ?? {};

  for (const selection of SERIES_STAT_SELECTIONS) {
    try {
      data = await requestGrid({
        endpoint: "stats",
        query: buildSeriesStatisticsQuery(selection),
        variables: { titleId: options.titleId, filter },
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
    return { selectionUsed: "", data: {} };
  }

  return { selectionUsed, data: data as Record<string, unknown> };
}

async function parseTeamStats(data: unknown) {
  const parsed = teamStatsSchema.parse(data);
  const stats = parsed.teamStatistics ?? {};
  const wins = extractWinStats(stats.game?.wins ?? null);
  const deathsPerRound = extractSegmentDeathsAvg(stats.segment ?? null);

  return {
    stats: {
      aggregationSeriesIds: (stats.aggregationSeriesIds ?? []).map((id) => String(id)),
      winCount: wins.winCount,
      winRate: wins.winRate,
      killsAvg: toNumber(stats.series?.kills?.avg ?? null),
      deathsPerRound,
    },
    raw: stats as Record<string, unknown>,
  };
}

function extractMapStats(stats: Record<string, unknown>) {
  const mapStats: Array<{ name: string; count: number | null; winRate: number | null }> = [];
  const games = Array.isArray(stats.games) ? stats.games : [];
  for (const item of games) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    const map = record.map as Record<string, unknown> | undefined;
    const name = typeof map?.name === "string" ? map.name : null;
    if (!name) {
      continue;
    }
    mapStats.push({
      name,
      count: toNumber(record.count ?? null),
      winRate: toNumber((record.wins as Record<string, unknown> | undefined)?.percent ?? null),
    });
  }

  const maps = Array.isArray(stats.maps) ? stats.maps : [];
  for (const item of maps) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name : null;
    if (!name) {
      continue;
    }
    mapStats.push({
      name,
      count: toNumber(record.count ?? null),
      winRate: toNumber(record.winRate ?? null),
    });
  }

  return mapStats;
}

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function extractWinStats(wins: unknown): { winCount: number | null; winRate: number | null } {
  if (Array.isArray(wins)) {
    const entries = wins.filter((entry) => entry && typeof entry === "object") as Array<Record<string, unknown>>;
    const directTrue = entries.find((entry) => entry.value === true || entry.value === "true" || entry.value === 1);
    const winEntry = directTrue ?? (entries.length === 1 ? entries[0] : undefined);
    return {
      winCount: toNumber(winEntry?.count ?? null),
      winRate: toNumber(winEntry?.percentage ?? winEntry?.percent ?? null),
    };
  }

  if (wins && typeof wins === "object") {
    const record = wins as Record<string, unknown>;
    return {
      winCount: toNumber(record.count ?? null),
      winRate: toNumber(record.percentage ?? record.percent ?? null),
    };
  }

  return { winCount: null, winRate: null };
}

function extractSegmentDeathsAvg(segment: unknown): number | null {
  if (Array.isArray(segment)) {
    const entries = segment.filter((entry) => entry && typeof entry === "object") as Array<Record<string, unknown>>;
    for (const entry of entries) {
      const deaths = entry.deaths as Record<string, unknown> | undefined;
      const avg = toNumber(deaths?.avg ?? null);
      if (avg !== null) {
        return avg;
      }
    }
    return null;
  }

  if (segment && typeof segment === "object") {
    const record = segment as Record<string, unknown>;
    const deaths = record.deaths as Record<string, unknown> | undefined;
    return toNumber(deaths?.avg ?? null);
  }

  return null;
}
