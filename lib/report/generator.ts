import { fetchAllSeries, fetchTitles, searchTeamsByName } from "@/lib/grid/central";
import { fetchTeamStatistics, fetchPlayerStatistics, fetchGameStatistics, fetchSeriesStatistics } from "@/lib/grid/stats";
import {
  buildCommonStrategies,
  buildPlayerHighlights,
  buildRosterPatterns,
  buildHowToWin,
  buildDraftAnalysis,
  buildTeamArchetype,
} from "@/lib/report/heuristics";
import type { GridSeries, PlayerStatistics } from "@/lib/grid/types";
import { mapWithConcurrency } from "@/lib/utils/concurrency";
import { generateExecutiveSummary, type LlmSummary } from "@/lib/llm/summary";
import { HttpError } from "@/lib/utils/fetch";

export class TeamNotFoundError extends Error {
  constructor(name: string) {
    super(`Team not found: ${name}`);
    this.name = "TeamNotFoundError";
  }
}

export class InsufficientDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientDataError";
  }
}

const TITLE_HINTS: Record<string, { id: string; aliases: string[] }> = {
  val: { id: "6", aliases: ["valorant", "val"] },
  lol: { id: "3", aliases: ["league of legends", "lol"] },
};


export async function generateReport(input: {
  title: "val" | "lol";
  opponentTeamName: string;
  ownTeamName?: string;
  lastXMatches: number;
  timeWindow: "LAST_MONTH" | "LAST_3_MONTHS" | "LAST_6_MONTHS" | "LAST_YEAR";
  tournamentNameContains?: string;
}) {
  const generatedAt = new Date().toISOString();
  const title = await resolveTitle(input.title);

  const teamMatches = await searchTeamsByName({ query: input.opponentTeamName });
  const team = teamMatches[0];
  if (!team) {
    throw new TeamNotFoundError(input.opponentTeamName);
  }

  let ownTeam = null;
  if (input.ownTeamName) {
    const ownMatches = await searchTeamsByName({ query: input.ownTeamName });
    ownTeam = ownMatches[0];
  }

  const seriesData = await resolveRecentSeries({
    titleId: Number(title.id),
    teamId: team.id,
    lastXMatches: input.lastXMatches,
    timeWindow: input.timeWindow,
    tournamentNameContains: input.tournamentNameContains,
  });

  if (seriesData.series.length === 0) {
    throw new InsufficientDataError(`No recent series found for ${team.name ?? team.id}.`);
  }

  const earliestStart = findEarliestStart(seriesData.series);

  const overallStats = await fetchTeamStatistics({
    teamId: team.id,
    filter: { timeWindow: input.timeWindow },
  });

  let ownStats = null;
  if (ownTeam) {
    ownStats = await fetchTeamStatistics({
      teamId: ownTeam.id,
      filter: { timeWindow: input.timeWindow },
    }).catch(() => null);
  }

  const recentStats = await fetchRecentTeamStats(team.id, earliestStart, input.timeWindow);

  const gameStats = await fetchGameStatistics({
    titleId: title.id,
    filter: { teamId: team.id, timeWindow: input.timeWindow },
  }).catch(() => ({ mapStats: [], avgDurationSeconds: null, selectionUsed: "" }));

  const seriesStats = await fetchSeriesStatistics({
    titleId: title.id,
    filter: { teamId: team.id, timeWindow: input.timeWindow },
  }).catch(() => ({ selectionUsed: "", data: {} }));

  // Global Meta Fetch (Maximize data use)
  const globalGameStats = await fetchGameStatistics({
    titleId: title.id,
    filter: { timeWindow: input.timeWindow },
  }).catch(() => null);

  const globalSeriesStats = await fetchSeriesStatistics({
    titleId: title.id,
    filter: { timeWindow: input.timeWindow },
  }).catch(() => null);

  const hasPlayerData = seriesData.series.some((series) => series.players.length > 0);
  const playerStats = hasPlayerData ? await buildPlayerStats(seriesData.series) : [];

  const archetype = buildTeamArchetype(overallStats.stats);
  const ownArchetype = ownStats ? buildTeamArchetype(ownStats.stats) : null;

  const commonStrategies = buildCommonStrategies({
    overall: overallStats.stats,
    recent: recentStats?.stats ?? null,
    durationSeconds: gameStats.avgDurationSeconds,
    mapStats: gameStats,
  });

  const playerHighlights = hasPlayerData ? buildPlayerHighlights(playerStats) : null;
  const draftAnalysis = buildDraftAnalysis(seriesStats.data);
  const rosterPatterns = hasPlayerData ? buildRosterPatterns(seriesData.series) : null;
  const howToWin = buildHowToWin({
    overall: overallStats.stats,
    recent: recentStats?.stats ?? null,
    mapStats: gameStats,
    playerHighlights: playerHighlights?.highlights ?? [],
  });

  const limitations = buildLimitations({
    seriesAccessLimited: seriesData.seriesAccessLimited,
    hasPlayerData,
    gameStats,
    recentStatsAvailable: Boolean(recentStats),
    tournamentNameContains: input.tournamentNameContains,
    tournamentMatched: seriesData.tournamentMatched,
  });

  const summaryEvidenceRefs = buildEvidenceRefs(overallStats.stats);
  const summaryInput = {
    teamName: team.name ?? team.nameShortened ?? team.id,
    ownTeamName: ownTeam?.name || null,
    titleName: title.name,
    timeWindow: input.timeWindow,
    metrics: {
      winRate: overallStats.stats.winRate,
      killsAvg: overallStats.stats.killsAvg,
      deathsPerRound: overallStats.stats.deathsPerRound,
      recentWinRate: recentStats?.stats.winRate ?? null,
    },
    ownMetrics: ownStats ? {
      winRate: ownStats.stats.winRate,
      killsAvg: ownStats.stats.killsAvg,
      deathsPerRound: ownStats.stats.deathsPerRound,
    } : null,
    mapStats: gameStats.mapStats,
    draftTrends: draftAnalysis.picks.slice(0, 5),
    limitations: limitations.bullets,
    evidenceRefs: summaryEvidenceRefs.length > 0 ? summaryEvidenceRefs : ["teamStatistics"],
  };

  const summary = await buildSummary(summaryInput);

  const howToWinSection =
    summary.howToWin.length > 0
      ? {
          recommendations: summary.howToWin,
          bullets: summary.howToWin.map((rec) => `${rec.title}: ${rec.why}`),
          evidence: summary.howToWin.map((rec) => ({ evidenceRefs: rec.evidenceRefs })),
        }
      : howToWin;

  const sections: Record<string, unknown> = {
    commonStrategies,
    draftAnalysis,
  };

  if (playerHighlights && playerHighlights.highlights.length > 0) {
    sections.playerTendencies = playerHighlights;
  }

  if (rosterPatterns && rosterPatterns.bullets.length > 0 && hasPlayerData) {
    sections.rosterAndPatterns = rosterPatterns;
  }

  if (limitations.bullets.length > 0) {
    sections.dataConstraints = limitations;
  }

  sections.howToWin = howToWinSection;

  const report = {
    meta: {
      titleId: title.id,
      titleName: title.name,
      opponentTeam: { id: team.id, name: team.name ?? team.nameShortened ?? team.id, archetype },
      ownTeam: ownTeam ? { id: ownTeam.id, name: ownTeam.name ?? ownTeam.nameShortened ?? ownTeam.id, archetype: ownArchetype } : null,
      generatedAt,
      lastXMatches: input.lastXMatches,
      seriesSample: seriesData.series.map((series) => ({
        id: series.id,
        startTime: series.startTimeScheduled,
        tournamentName: series.tournament?.name ?? null,
        opponentVs: buildMatchLabel(series),
      })),
    },
    sections,
    summary,
    globalMeta: {
      game: globalGameStats,
      series: globalSeriesStats,
      draft: globalSeriesStats ? buildDraftAnalysis(globalSeriesStats.data) : null,
    },
    comparison: ownStats ? {
      ownTeam: { id: ownTeam!.id, name: ownTeam!.name || ownTeam!.nameShortened || ownTeam!.id },
      opponentTeam: { id: team.id, name: team.name || team.nameShortened || team.id },
      metrics: [
        { label: "Win Rate", own: ownStats.stats.winRate, opponent: overallStats.stats.winRate, type: "percent" },
        { label: "Kills/Series", own: ownStats.stats.killsAvg, opponent: overallStats.stats.killsAvg, type: "number" },
        { label: "Deaths/Round", own: ownStats.stats.deathsPerRound, opponent: overallStats.stats.deathsPerRound, type: "number" },
      ]
    } : null,
    raw: {
      central: {
        seriesIds: seriesData.series.map((series) => series.id),
      },
      stats: {
        overallTeamStats: overallStats.raw,
        recentTeamStats: recentStats?.raw ?? null,
        gameStats: {
          selectionUsed: gameStats.selectionUsed,
          mapStats: gameStats.mapStats,
          avgDurationSeconds: gameStats.avgDurationSeconds,
        },
        seriesStats: {
          selectionUsed: seriesStats.selectionUsed,
          data: seriesStats.data,
        },
      },
    },
  };

  const markdown = buildMarkdown(report);

  const evidence = {
    seriesIds: seriesData.series.map((series) => series.id),
    filters: {
      timeWindow: input.timeWindow,
      tournamentNameContains: input.tournamentNameContains ?? null,
      startedAt: earliestStart,
      lastXMatches: input.lastXMatches,
    },
    statsSummary: {
      team: overallStats.stats,
      recentTeam: recentStats?.stats ?? null,
      players: playerStats,
      mapStats: gameStats.mapStats,
    },
    timestamps: { generatedAt },
  };

  return { report, markdown, evidence, limitations: limitations.bullets };
}

