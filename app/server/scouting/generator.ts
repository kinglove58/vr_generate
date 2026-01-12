import { resolveTitleId, resolveTeamIdByName, resolveRecentSeriesForTeam, fetchSeriesById } from "@/app/server/grid/resolve";
import { computeTeamSummary } from "@/app/server/scouting/compute/computeTeamSummary";
import { computeMapPool } from "@/app/server/scouting/compute/computeMapPool";
import { computeDraftTendencies } from "@/app/server/scouting/compute/computeDraftTendencies";
import { computePlayerTendencies } from "@/app/server/scouting/compute/computePlayerTendencies";
import type { ScoutingReportResult, ScoutingReport, Evidence } from "@/app/server/scouting/types";
import { mapWithConcurrency } from "@/lib/utils/concurrency";

export class InsufficientDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientDataError";
  }
}

export async function generateScoutingReport(input: {
  gameTitle: "val" | "lol";
  opponentTeamName: string;
  lastXMatches: number;
  timeWindow: "LAST_6_MONTHS";
}): Promise<ScoutingReportResult> {
  const generatedAt = new Date().toISOString();
  const title = await resolveTitleId(input.gameTitle);
  const team = await resolveTeamIdByName(input.opponentTeamName, title.titleId);

  const seriesResolution = await resolveRecentSeriesForTeam({
    teamId: team.teamId,
    canonicalName: team.canonicalName,
    searchName: input.opponentTeamName,
    titleId: title.titleId,
    lastXMatches: input.lastXMatches,
    timeWindow: input.timeWindow,
  });

  const seriesIds = seriesResolution.seriesIds;

  if (seriesIds.length === 0) {
    throw new InsufficientDataError(
      `No recent series found for ${seriesResolution.canonicalName} (titleId ${title.titleId}).`
    );
  }

  const seriesList = (
    await mapWithConcurrency(seriesIds, 3, (seriesId) => fetchSeriesById(seriesId))
  ).filter(Boolean) as Array<NonNullable<Awaited<ReturnType<typeof fetchSeriesById>>>>;

  if (seriesList.length === 0) {
    throw new InsufficientDataError("Series details are unavailable for the selected matches.");
  }

  const teamSummaryResult = await computeTeamSummary(seriesResolution.teamId, input.timeWindow);
  const mapPoolResult = await computeMapPool({
    titleId: title.titleId,
    gameTitle: input.gameTitle,
    timeWindow: input.timeWindow,
  });
  const draftResult = await computeDraftTendencies({
    titleId: title.titleId,
    timeWindow: input.timeWindow,
  });
  const playerResult = await computePlayerTendencies({
    seriesList,
    timeWindow: input.timeWindow,
  });

  const insights = buildInsights({
    teamSummary: teamSummaryResult.summary,
    mapPool: mapPoolResult.mapPool,
    draftTendencies: draftResult.draftTendencies,
    avgDurationSeconds: mapPoolResult.avgDurationSeconds,
  });

  const report: ScoutingReport = {
    meta: {
      generatedAt,
      gameTitle: input.gameTitle,
      titleId: title.titleId,
      opponentTeamId: seriesResolution.teamId,
      opponentTeamName: seriesResolution.canonicalName,
      lastXMatches: input.lastXMatches,
      timeWindow: input.timeWindow,
      seriesIds,
    },
    teamSummary: teamSummaryResult.summary,
    mapPool: mapPoolResult.mapPool,
    draftTendencies: draftResult.draftTendencies,
    playerTendencies: playerResult.playerTendencies,
    insights,
  };

  const evidence: Evidence = {
    seriesIds,
    filters: {
      timeWindow: input.timeWindow,
      lastXMatches: input.lastXMatches,
    },
    statsSummary: {
      teamSummary: teamSummaryResult.raw,
      mapPool: mapPoolResult.raw,
      draftTendencies: draftResult.raw,
      playerTendencies: playerResult.raw,
    },
    timestamps: { generatedAt },
  };

  return {
    report,
    markdown: buildMarkdownSummary(report),
    evidence,
  };
}

type InsightInput = {
  teamSummary: ScoutingReport["teamSummary"];
  mapPool: ScoutingReport["mapPool"];
  draftTendencies: ScoutingReport["draftTendencies"];
  avgDurationSeconds: number | null;
};

function buildInsights(input: InsightInput) {
  const commonStrategies: string[] = [];
  const howToWin: string[] = [];
  const risks: string[] = [];

  if (input.avgDurationSeconds && input.avgDurationSeconds < 1800) {
    commonStrategies.push("Fast-paced tempo in recent games.");
  }

  if (
    input.teamSummary.winRate !== null &&
    input.teamSummary.winRate >= 55 &&
    input.teamSummary.avgKillsPerSeries !== null &&
    input.teamSummary.avgKillsPerSeries >= 30
  ) {
    commonStrategies.push("Aggressive style with high kill output when winning.");
  }

  const totalMapCount = input.mapPool.maps.reduce((sum, map) => sum + (map.count ?? 0), 0);
  const sortedMaps = [...input.mapPool.maps].sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  if (totalMapCount > 0 && sortedMaps.length >= 2) {
    const topTwo = (sortedMaps[0].count ?? 0) + (sortedMaps[1].count ?? 0);
    if (topTwo / totalMapCount >= 0.6) {
      commonStrategies.push("Map specialists with a concentrated pool.");
    }
  }

  const weakestMap = sortedMaps
    .filter((map) => map.winRate !== null)
    .sort((a, b) => (a.winRate ?? 0) - (b.winRate ?? 0))[0];
  if (weakestMap && weakestMap.winRate !== null && (weakestMap.count ?? 0) >= 3) {
    howToWin.push(
      `Target ${weakestMap.name} where win rate is ${Math.round(weakestMap.winRate)}%.`
    );
  }

  if (input.draftTendencies.picks.length > 0) {
    const topPick = input.draftTendencies.picks[0];
    howToWin.push(`Plan bans or counters for ${topPick.name}, a frequent pick.`);
  } else if (input.mapPool.maps.length > 0) {
    howToWin.push("Use map vetoes to force the opponent off their most-played maps.");
  }

  if (input.teamSummary.winRate !== null && input.teamSummary.winRate < 45) {
    risks.push("Overall win rate is below 45%; expect inconsistency.");
  }

  if (commonStrategies.length === 0) {
    commonStrategies.push("Insufficient data for strong pattern detection.");
  }

  return { commonStrategies, howToWin, risks };
}

function buildMarkdownSummary(report: ScoutingReport): string {
  const lines: string[] = [];
  lines.push(`# Scouting Report: ${report.meta.opponentTeamName}`);
  lines.push("");
  lines.push(`- Game: ${report.meta.gameTitle.toUpperCase()} (titleId ${report.meta.titleId})`);
  lines.push(`- Series analyzed: ${report.meta.seriesIds.length}`);
  lines.push(`- Win rate: ${formatPercent(report.teamSummary.winRate)}`);

  if (report.mapPool.maps.length > 0) {
    const topMap = report.mapPool.maps[0];
    lines.push(`- Top map: ${topMap.name}`);
  }

  if (report.playerTendencies.players.length > 0) {
    const keyPlayers = report.playerTendencies.players.slice(0, 3).map((p) => p.name ?? p.playerId);
    lines.push(`- Key players: ${keyPlayers.join(", ")}`);
  }

  if (report.insights.howToWin.length > 0) {
    lines.push("");
    lines.push("## How to Win");
    report.insights.howToWin.forEach((item) => lines.push(`- ${item}`));
  }

  return lines.join("\n");
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return "N/A";
  }
  return `${Math.round(value)}%`;
}
