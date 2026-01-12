import { z } from "zod";
import { requestGrid, GridGraphQLError, GridRequestError, isRateLimitGraphQLError } from "@/app/server/grid/gridClient";
import {
  TITLES_QUERY,
  TEAMS_QUERY,
  TEAMS_QUERY_NO_FILTER,
  ALL_SERIES_QUERY,
  SERIES_BY_ID_QUERY,
  SERIES_BY_ID_QUERY_PLAYER_BASEINFO,
} from "@/app/server/grid/queries/centralDataQueries";
import { TEAM_STATISTICS_QUERY_IDS_ONLY } from "@/app/server/grid/queries/statsQueries";
import { mapTitlesResponse, mapTeamsResponse, mapSeriesConnection, mapSeriesById, type Series } from "@/app/server/grid/mappers";
import { mapWithConcurrency } from "@/lib/utils/concurrency";

export type ResolvedTitle = {
  titleId: string;
  titleName: string | null;
};

export type ResolvedTeam = {
  teamId: string;
  canonicalName: string;
};

export type ResolvedSeriesSet = {
  teamId: string;
  canonicalName: string;
  seriesIds: string[];
};

export class TeamNotFoundError extends Error {
  constructor(teamName: string) {
    super(`Team not found: ${teamName}`);
    this.name = "TeamNotFoundError";
  }
}

const SERIES_FETCH_CONCURRENCY = 2;

const TITLE_HINTS: Record<string, { id: string; aliases: string[] }> = {
  val: { id: "6", aliases: ["valorant", "val"] },
  lol: { id: "3", aliases: ["league of legends", "lol"] },
};

export async function resolveTitleId(gameTitle: "val" | "lol"): Promise<ResolvedTitle> {
  const data = await requestGrid<{ titles: unknown }>({
    endpoint: "centralData",
    query: TITLES_QUERY,
    cacheTtlMs: 12 * 60 * 60 * 1000,
    retries: 1,
  });

  const titles = mapTitlesResponse(data);
  const hint = TITLE_HINTS[gameTitle];
  const hintId = hint?.id;
  const hintAliases = hint?.aliases ?? [];

  const byId = hintId ? titles.find((title) => title.id === hintId) : undefined;
  if (byId) {
    return { titleId: byId.id, titleName: byId.name };
  }

  const byAlias = titles.find((title) => {
    const name = (title.name ?? "").toLowerCase();
    return hintAliases.some((alias) => name.includes(alias));
  });

  if (!byAlias) {
    throw new Error(`Title not found for game: ${gameTitle}`);
  }

  return { titleId: byAlias.id, titleName: byAlias.name };
}

export async function resolveTeamIdByName(
  opponentTeamName: string,
  titleId?: string
): Promise<ResolvedTeam> {
  const normalizedTarget = normalizeName(opponentTeamName);
  let after: string | null = null;
  let page = 0;
  let bestMatch: { score: number; teamId: string; name: string } | null = null;
  let useFilter = Boolean(titleId);

  while (page < 20) {
    const variables: Record<string, unknown> = {
      first: 50,
      after: after ?? null,
    };

    if (useFilter && titleId) {
      variables.filter = { titleIds: { in: [titleId] } };
    }

    let data: unknown;
    try {
      data = await requestGrid({
        endpoint: "centralData",
        query: useFilter ? TEAMS_QUERY : TEAMS_QUERY_NO_FILTER,
        variables,
        cacheTtlMs: 5 * 60 * 1000,
      });
    } catch (error) {
      if (useFilter && error instanceof GridGraphQLError && isUnsupportedFilterError(error)) {
        useFilter = false;
        continue;
      }
      throw error;
    }

    const connection = mapTeamsResponse(data);
    for (const team of connection.teams) {
      const candidateNames = [team.name, team.nameShortened].filter(Boolean) as string[];
      for (const candidate of candidateNames) {
        const normalizedCandidate = normalizeName(candidate);
        if (!normalizedCandidate) {
          continue;
        }

        if (normalizedCandidate === normalizedTarget) {
          return { teamId: team.id, canonicalName: team.name ?? candidate };
        }

        if (normalizedCandidate.includes(normalizedTarget) || normalizedTarget.includes(normalizedCandidate)) {
          const score = 0.92;
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { score, teamId: team.id, name: team.name ?? candidate };
          }
        } else {
          const score = similarity(normalizedTarget, normalizedCandidate);
          if (score >= 0.78 && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { score, teamId: team.id, name: team.name ?? candidate };
          }
        }
      }
    }

    if (!connection.pageInfo.hasNextPage) {
      break;
    }

    after = connection.pageInfo.endCursor;
    page += 1;
  }

  if (bestMatch) {
    return { teamId: bestMatch.teamId, canonicalName: bestMatch.name };
  }

  throw new TeamNotFoundError(opponentTeamName);
}