async function resolveTitle(titleKey: "val" | "lol") {
  const titles = await fetchTitles();
  const hint = TITLE_HINTS[titleKey];

  const byId = titles.find((title) => title.id === hint.id);
  if (byId) {
    return byId;
  }

  const byAlias = titles.find((title) =>
    hint.aliases.some((alias) => (title.name ?? "").toLowerCase().includes(alias))
  );

  if (!byAlias) {
    throw new Error(`Title not found for ${titleKey}`);
  }

  return byAlias;
}

async function resolveRecentSeries(options: {
  titleId: number;
  teamId: string;
  lastXMatches: number;
  timeWindow: "LAST_MONTH" | "LAST_3_MONTHS" | "LAST_6_MONTHS" | "LAST_YEAR";
  tournamentNameContains?: string;
}) {
  const { stats, raw } = await fetchTeamStatistics({
    teamId: options.teamId,
    filter: { timeWindow: options.timeWindow },
  });

  const seriesIdsFromStats = stats.aggregationSeriesIds;
  if (seriesIdsFromStats.length === 0) {
    throw new InsufficientDataError("No aggregationSeriesIds available for this team.");
  }

  const seriesFromStats = await buildSeriesFallbackFromStats(
    options.titleId,
    seriesIdsFromStats,
    options.lastXMatches,
    options.tournamentNameContains
  );

  return {
    series: seriesFromStats.slice(0, options.lastXMatches),
    from: "stats",
    statsRaw: raw,
    seriesAccessLimited: true,
    tournamentMatched: options.tournamentNameContains
      ? seriesFromStats.some((series) =>
          (series.tournament?.name ?? "")
            .toLowerCase()
            .includes(options.tournamentNameContains!.toLowerCase())
        )
      : true,
  };
}

