export type TeamSummary = {
  winRate: number | null;
  avgKillsPerSeries: number | null;
  deathsPerRound: number | null;
  dataQuality: string[];
};

export type MapPoolEntry = {
  name: string;
  count: number | null;
  winRate: number | null;
};

export type MapPool = {
  maps: MapPoolEntry[];
  note?: string | null;
};

export type DraftTendency = {
  name: string;
  count: number | null;
  type?: string | null;
};

export type DraftTendencies = {
  picks: DraftTendency[];
  bans: DraftTendency[];
  compositions: string[];
  note?: string | null;
};

export type PlayerTendency = {
  playerId: string;
  name: string | null;
  winRate: number | null;
  killsAvg: number | null;
  deathsAvg: number | null;
};

export type PlayerTendencies = {
  players: PlayerTendency[];
  note?: string | null;
};

export type ScoutingInsights = {
  commonStrategies: string[];
  howToWin: string[];
  risks: string[];
};

export type ScoutingReport = {
  meta: {
    generatedAt: string;
    gameTitle: "val" | "lol";
    titleId: string;
    opponentTeamId: string;
    opponentTeamName: string;
    lastXMatches: number;
    timeWindow: "LAST_6_MONTHS";
    seriesIds: string[];
  };
  teamSummary: TeamSummary;
  mapPool: MapPool;
  draftTendencies: DraftTendencies;
  playerTendencies: PlayerTendencies;
  insights: ScoutingInsights;
};

export type Evidence = {
  seriesIds: string[];
  filters: Record<string, unknown>;
  statsSummary: Record<string, unknown>;
  timestamps: {
    generatedAt: string;
  };
};

export type ScoutingReportResult = {
  report: ScoutingReport;
  markdown: string;
  evidence: Evidence;
};