export async function resolveRecentSeriesIdsForTeam(options: {
  teamId: string;
  titleId: string;
  lastXMatches: number;
  timeWindow: "LAST_6_MONTHS";
}): Promise<string[]> {
  const startedAt = toStartedAt(options.timeWindow);
  const seriesIdsFromStats = await fetchAggregationSeriesIds(options.teamId, options.timeWindow);

  if (seriesIdsFromStats.length >= options.lastXMatches) {
    const seriesList = await mapWithConcurrency(seriesIdsFromStats, SERIES_FETCH_CONCURRENCY, (seriesId) =>
      fetchSeriesById(seriesId)
    );

    const sorted = seriesList
      .filter(Boolean)
      .sort((a, b) => getSeriesTimestamp(b) - getSeriesTimestamp(a));

    if (sorted.length >= options.lastXMatches) {
      return sorted.slice(0, options.lastXMatches).map((series) => series.id);
    }
    if (sorted.length > 0) {
      const seeded = sorted.map((series) => series.id);
      const remainder = await scanSeriesForTeamId({
        teamId: options.teamId,
        titleId: options.titleId,
        lastXMatches: options.lastXMatches - seeded.length,
        startedAt,
      });
      return mergeSeriesIds(seeded, remainder);
    }
  }

  return scanSeriesForTeamId({
    teamId: options.teamId,
    titleId: options.titleId,
    lastXMatches: options.lastXMatches,
    startedAt,
  });
}

async function scanSeriesForTeamId(options: {
  teamId: string;
  titleId: string;
  lastXMatches: number;
  startedAt: string;
}): Promise<string[]> {
  const collected: string[] = [];
  const collectedSet = new Set<string>();
  let after: string | null = null;
  let pages = 0;
  let useTeamFilter = true;
  let triedUnfiltered = false;
  let useTimeFilter = true;

  while (collected.length < options.lastXMatches && pages < 8) {
    const filter: Record<string, unknown> = {
      titleIds: { in: [options.titleId] },
    };
    if (useTimeFilter) {
      filter.startTimeScheduled = { gte: options.startedAt };
    }
    if (useTeamFilter) {
      filter.teamIds = { in: [options.teamId] };
    }

    let data: unknown;
    try {
      data = await requestGrid({
        endpoint: "centralData",
        query: ALL_SERIES_QUERY,
        variables: {
          first: 50,
          after,
          orderBy: "StartTimeScheduled",
          orderDirection: "DESC",
          filter,
        },
        cacheTtlMs: 60 * 1000,
      });
    } catch (error) {
      if (useTeamFilter && error instanceof GridGraphQLError && isUnsupportedTeamFilterError(error)) {
        useTeamFilter = false;
        continue;
      }
      if (useTimeFilter && error instanceof GridGraphQLError && isUnsupportedStartTimeFilterError(error)) {
        useTimeFilter = false;
        continue;
      }
      throw error;
    }

    const connection = mapSeriesConnection(data);
    if (useTeamFilter && connection.edges.length === 0 && !triedUnfiltered && !after) {
      useTeamFilter = false;
      triedUnfiltered = true;
      continue;
    }
    if (useTimeFilter && connection.edges.length === 0 && !after) {
      useTimeFilter = false;
      continue;
    }
    const seriesEdges = connection.edges.map((edge) => edge.series);
    const lookupIds: string[] = [];

    for (const series of seriesEdges) {
      if (!useTimeFilter && !isWithinTimeWindow(series, options.startedAt)) {
        continue;
      }

      if (useTeamFilter) {
        addSeriesId(series.id, collected, collectedSet);
        if (collected.length >= options.lastXMatches) {
          break;
        }
        continue;
      }

      if (series.teams.some((team) => team.id === options.teamId)) {
        addSeriesId(series.id, collected, collectedSet);
        if (collected.length >= options.lastXMatches) {
          break;
        }
        continue;
      }

      if (series.teams.length === 0) {
        lookupIds.push(series.id);
      }
    }

    if (collected.length < options.lastXMatches && lookupIds.length > 0) {
      const seriesBatch = await mapWithConcurrency(lookupIds, SERIES_FETCH_CONCURRENCY, (seriesId) =>
        fetchSeriesById(seriesId)
      );

      for (const series of seriesBatch) {
        if (!series) {
          continue;
        }
        if (!useTimeFilter && !isWithinTimeWindow(series, options.startedAt)) {
          continue;
        }
        const hasTeam = series.teams.some((team) => team.id === options.teamId);
        if (hasTeam) {
          addSeriesId(series.id, collected, collectedSet);
          if (collected.length >= options.lastXMatches) {
            break;
          }
        }
      }
    }

    if (!connection.pageInfo.hasNextPage) {
      break;
    }

    after = connection.pageInfo.endCursor;
    pages += 1;
  }

  return collected;
}

