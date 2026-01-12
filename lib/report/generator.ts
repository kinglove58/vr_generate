import { fetchAllSeries, fetchTitles, searchTeamsByName } from "@/lib/grid/central";
import { fetchTeamStatistics, fetchPlayerStatistics } from "@/lib/grid/stats";
import { buildCommonStrategies, buildPlayerHighlights, buildRosterPatterns, buildHowToWin } from "@/lib/report/heuristics";
import type { GridSeries, PlayerStatistics } from "@/lib/grid/types";
import { mapWithConcurrency } from "@/lib/utils/concurrency";

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
  lastXMatches: number;
}) {
  const generatedAt = new Date().toISOString();
  const title = await resolveTitle(input.title);

  const teamMatches = await searchTeamsByName({ query: input.opponentTeamName });
  const team = teamMatches[0];
  if (!team) {
    throw new TeamNotFoundError(input.opponentTeamName);
  }

  const seriesData = await resolveRecentSeries({
    titleId: Number(title.id),
    teamId: team.id,
    lastXMatches: input.lastXMatches,
  });

  if (seriesData.series.length === 0) {
    throw new InsufficientDataError(`No recent series found for ${team.name ?? team.id}.`);
  }

  const earliestStart = findEarliestStart(seriesData.series);

  const overallStats = await fetchTeamStatistics({
    teamId: team.id,
    filter: { timeWindow: "LAST_6_MONTHS" },
  });

  const recentStats = await fetchRecentTeamStats(team.id, earliestStart);

  const gameStats = {
    mapStats: [],
    avgDurationSeconds: null,
    selectionUsed: "",
  };

  const hasPlayerData = seriesData.series.some((series) => series.players.length > 0);
  const playerStats = hasPlayerData ? await buildPlayerStats(seriesData.series) : [];

  const commonStrategies = buildCommonStrategies({
    overall: overallStats.stats,
    recent: recentStats?.stats ?? null,
    durationSeconds: gameStats.avgDurationSeconds,
    mapStats: gameStats,
  });

  const playerHighlights = hasPlayerData ? buildPlayerHighlights(playerStats) : null;
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
  });

  const sections: Record<string, unknown> = {
    commonStrategies,
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

  sections.howToWin = howToWin;

  const report = {
    meta: {
      titleId: title.id,
      titleName: title.name,
      opponentTeam: { id: team.id, name: team.name ?? team.nameShortened ?? team.id },
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
      },
    },
  };

  const markdown = buildMarkdown(report);

  const evidence = {
    seriesIds: seriesData.series.map((series) => series.id),
    filters: {
      timeWindow: "LAST_6_MONTHS",
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

  return { report, markdown, evidence };
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

async function resolveRecentSeries(options: { titleId: number; teamId: string; lastXMatches: number }) {
  const { stats, raw } = await fetchTeamStatistics({
    teamId: options.teamId,
    filter: { timeWindow: "LAST_6_MONTHS" },
  });

  const seriesIdsFromStats = stats.aggregationSeriesIds;
  if (seriesIdsFromStats.length === 0) {
    throw new InsufficientDataError("No aggregationSeriesIds available for this team.");
  }

  const seriesFromStats = await buildSeriesFallbackFromStats(
    options.titleId,
    seriesIdsFromStats,
    options.lastXMatches
  );

  return {
    series: seriesFromStats.slice(0, options.lastXMatches),
    from: "stats",
    statsRaw: raw,
    seriesAccessLimited: true,
  };
}

async function buildSeriesFallbackFromStats(
  titleId: number,
  aggregationSeriesIds: string[],
  limit: number
): Promise<GridSeries[]> {
  if (aggregationSeriesIds.length === 0) {
    return [];
  }

  const recentSeries = await collectRecentSeriesInfo(titleId, 4);
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

async function collectRecentSeriesInfo(titleId: number, pages: number): Promise<GridSeries[]> {
  const collected: GridSeries[] = [];
  let after: string | null = null;

  for (let page = 0; page < pages; page += 1) {
    const connection = await fetchAllSeries({ first: 50, after, titleId });
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
    bullets.push("Recent-window stats are unavailable; using LAST_6_MONTHS aggregate metrics.");
    evidence.push({ reason: "recentStatsUnavailable" });
  }

  return { bullets, evidence };
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

async function fetchRecentTeamStats(teamId: string, startedAt: string | null) {
  if (!startedAt) {
    return null;
  }
  try {
    return await fetchTeamStatistics({
      teamId,
      filter: { timeWindow: "LAST_6_MONTHS", startedAt: { gte: startedAt } },
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

function buildMarkdown(report: { meta: { opponentTeam: { name: string | null }; lastXMatches: number }; sections: { commonStrategies: { bullets: string[] } } }) {
  const lines: string[] = [];
  lines.push(`# Scouting Report: ${report.meta.opponentTeam.name ?? "Unknown"}`);
  lines.push("");
  lines.push(`- Matches analyzed: ${report.meta.lastXMatches}`);
  if (report.sections.commonStrategies.bullets.length > 0) {
    lines.push("");
    lines.push("## Key Signals");
    report.sections.commonStrategies.bullets.slice(0, 3).forEach((bullet) => lines.push(`- ${bullet}`));
  }
  return lines.join("\n");
}