async function buildSeriesFallbackFromStats(
  titleId: number,
  aggregationSeriesIds: string[],
  limit: number,
  tournamentNameContains?: string
): Promise<GridSeries[]> {
  if (aggregationSeriesIds.length === 0) {
    return [];
  }

  const recentSeries = await collectRecentSeriesInfo(titleId, 4, tournamentNameContains);
  const aggregationSet = new Set(aggregationSeriesIds);
  const ordered: GridSeries[] = [];
  const seen = new Set<string>();

  for (const series of recentSeries) {
    if (aggregationSet.has(series.id)) {
      ordered.push(series);
      seen.add(series.id);
      if (ordered.length >= limit) {
        return ordered;
      }
    }
  }

  for (const seriesId of aggregationSeriesIds) {
    if (seen.has(seriesId)) {
      continue;
    }
    ordered.push(minimalSeries(seriesId));
    if (ordered.length >= limit) {
      break;
    }
  }

  return ordered;
}

async function collectRecentSeriesInfo(
  titleId: number,
  pages: number,
  tournamentNameContains?: string
): Promise<GridSeries[]> {
  const collected: GridSeries[] = [];
  let after: string | null = null;

  for (let page = 0; page < pages; page += 1) {
    const connection = await fetchAllSeries({ first: 50, after, titleId, tournamentNameContains });
    for (const edge of connection.edges) {
      collected.push(edge.series);
    }
    if (!connection.pageInfo.hasNextPage) {
      break;
    }
    after = connection.pageInfo.endCursor;
  }

  return collected;
}