export async function resolveRecentSeriesForTeam(options: {
  teamId: string;
  canonicalName: string;
  searchName: string;
  titleId: string;
  lastXMatches: number;
  timeWindow: "LAST_6_MONTHS";
}): Promise<ResolvedSeriesSet> {
  const seriesIds = await resolveRecentSeriesIdsForTeam({
    teamId: options.teamId,
    titleId: options.titleId,
    lastXMatches: options.lastXMatches,
    timeWindow: options.timeWindow,
  });

  if (seriesIds.length > 0) {
    return { teamId: options.teamId, canonicalName: options.canonicalName, seriesIds };
  }

  const fallback = await scanSeriesForTeamName({
    teamName: options.searchName,
    titleId: options.titleId,
    lastXMatches: options.lastXMatches,
    timeWindow: options.timeWindow,
  });

  if (fallback) {
    return fallback;
  }

  return { teamId: options.teamId, canonicalName: options.canonicalName, seriesIds: [] };
}

async function scanSeriesForTeamName(options: {
  teamName: string;
  titleId: string;
  lastXMatches: number;
  timeWindow: "LAST_6_MONTHS";
}): Promise<ResolvedSeriesSet | null> {
  const normalizedTarget = normalizeName(options.teamName);
  const teamBuckets = new Map<
    string,
    { score: number; canonicalName: string; seriesIds: Set<string> }
  >();
  const seriesTimestamps = new Map<string, number>();
  const startedAt = toStartedAt(options.timeWindow);
  let useTimeFilter = true;

  let after: string | null = null;
  let pages = 0;

  while (pages < 8) {
    const filter: Record<string, unknown> = {
      titleIds: { in: [options.titleId] },
    };
    if (useTimeFilter) {
      filter.startTimeScheduled = { gte: startedAt };
    }

    let data: unknown;
    try {
      data = await requestGrid({
        endpoint: "centralData",
        query: ALL_SERIES_QUERY,
        variables: {
          first: 50,
          after,
          orderBy: "StartTimeScheduled",
          orderDirection: "DESC",
          filter,
        },
        cacheTtlMs: 60 * 1000,
      });
    } catch (error) {
      if (useTimeFilter && error instanceof GridGraphQLError && isUnsupportedStartTimeFilterError(error)) {
        useTimeFilter = false;
        continue;
      }
      throw error;
    }

    const connection = mapSeriesConnection(data);
    if (useTimeFilter && connection.edges.length === 0 && !after) {
      useTimeFilter = false;
      continue;
    }
    const seriesEdges = connection.edges.map((edge) => edge.series);
    const lookupIds: string[] = [];

    for (const series of seriesEdges) {
      if (!useTimeFilter && !isWithinTimeWindow(series, startedAt)) {
        continue;
      }
      if (series.teams.length > 0) {
        seriesTimestamps.set(series.id, getSeriesTimestamp(series));
        addTeamMatches(series, normalizedTarget, teamBuckets);
      } else {
        lookupIds.push(series.id);
      }
    }

    if (lookupIds.length > 0) {
      const seriesBatch = await mapWithConcurrency(lookupIds, SERIES_FETCH_CONCURRENCY, (seriesId) =>
        fetchSeriesById(seriesId)
      );

      for (const series of seriesBatch) {
        if (!series) {
          continue;
        }
        if (!useTimeFilter && !isWithinTimeWindow(series, startedAt)) {
          continue;
        }
        seriesTimestamps.set(series.id, getSeriesTimestamp(series));
        addTeamMatches(series, normalizedTarget, teamBuckets);
      }
    }

    const best = selectBestTeamBucket(teamBuckets);
    if (best && best.seriesIds.size >= options.lastXMatches && best.score >= 0.9) {
      break;
    }

    if (!connection.pageInfo.hasNextPage) {
      break;
    }

    after = connection.pageInfo.endCursor;
    pages += 1;
  }

  const best = selectBestTeamBucket(teamBuckets);
  if (!best) {
    return null;
  }

  const seriesIds = Array.from(best.seriesIds)
    .sort((a, b) => (seriesTimestamps.get(b) ?? 0) - (seriesTimestamps.get(a) ?? 0))
    .slice(0, options.lastXMatches);

  return {
    teamId: best.teamId,
    canonicalName: best.canonicalName,
    seriesIds,
  };
}

