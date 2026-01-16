import { z } from "zod";
import { requestGrid, GridGraphQLError } from "@/app/server/grid/gridClient";
import {
  TEAM_STATISTICS_QUERY,
  TEAM_STATISTICS_QUERY_NO_SEGMENT,
} from "@/app/server/grid/queries/statsQueries";
import type { TeamSummary } from "@/app/server/scouting/types";

const teamStatsSchema = z.object({
  teamStatistics: z
    .object({
      aggregationSeriesIds: z.array(z.union([z.string(), z.number()])).optional().nullable(),
      game: z
        .object({
          wins: z.object({ percentage: z.number().optional().nullable() }).optional().nullable(),
        })
        .optional()
        .nullable(),
      series: z
        .object({
          kills: z.object({ avg: z.number().optional().nullable() }).optional().nullable(),
        })
        .optional()
        .nullable(),
      segment: z
        .object({
          deaths: z.object({ avg: z.number().optional().nullable() }).optional().nullable(),
        })
        .optional()
        .nullable(),
    })
    .optional()
    .nullable(),
});

export type TeamSummaryResult = {
  summary: TeamSummary;
  raw: Record<string, unknown>;
};

export async function computeTeamSummary(
  teamId: string,
  timeWindow: "LAST_6_MONTHS"
): Promise<TeamSummaryResult> {
  const dataQuality: string[] = [];
  let data: unknown;

  try {
    data = await requestGrid({
      endpoint: "statistics",
      query: TEAM_STATISTICS_QUERY,
      variables: { teamId, filter: { timeWindow } },
      cacheTtlMs: 5 * 60 * 1000,
    });
  } catch (error) {
    if (error instanceof GridGraphQLError && isUnsupportedSegmentError(error)) {
      data = await requestGrid({
        endpoint: "statistics",
        query: TEAM_STATISTICS_QUERY_NO_SEGMENT,
        variables: { teamId, filter: { timeWindow } },
        cacheTtlMs: 5 * 60 * 1000,
      });
      dataQuality.push("Segment round stats unavailable; deaths per round omitted.");
    } else {
      throw error;
    }
  }

  const parsed = teamStatsSchema.parse(data ?? {});
  const stats = parsed.teamStatistics ?? {};

  const winRate = coerceNumber(stats.game?.wins?.percentage ?? null);
  const avgKillsPerSeries = coerceNumber(stats.series?.kills?.avg ?? null);
  const deathsPerRound = coerceNumber(stats.segment?.deaths?.avg ?? null);

  if (winRate === null) {
    dataQuality.push("Win rate missing from team statistics.");
  }
  if (avgKillsPerSeries === null) {
    dataQuality.push("Series kills average missing from team statistics.");
  }

  return {
    summary: {
      winRate,
      avgKillsPerSeries,
      deathsPerRound,
      dataQuality,
    },
    raw: {
      winRate,
      avgKillsPerSeries,
      deathsPerRound,
    },
  };
}

function isUnsupportedSegmentError(error: GridGraphQLError): boolean {
  return error.errors.some((entry) => {
    const message = entry.message.toLowerCase();
    return (
      (message.includes("segment") && message.includes("cannot query")) ||
      (message.includes("segment") && message.includes("argument")) ||
      (message.includes("segment") && message.includes("unknown"))
    );
  });
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return null;
}