function minimalSeries(seriesId: string): GridSeries {
  return {
    id: seriesId,
    startTimeScheduled: null,
    updatedAt: null,
    type: null,
    title: null,
    tournament: null,
    teams: [],
    players: [],
    productServiceLevels: [],
  };
}

function buildLimitations(options: {
  seriesAccessLimited: boolean;
  hasPlayerData: boolean;
  gameStats: { selectionUsed: string };
  recentStatsAvailable: boolean;
  tournamentNameContains?: string;
  tournamentMatched: boolean;
}) {
  const bullets: string[] = [];
  const evidence: Record<string, unknown>[] = [];

  if (options.seriesAccessLimited || !options.hasPlayerData) {
    bullets.push("Series details (teams/players) are unavailable; roster and player insights are omitted.");
    evidence.push({ reason: "seriesAccessLimited" });
  }

  if (!options.gameStats.selectionUsed) {
    bullets.push("Game/map-level statistics are unavailable from the stats endpoint.");
    evidence.push({ reason: "gameStatisticsUnavailable" });
  }

  if (!options.recentStatsAvailable) {
    bullets.push("Recent-window stats are unavailable; using the selected aggregate time window.");
    evidence.push({ reason: "recentStatsUnavailable" });
  }

  if (options.tournamentNameContains && !options.tournamentMatched) {
    bullets.push("Tournament filter did not match recent series; showing latest available series instead.");
    evidence.push({ reason: "tournamentFilterNoMatch" });
  }

  return { bullets, evidence };
}

async function buildSummary(input: {
  teamName: string;
  titleName: string | null;
  timeWindow: string;
  metrics: Record<string, number | null>;
  limitations: string[];
  evidenceRefs: string[];
}): Promise<LlmSummary> {
  try {
    return await generateExecutiveSummary(input);
  } catch (error) {
    logLlmError(error);
    return buildFallbackSummary(input);
  }
}

function buildFallbackSummary(input: {
  teamName: string;
  titleName: string | null;
  timeWindow: string;
  metrics: Record<string, number | null>;
  limitations: string[];
  evidenceRefs: string[];
}): LlmSummary {
  const signals: string[] = [];
  if (typeof input.metrics.winRate === "number") {
    signals.push(`Win rate ${Math.round(input.metrics.winRate)}%`);
  }
  if (typeof input.metrics.killsAvg === "number") {
    signals.push(`Kills/series ${input.metrics.killsAvg.toFixed(1)}`);
  }
  if (typeof input.metrics.deathsPerRound === "number") {
    signals.push(`Deaths/round ${input.metrics.deathsPerRound.toFixed(2)}`);
  }

  const summary =
    signals.length > 0
      ? `${input.teamName} (${input.titleName ?? "title"}) shows ${signals.join(", ")} over ${input.timeWindow}.`
      : `${input.teamName} (${input.titleName ?? "title"}) has limited available metrics in this time window.`;

  const coverageNote =
    input.limitations.length > 0 ? input.limitations.join(" ") : "Data coverage is sufficient for team-level signals.";

  return {
    executiveSummary: summary,
    evidenceRefs: input.evidenceRefs.length > 0 ? input.evidenceRefs : ["teamStatistics"],
    coverageNote,
    howToWin: [
      {
        title: "Exploit macro weaknesses",
        why: "Use the available team-level metrics to pressure their known gaps while avoiding over-commitments.",
        evidenceRefs: input.evidenceRefs.length > 0 ? input.evidenceRefs : ["teamStatistics"],
      },
    ],
  };
}