export async function fetchSeriesById(seriesId: string): Promise<Series | null> {
  try {
    const data = await requestGrid({
      endpoint: "centralData",
      query: SERIES_BY_ID_QUERY,
      variables: { id: seriesId },
      cacheTtlMs: 10 * 60 * 1000,
    });
    return mapSeriesById(data);
  } catch (error) {
    if (error instanceof GridGraphQLError) {
      if (isRateLimitGraphQLError(error)) {
        throw error;
      }
      if (isPlayerBaseInfoMissing(error)) {
        const data = await requestGrid({
          endpoint: "centralData",
          query: SERIES_BY_ID_QUERY_PLAYER_BASEINFO,
          variables: { id: seriesId },
          cacheTtlMs: 10 * 60 * 1000,
        });
        return mapSeriesById(data);
      }
      if (isNotFoundGraphQLError(error)) {
        return null;
      }
      throw error;
    }
    if (error instanceof GridRequestError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

async function fetchAggregationSeriesIds(teamId: string, timeWindow: "LAST_6_MONTHS") {
  const schema = z.object({
    teamStatistics: z.object({
      aggregationSeriesIds: z.array(z.union([z.string(), z.number()])).optional().nullable(),
    }),
  });

  try {
    const data = await requestGrid({
      endpoint: "statistics",
      query: TEAM_STATISTICS_QUERY_IDS_ONLY,
      variables: { teamId, filter: { timeWindow } },
      cacheTtlMs: 60 * 1000,
      retries: 1,
    });

    const parsed = schema.parse(data);
    const ids = parsed.teamStatistics.aggregationSeriesIds ?? [];
    return ids.map((id) => String(id));
  } catch (error) {
    if (error instanceof GridGraphQLError && isUnsupportedAggregationError(error)) {
      return [];
    }
    throw error;
  }
}

function getSeriesTimestamp(series: Series): number {
  const raw = series.startTimeScheduled ?? series.updatedAt ?? "";
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchTeamName(
  normalizedTarget: string,
  name: string | null,
  nameShortened: string | null
): { score: number; name: string } | null {
  const candidates = [name, nameShortened].filter(Boolean) as string[];
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeName(candidate);
    if (!normalizedCandidate) {
      continue;
    }

    if (normalizedCandidate === normalizedTarget) {
      return { score: 1, name: candidate };
    }

    if (normalizedCandidate.includes(normalizedTarget) || normalizedTarget.includes(normalizedCandidate)) {
      return { score: 0.92, name: candidate };
    }

    const score = similarity(normalizedTarget, normalizedCandidate);
    if (score >= 0.78) {
      return { score, name: candidate };
    }
  }

  return null;
}

function addTeamMatches(
  series: Series,
  normalizedTarget: string,
  teamBuckets: Map<string, { score: number; canonicalName: string; seriesIds: Set<string> }>
) {
  for (const team of series.teams) {
    const matched = matchTeamName(normalizedTarget, team.name, team.nameShortened);
    if (!matched) {
      continue;
    }

    const bucket = teamBuckets.get(team.id) ?? {
      score: matched.score,
      canonicalName: matched.name,
      seriesIds: new Set<string>(),
    };
    if (matched.score > bucket.score) {
      bucket.score = matched.score;
      bucket.canonicalName = matched.name;
    }
    bucket.seriesIds.add(series.id);
    teamBuckets.set(team.id, bucket);
  }
}

function addSeriesId(seriesId: string, collected: string[], collectedSet: Set<string>) {
  if (!collectedSet.has(seriesId)) {
    collected.push(seriesId);
    collectedSet.add(seriesId);
  }
}

function selectBestTeamBucket(
  buckets: Map<string, { score: number; canonicalName: string; seriesIds: Set<string> }>
): { teamId: string; score: number; canonicalName: string; seriesIds: Set<string> } | null {
  let best: { teamId: string; score: number; canonicalName: string; seriesIds: Set<string> } | null =
    null;
  for (const [teamId, bucket] of buckets.entries()) {
    if (!best) {
      best = { teamId, ...bucket };
      continue;
    }
    if (bucket.score > best.score) {
      best = { teamId, ...bucket };
      continue;
    }
    if (bucket.score === best.score && bucket.seriesIds.size > best.seriesIds.size) {
      best = { teamId, ...bucket };
    }
  }

  return best;
}

function toStartedAt(timeWindow: "LAST_6_MONTHS") {
  if (timeWindow === "LAST_6_MONTHS") {
    const now = new Date();
    const past = new Date(now);
    past.setMonth(past.getMonth() - 6);
    return past.toISOString();
  }
  return new Date().toISOString();
}

function similarity(a: string, b: string): number {
  const distance = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) {
    return 1;
  }
  return 1 - distance / maxLen;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => []);

  for (let i = 0; i <= a.length; i += 1) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= b.length; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function isUnsupportedFilterError(error: GridGraphQLError): boolean {
  return error.errors.some((entry) => {
    const message = entry.message.toLowerCase();
    return message.includes("teamfilter") || message.includes("filter") || message.includes("unknown");
  });
}

function isUnsupportedTeamFilterError(error: GridGraphQLError): boolean {
  return error.errors.some((entry) => {
    const message = entry.message.toLowerCase();
    return message.includes("teamids") || message.includes("unknown");
  });
}

function isUnsupportedStartTimeFilterError(error: GridGraphQLError): boolean {
  return error.errors.some((entry) => {
    const message = entry.message.toLowerCase();
    return message.includes("starttimescheduled") || message.includes("datetimefilter");
  });
}

function isNotFoundGraphQLError(error: GridGraphQLError): boolean {
  return error.errors.some((entry) => {
    const message = entry.message.toLowerCase();
    return message.includes("not found") || message.includes("no series") || message.includes("unknown id");
  });
}

function isPlayerBaseInfoMissing(error: GridGraphQLError): boolean {
  return error.errors.some((entry) => {
    const message = entry.message.toLowerCase();
    return message.includes("players/baseinfo") || message.includes("field 'baseinfo'");
  });
}

function isUnsupportedAggregationError(error: GridGraphQLError): boolean {
  return error.errors.some((entry) => {
    const message = entry.message.toLowerCase();
    return message.includes("aggregationseriesids") && message.includes("cannot query");
  });
}

function isWithinTimeWindow(series: Series, startedAt: string): boolean {
  const threshold = Date.parse(startedAt);
  if (!Number.isFinite(threshold)) {
    return true;
  }
  return getSeriesTimestamp(series) >= threshold;
}

function mergeSeriesIds(seed: string[], additional: string[]): string[] {
  const merged = new Set(seed);
  for (const id of additional) {
    merged.add(id);
  }
  return Array.from(merged);
}
