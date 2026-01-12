import type { ScoutingMetrics } from "@/lib/analysis/metrics";

export function buildInsights(metrics: ScoutingMetrics): string[] {
  const insights: string[] = [];

  if (metrics.winRate !== null) {
    const pct = Math.round(metrics.winRate * 100);
    const decided = metrics.wins + metrics.losses;
    insights.push(
      `Series win rate ${pct}% across ${decided} decided series (out of ${metrics.sampleSize} total).`
    );
  } else if (metrics.sampleSize > 0) {
    insights.push("Series win rate unavailable due to missing winner data.");
  }

  if (metrics.recentForm.length > 0) {
    const windowSize = Math.min(metrics.recentForm.length, 5);
    const formSlice = metrics.recentForm.slice(0, windowSize);
    const compact = formSlice
      .map((entry) => (entry.outcome === "WIN" ? "W" : entry.outcome === "LOSS" ? "L" : "?"))
      .join("-");
    insights.push(`Recent form (most recent ${windowSize}): ${compact}.`);
  }

  const reliableMaps = metrics.mapWinRates.filter((map) => map.sampleSize >= 2);
  if (reliableMaps.length > 0) {
    const strongest = reliableMaps[0];
    const weakest = reliableMaps[reliableMaps.length - 1];

    if (strongest && strongest.winRate !== null) {
      insights.push(
        `Best map so far: ${strongest.mapName} (${Math.round(
          strongest.winRate * 100
        )}% win rate over ${strongest.sampleSize} maps).`
      );
    }

    if (
      weakest &&
      weakest.winRate !== null &&
      (weakest.mapName !== strongest.mapName || reliableMaps.length > 1)
    ) {
      insights.push(
        `Weakest map so far: ${weakest.mapName} (${Math.round(
          weakest.winRate * 100
        )}% win rate over ${weakest.sampleSize} maps).`
      );
    }
  } else if (metrics.mapWinRates.length > 0) {
    insights.push("Map win rates are based on a small sample and may be noisy.");
  }

  if (metrics.dataQuality.length > 0) {
    const notePreview = metrics.dataQuality.slice(0, 2).join(" ");
    insights.push(`Data quality notes: ${notePreview}`);
  }

  return insights;
}