function buildEvidenceRefs(stats: { winRate: number | null; killsAvg: number | null; deathsPerRound: number | null }) {
  const refs: string[] = [];
  if (stats.winRate !== null) refs.push("teamStatistics.game.wins.percentage");
  if (stats.killsAvg !== null) refs.push("teamStatistics.series.kills.avg");
  if (stats.deathsPerRound !== null) refs.push("teamStatistics.segment.deaths.avg");
  return refs;
}

function logLlmError(error: unknown) {
  if (error instanceof HttpError) {
    console.warn("[LLM] Summary generation failed:", {
      status: error.status,
      body: error.body,
    });
    return;
  }

  if (error instanceof Error) {
    console.warn("[LLM] Summary generation failed:", error.message);
    return;
  }

  console.warn("[LLM] Summary generation failed with unknown error");
}

async function buildPlayerStats(seriesList: GridSeries[]) {
  const appearances = new Map<string, { nickname: string | null; count: number }>();

  for (const series of seriesList) {
    for (const player of series.players) {
      if (!player.id) {
        continue;
      }
      const current = appearances.get(player.id) ?? { nickname: player.nickname ?? null, count: 0 };
      current.count += 1;
      if (!current.nickname && player.nickname) {
        current.nickname = player.nickname;
      }
      appearances.set(player.id, current);
    }
  }

  const ranked = Array.from(appearances.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([playerId, info]) => ({ playerId, nickname: info.nickname }));

  const statsList = await mapWithConcurrency(ranked, 3, async (player) => {
    try {
      const stats = await fetchPlayerStatistics({
        playerId: player.playerId,
        filter: { timeWindow: "LAST_6_MONTHS" },
      });
      return { ...player, stats };
    } catch {
      return {
        ...player,
        stats: { winCount: null, winRate: null, killsAvg: null, deathsAvg: null } as PlayerStatistics,
      };
    }
  });

  return statsList;
}

async function fetchRecentTeamStats(
  teamId: string,
  startedAt: string | null,
  timeWindow: "LAST_MONTH" | "LAST_3_MONTHS" | "LAST_6_MONTHS" | "LAST_YEAR"
) {
  if (!startedAt) {
    return null;
  }
  try {
    return await fetchTeamStatistics({
      teamId,
      filter: { timeWindow, startedAt: { gte: startedAt } },
    });
  } catch {
    return null;
  }
}

function findEarliestStart(seriesList: GridSeries[]): string | null {
  const timestamps = seriesList
    .map((series) => series.startTimeScheduled)
    .filter(Boolean)
    .map((value) => Date.parse(value as string))
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) {
    return null;
  }

  const earliest = Math.min(...timestamps);
  return new Date(earliest).toISOString();
}

function buildMatchLabel(series: GridSeries): string | null {
  if (series.teams.length === 0) {
    return null;
  }
  const names = series.teams.map((team) => team.name ?? team.nameShortened ?? team.id).filter(Boolean);
  return names.length >= 2 ? `${names[0]} vs ${names[1]}` : names[0];
}

function buildMarkdown(report: {
  meta: { opponentTeam: { name: string | null }; lastXMatches: number };
  sections: Record<string, unknown>;
}) {
  const lines: string[] = [];
  lines.push(`# Scouting Report: ${report.meta.opponentTeam.name ?? "Unknown"}`);
  lines.push("");
  lines.push(`- Matches analyzed: ${report.meta.lastXMatches}`);
  const commonStrategies = (report.sections as { commonStrategies?: { bullets?: string[] } }).commonStrategies;
  if (commonStrategies?.bullets && commonStrategies.bullets.length > 0) {
    lines.push("");
    lines.push("## Key Signals");
    commonStrategies.bullets.slice(0, 3).forEach((bullet) => lines.push(`- ${bullet}`));
  }
  return lines.join("\n");
}
