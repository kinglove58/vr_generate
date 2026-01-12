import type { ScoutingMetrics, RecentFormEntry, MapWinRate } from "@/lib/analysis/metrics";
import type { LlmScoutingNarrative } from "@/lib/llm/schema";
import type { SeriesType } from "@/lib/grid/types";

export type ScoutingReportMeta = {
  generatedAt: string;
  titleId: number;
  types: SeriesType;
  opponentTeamId: string;
  lastN: number;
  dateRange?: { from: string; to: string } | null;
  seriesIds: string[];
  model: string;
  dataQuality: string[];
};

export type ScoutingReport = {
  meta: ScoutingReportMeta;
  metrics: ScoutingMetrics;
  insights: string[];
  narrative: LlmScoutingNarrative;
  charts: {
    recentForm: RecentFormEntry[];
    mapWinRates: MapWinRate[];
  };
};