import type { ScoutingMetrics } from "@/lib/analysis/metrics";
import type { LlmScoutingNarrative } from "@/lib/llm/schema";
import type { SeriesType } from "@/lib/grid/types";
import type { ScoutingReport } from "@/lib/report/types";

export type BuildReportInput = {
  opponentTeamId: string;
  titleId: number;
  types: SeriesType;
  lastN: number;
  dateRange?: { from: string; to: string } | null;
  seriesIds: string[];
  metrics: ScoutingMetrics;
  insights: string[];
  narrative: LlmScoutingNarrative;
  model: string;
};

export function buildScoutingReport(input: BuildReportInput): ScoutingReport {
  return {
    meta: {
      generatedAt: new Date().toISOString(),
      titleId: input.titleId,
      types: input.types,
      opponentTeamId: input.opponentTeamId,
      lastN: input.lastN,
      dateRange: input.dateRange ?? null,
      seriesIds: input.seriesIds,
      model: input.model,
      dataQuality: input.metrics.dataQuality,
    },
    metrics: input.metrics,
    insights: input.insights,
    narrative: input.narrative,
    charts: {
      recentForm: input.metrics.recentForm,
      mapWinRates: input.metrics.mapWinRates,
    },
  };
}