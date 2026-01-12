import { z } from "zod";
import { requestGrid, GridGraphQLError, isFieldNotFound } from "@/lib/grid/client";
import {
  TITLES_QUERY,
  TEAMS_QUERY,
  ALL_SERIES_QUERY,
  SERIES_BY_ID_QUERY,
  SERIES_BY_ID_QUERY_NICKNAME_CAMEL,
} from "@/lib/grid/queries";
import type { GridSeriesConnection, GridSeries, GridTeam, GridTitle, GridPlayer } from "@/lib/grid/types";

const titleSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().optional().nullable(),
  nameShortened: z.string().optional().nullable(),
});

const teamSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().optional().nullable(),
  nameShortened: z.string().optional().nullable(),
});

const seriesTeamSchema = z.object({
  baseInfo: teamSchema.optional().nullable(),
});

const playerSchema = z.union([
  z.object({
    id: z.union([z.string(), z.number()]),
    nickname: z.string().optional().nullable(),
  }),
  z.object({
    id: z.union([z.string(), z.number()]),
    nickName: z.string().optional().nullable(),
  }),
]);

const seriesNodeSchema = z.object({
  id: z.union([z.string(), z.number()]),
  startTimeScheduled: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  title: titleSchema.optional().nullable(),
  tournament: z
    .object({
      id: z.union([z.string(), z.number()]).optional().nullable(),
      name: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  teams: z.array(seriesTeamSchema).optional().nullable(),
  players: z.array(playerSchema).optional().nullable(),
  productServiceLevels: z
    .array(
      z.object({
        productName: z.string().optional().nullable(),
        serviceLevel: z.string().optional().nullable(),
      })
    )
    .optional()
    .nullable(),
});

const seriesEdgeSchema = z.object({
  node: seriesNodeSchema,
});

const seriesConnectionSchema = z.object({
  totalCount: z.number().optional().nullable(),
  pageInfo: z.object({
    hasNextPage: z.boolean(),
    endCursor: z.string().optional().nullable(),
  }),
  edges: z.array(seriesEdgeSchema).default([]),
});

export type TeamsPage = {
  teams: GridTeam[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};

export async function fetchTitles(): Promise<GridTitle[]> {
  const data = await requestGrid<{ titles: unknown[] }>({
    endpoint: "central",
    query: TITLES_QUERY,
  });

  const schema = z.object({ titles: z.array(titleSchema) });
  const parsed = schema.parse(data);

  return parsed.titles.map((title) => ({
    id: String(title.id),
    name: title.name ?? null,
    nameShortened: title.nameShortened ?? null,
  }));
}

export async function fetchTeamsPage(first: number, after?: string | null): Promise<TeamsPage> {
  const data = await requestGrid({
    endpoint: "central",
    query: TEAMS_QUERY,
    variables: { first, after: after ?? null },
  });

  const schema = z.object({
    teams: z.object({
      pageInfo: z.object({
        hasNextPage: z.boolean(),
        endCursor: z.string().optional().nullable(),
      }),
      edges: z.array(z.object({ node: teamSchema })).default([]),
    }),
  });

  const parsed = schema.parse(data);
  const teams = parsed.teams.edges.map((edge) => ({
    id: String(edge.node.id),
    name: edge.node.name ?? null,
    nameShortened: edge.node.nameShortened ?? null,
  }));

  return {
    teams,
    pageInfo: {
      hasNextPage: parsed.teams.pageInfo.hasNextPage,
      endCursor: parsed.teams.pageInfo.endCursor ?? null,
    },
  };
}

export type TeamMatch = GridTeam & { score: number };

export async function searchTeamsByName(options: {
  query: string;
  maxPages?: number;
  pageSize?: number;
}): Promise<TeamMatch[]> {
  const normalizedTarget = normalizeName(options.query);
  const maxPages = options.maxPages ?? 4;
  const pageSize = options.pageSize ?? 50;

  let after: string | null = null;
  const matches: TeamMatch[] = [];

  for (let page = 0; page < maxPages; page += 1) {
    const pageData = await fetchTeamsPage(pageSize, after);
    for (const team of pageData.teams) {
      const score = scoreTeamMatch(normalizedTarget, team);
      if (score > 0) {
        matches.push({ ...team, score });
      }
    }

    if (!pageData.pageInfo.hasNextPage) {
      break;
    }
    after = pageData.pageInfo.endCursor;
  }

  return matches.sort((a, b) => b.score - a.score);
}

export async function fetchAllSeries(options: {
  first: number;
  after?: string | null;
  titleId?: number;
  tournamentNameContains?: string;
}): Promise<GridSeriesConnection> {
  const filter: Record<string, unknown> = {};
  if (typeof options.titleId === "number") {
    filter.titleId = options.titleId;
  }
  if (options.tournamentNameContains) {
    filter.tournament = { name: { contains: options.tournamentNameContains } };
  }

  const data = await requestGrid({
    endpoint: "central",
    query: ALL_SERIES_QUERY,
    variables: {
      first: options.first,
      after: options.after ?? null,
      filter: Object.keys(filter).length > 0 ? filter : null,
      orderBy: "StartTimeScheduled",
      orderDirection: "DESC",
    },
  });

  return mapSeriesConnection(data);
}

export async function fetchSeriesById(seriesId: string): Promise<GridSeries | null> {
  try {
    const data = await requestGrid({
      endpoint: "central",
      query: SERIES_BY_ID_QUERY,
      variables: { id: seriesId },
    });
    return mapSeriesById(data);
  } catch (error) {
    if (error instanceof GridGraphQLError && isFieldNotFound(error)) {
      const data = await requestGrid({
        endpoint: "central",
        query: SERIES_BY_ID_QUERY_NICKNAME_CAMEL,
        variables: { id: seriesId },
      });
      return mapSeriesById(data);
    }
    throw error;
  }
}

function mapSeriesConnection(data: unknown): GridSeriesConnection {
  const schema = z.object({ allSeries: seriesConnectionSchema });
  const parsed = schema.parse(data);

  return {
    totalCount: parsed.allSeries.totalCount ?? null,
    pageInfo: {
      hasNextPage: parsed.allSeries.pageInfo.hasNextPage,
      endCursor: parsed.allSeries.pageInfo.endCursor ?? null,
    },
    edges: parsed.allSeries.edges.map((edge) => ({ series: mapSeriesNode(edge.node) })),
  };
}

function mapSeriesById(data: unknown): GridSeries {
  const schema = z.object({ series: seriesNodeSchema });
  const parsed = schema.parse(data);
  return mapSeriesNode(parsed.series);
}

function mapSeriesNode(node: z.infer<typeof seriesNodeSchema>): GridSeries {
  const title = node.title
    ? {
        id: node.title.id ? String(node.title.id) : "",
        name: node.title.name ?? null,
        nameShortened: node.title.nameShortened ?? null,
      }
    : null;

  const teams = (node.teams ?? [])
    .map((team) => team.baseInfo)
    .filter(Boolean)
    .map((team) => ({
      id: String(team?.id),
      name: team?.name ?? null,
      nameShortened: team?.nameShortened ?? null,
    }));

  const players = (node.players ?? []).map((player) => {
    const record = player as { id?: string | number; nickname?: string | null; nickName?: string | null };
    return {
      id: record.id ? String(record.id) : "",
      nickname: record.nickname ?? record.nickName ?? null,
    };
  });

  const productServiceLevels = (node.productServiceLevels ?? []).map((entry) => ({
    productName: entry.productName ?? null,
    serviceLevel: entry.serviceLevel ?? null,
  }));

  return {
    id: String(node.id),
    startTimeScheduled: node.startTimeScheduled ?? null,
    updatedAt: node.updatedAt ?? null,
    type: node.type ?? null,
    title,
    tournament: node.tournament
      ? {
          id: node.tournament.id ? String(node.tournament.id) : null,
          name: node.tournament.name ?? null,
        }
      : null,
    teams,
    players,
    productServiceLevels,
  };
}

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreTeamMatch(target: string, team: GridTeam): number {
  const candidates = [team.name, team.nameShortened].filter(Boolean) as string[];
  let best = 0;

  for (const candidate of candidates) {
    const normalized = normalizeName(candidate);
    if (!normalized) {
      continue;
    }

    if (normalized === target) {
      return 1;
    }
    if (normalized.includes(target) || target.includes(normalized)) {
      best = Math.max(best, 0.9);
      continue;
    }

    const score = similarity(target, normalized);
    if (score > best) {
      best = score;
    }
  }

  return best >= 0.72 ? best : 0;
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
