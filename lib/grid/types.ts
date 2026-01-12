export type GridTitle = {
  id: string;
  name: string | null;
  nameShortened: string | null;
};

export type GridTeam = {
  id: string;
  name: string | null;
  nameShortened: string | null;
};

export type GridPlayer = {
  id: string;
  nickname: string | null;
};

export type GridSeries = {
  id: string;
  startTimeScheduled: string | null;
  updatedAt: string | null;
  type: string | null;
  title: GridTitle | null;
  tournament: { id: string | null; name: string | null } | null;
  teams: GridTeam[];
  players: GridPlayer[];
  productServiceLevels: Array<{ productName: string | null; serviceLevel: string | null }>;
};

export type GridSeriesEdge = {
  series: GridSeries;
};

export type GridSeriesConnection = {
  totalCount: number | null;
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
  edges: GridSeriesEdge[];
};

export type TeamStatistics = {
  aggregationSeriesIds: string[];
  winCount: number | null;
  winRate: number | null;
  killsAvg: number | null;
  deathsPerRound: number | null;
};

export type PlayerStatistics = {
  winCount: number | null;
  winRate: number | null;
  killsAvg: number | null;
  deathsAvg: number | null;
};

export type GameStatistics = {
  mapStats: Array<{ name: string; count: number | null; winRate: number | null }>;
  avgDurationSeconds: number | null;
  selectionUsed: string;
};

export type SeriesStatistics = {
  selectionUsed: string;
  data: Record<string, unknown>;
};

export const SeriesTypeValues = ["BEST_OF", "HOME_AND_AWAY", "SINGLE_GAME"] as const;
export type SeriesType = (typeof SeriesTypeValues)[number];

export type GridEndState = {
  seriesId: string;
  state: "FINISHED" | "CANCELLED" | "BYE";
  score: {
    home: number;
    away: number;
  } | null;
};