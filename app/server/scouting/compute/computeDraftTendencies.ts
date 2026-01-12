import { requestGrid, GridGraphQLError } from "@/app/server/grid/gridClient";
import { buildSeriesStatisticsQuery } from "@/app/server/grid/queries/statsQueries";
import type { DraftTendencies } from "@/app/server/scouting/types";

export type DraftTendenciesResult = {
  draftTendencies: DraftTendencies;
  raw: Record<string, unknown>;
};

const DRAFT_SELECTIONS = [
  "draftActions { id name type count category role }",
  "draftActions { id name type count role }",
  "draftActions { id name type count }",
  "draftActions { name type count }",
];

export async function computeDraftTendencies(options: {
  titleId: string;
  timeWindow: "LAST_6_MONTHS";
}): Promise<DraftTendenciesResult> {
  const startedAt = toStartedAt(options.timeWindow);
  let data: unknown = null;
  let selectionUsed = "";

  for (const selection of DRAFT_SELECTIONS) {
    try {
      data = await requestGrid({
        endpoint: "statistics",
        query: buildSeriesStatisticsQuery(selection),
        variables: { titleId: options.titleId, filter: { startedAt: { gte: startedAt } } },
        cacheTtlMs: 5 * 60 * 1000,
      });
      selectionUsed = selection;
      break;
    } catch (error) {
      if (error instanceof GridGraphQLError && isFieldNotFound(error)) {
        continue;
      }
      throw error;
    }
  }

  if (!data) {
    return {
      draftTendencies: { picks: [], bans: [], compositions: [], note: "Draft data unavailable." },
      raw: {},
    };
  }

  const stats = (data as { seriesStatistics?: Record<string, unknown> }).seriesStatistics ?? {};
  const actions = Array.isArray(stats.draftActions) ? stats.draftActions : [];

  const picks: DraftTendencies["picks"] = [];
  const bans: DraftTendencies["bans"] = [];
  const compositions: Record<string, number> = {};

  for (const item of actions) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name : null;
    if (!name) {
      continue;
    }

    const type = typeof record.type === "string" ? record.type : null;
    const count = toNumber(record.count);

    const entry = { name, count, type };
    if (type && type.toLowerCase().includes("ban")) {
      bans.push(entry);
    } else if (type && type.toLowerCase().includes("pick")) {
      picks.push(entry);
    } else {
      picks.push(entry);
    }

    const category = typeof record.category === "string" ? record.category : null;
    const role = typeof record.role === "string" ? record.role : null;
    const bucket = category ?? role;
    if (bucket) {
      compositions[bucket] = (compositions[bucket] ?? 0) + (count ?? 1);
    }
  }

  const compositionList = Object.entries(compositions)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  const note = actions.length === 0 ? "Draft actions not available in statistics feed." : null;

  const sortedPicks = picks.sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  const sortedBans = bans.sort((a, b) => (b.count ?? 0) - (a.count ?? 0));

  return {
    draftTendencies: {
      picks: sortedPicks.slice(0, 8),
      bans: sortedBans.slice(0, 8),
      compositions: compositionList.slice(0, 5),
      note,
    },
    raw: { selectionUsed, actionCount: actions.length },
  };
}

function toStartedAt(timeWindow: "LAST_6_MONTHS"): string {
  if (timeWindow === "LAST_6_MONTHS") {
    const now = new Date();
    const past = new Date(now);
    past.setMonth(past.getMonth() - 6);
    return past.toISOString();
  }
  return new Date().toISOString();
}

function isFieldNotFound(error: GridGraphQLError): boolean {
  return error.errors.some((entry) => {
    const message = entry.message.toLowerCase();
    return message.includes("cannot query field") || message.includes("field_not_found");
  });
}

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
