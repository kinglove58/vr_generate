import { z } from "zod";

const titleSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().optional().nullable(),
});

const teamNodeSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().optional().nullable(),
  nameShortened: z.string().optional().nullable(),
});

const teamEdgeSchema = z.object({
  node: teamNodeSchema,
});

const pageInfoSchema = z.object({
  hasNextPage: z.boolean(),
  endCursor: z.string().optional().nullable(),
});

const teamsConnectionSchema = z.object({
  pageInfo: pageInfoSchema,
  edges: z.array(teamEdgeSchema).default([]),
});

const seriesTeamSchema = z.object({
  baseInfo: z
    .object({
      id: z.union([z.string(), z.number()]),
      name: z.string().optional().nullable(),
      nameShortened: z.string().optional().nullable(),
      logoUrl: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

const seriesPlayerSchema = z.union([
  z.object({
    baseInfo: z
      .object({
        id: z.union([z.string(), z.number()]),
        name: z.string().optional().nullable(),
        nickName: z.string().optional().nullable(),
      })
      .optional()
      .nullable(),
  }),
  z.object({
    id: z.union([z.string(), z.number()]),
    name: z.string().optional().nullable(),
    nickName: z.string().optional().nullable(),
  }),
]);

const seriesNodeSchema = z.object({
  id: z.union([z.string(), z.number()]),
  startTimeScheduled: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  title: z
    .object({
      id: z.union([z.string(), z.number()]).optional().nullable(),
      name: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  tournament: z
    .object({
      id: z.union([z.string(), z.number()]).optional().nullable(),
      name: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  teams: z.array(seriesTeamSchema).optional().nullable(),
  players: z.array(seriesPlayerSchema).optional().nullable(),
});

const seriesEdgeSchema = z.object({
  cursor: z.string().optional().nullable(),
  node: seriesNodeSchema,
});

const seriesConnectionSchema = z.object({
  totalCount: z.number().optional().nullable(),
  pageInfo: pageInfoSchema,
  edges: z.array(seriesEdgeSchema).default([]),
});

export type Title = {
  id: string;
  name: string | null;
};

export type Team = {
  id: string;
  name: string | null;
  nameShortened: string | null;
};

export type SeriesTeam = {
  id: string;
  name: string | null;
  nameShortened: string | null;
  logoUrl: string | null;
};

export type SeriesPlayer = {
  id: string;
  name: string | null;
  nickName: string | null;
};

export type Series = {
  id: string;
  startTimeScheduled: string | null;
  updatedAt: string | null;
  type: string | null;
  titleId: string | null;
  titleName: string | null;
  tournamentName: string | null;
  teams: SeriesTeam[];
  players: SeriesPlayer[];
};

export function mapTitlesResponse(data: unknown): Title[] {
  const schema = z.object({ titles: z.array(titleSchema) });
  const parsed = schema.parse(data);

  return parsed.titles.map((title) => ({
    id: String(title.id),
    name: title.name ?? null,
  }));
}

export type TeamsConnection = {
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
  teams: Team[];
};

export function mapTeamsResponse(data: unknown): TeamsConnection {
  const schema = z.object({ teams: teamsConnectionSchema });
  const parsed = schema.parse(data);

  const teams = parsed.teams.edges.map((edge) => ({
    id: String(edge.node.id),
    name: edge.node.name ?? null,
    nameShortened: edge.node.nameShortened ?? null,
  }));

  return {
    pageInfo: {
      hasNextPage: parsed.teams.pageInfo.hasNextPage,
      endCursor: parsed.teams.pageInfo.endCursor ?? null,
    },
    teams,
  };
}

export type SeriesConnection = {
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
  totalCount: number | null;
  edges: Array<{ cursor: string | null; series: Series }>;
};

export function mapSeriesConnection(data: unknown): SeriesConnection {
  const schema = z.object({ allSeries: seriesConnectionSchema });
  const parsed = schema.parse(data);

  const edges = parsed.allSeries.edges.map((edge) => ({
    cursor: edge.cursor ?? null,
    series: mapSeriesNode(edge.node),
  }));

  return {
    pageInfo: {
      hasNextPage: parsed.allSeries.pageInfo.hasNextPage,
      endCursor: parsed.allSeries.pageInfo.endCursor ?? null,
    },
    totalCount: parsed.allSeries.totalCount ?? null,
    edges,
  };
}

export function mapSeriesById(data: unknown): Series {
  const schema = z.object({ series: seriesNodeSchema });
  const parsed = schema.parse(data);
  return mapSeriesNode(parsed.series);
}

function mapSeriesNode(node: z.infer<typeof seriesNodeSchema>): Series {
  const teams = (node.teams ?? [])
    .map((team) => team.baseInfo)
    .filter((baseInfo): baseInfo is NonNullable<typeof baseInfo> => Boolean(baseInfo))
    .map((team) => ({
      id: String(team.id),
      name: team.name ?? null,
      nameShortened: team.nameShortened ?? null,
      logoUrl: team.logoUrl ?? null,
    }));

  const players = (node.players ?? [])
    .map((player) => {
      if ("baseInfo" in player && player.baseInfo) {
        return {
          id: player.baseInfo.id,
          name: player.baseInfo.name ?? null,
          nickName: player.baseInfo.nickName ?? null,
        };
      }
      if ("id" in player) {
        return {
          id: player.id,
          name: player.name ?? null,
          nickName: player.nickName ?? null,
        };
      }
      return null;
    })
    .filter((player): player is { id: string | number; name: string | null; nickName: string | null } =>
      Boolean(player)
    )
    .map((player) => ({
      id: String(player.id),
      name: player.name,
      nickName: player.nickName,
    }));

  return {
    id: String(node.id),
    startTimeScheduled: node.startTimeScheduled ?? null,
    updatedAt: node.updatedAt ?? null,
    type: node.type ?? null,
    titleId: node.title?.id ? String(node.title.id) : null,
    titleName: node.title?.name ?? null,
    tournamentName: node.tournament?.name ?? null,
    teams,
    players,
  };
}
