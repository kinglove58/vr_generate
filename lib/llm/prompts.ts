import type { ScoutingMetrics } from "@/lib/analysis/metrics";

export type PromptInput = {
  metrics: ScoutingMetrics;
  insights: string[];
};

export function buildLlmPrompt(input: PromptInput) {
  const system =
    "You are an esports analyst. Produce a scouting report strictly grounded in the provided metrics and insights. " +
    "Do not invent players, maps, or results that are not present. If data is missing, state limitations and return empty arrays where needed.";

  const user = [
    "Generate a JSON object that matches this schema:",
    "{",
    '  "executiveSummary": string,',
    '  "strengths": string[],',
    '  "weaknesses": string[],',
    '  "recommendations": string[],',
    '  "mapVetoSuggestions": string[],',
    '  "playersToWatch": [{ "name": string, "reason": string }]',
    "}",
    "Use ONLY the metrics and insights below.",
    "Metrics:",
    JSON.stringify(input.metrics, null, 2),
    "Insights:",
    JSON.stringify(input.insights, null, 2),
  ].join("\n");

  return { system, user };
}