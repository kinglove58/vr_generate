import type { GridEndState } from "@/lib/grid/types";

export type NormalizedTeam = {
  id: string;
  name?: string | null;
};

export type NormalizedTeamResult = {
  id: string;
  score?: number | null;
  isWinner?: boolean | null;
};

export type NormalizedMap = {
  id?: string | null;
  mapName?: string | null;
  winnerTeamId?: string | null;
  teams: NormalizedTeamResult[];
};

export type NormalizedSeries = {
  seriesId: string;
  startTimeScheduled?: string | null;
  teams: NormalizedTeam[];
  maps: NormalizedMap[];
  seriesWinnerTeamId?: string | null;
  dataQuality: string[];
};

export type NormalizedEndState = {
  series: NormalizedSeries;
  raw: Record<string, unknown>;
};

const TEAM_ARRAY_PATHS = [
  "series.teams",
  "series.participants",
  "series.competitors",
  "teams",
  "participants",
  "competitors",
  "data.series.teams",
  "data.series.participants",
  "data.series.competitors",
  "data.teams",
  "data.participants",
  "data.competitors",
];

const MAP_ARRAY_PATHS = [
  "series.maps",
  "series.games",
  "series.matches",
  "maps",
  "games",
  "matches",
  "data.series.maps",
  "data.series.games",
  "data.series.matches",
  "data.maps",
  "data.games",
  "data.matches",
];

/*
Assumed:
- Known payload paths cover the most common GRID end-state shapes.
- Missing fields remain null/empty rather than inferred.
Derived:
- Winner ids come only from explicit winner fields or winner flags.
*/
export function normalizeEndState(raw: GridEndState, seriesIdOverride?: string): NormalizedEndState {
  const root: Record<string, unknown> = isRecord(raw) ? raw : {};
  const notes = new Set<string>();
  const series = pickFirstObject(root, ["series", "data.series", "payload.series", "match.series"]);

  const seriesId =
    asString(series?.id) ??
    asString(root.seriesId) ??
    asString(root.id) ??
    seriesIdOverride ??
    "unknown";

  if (seriesId === "unknown") {
    notes.add("Series id missing in end-state payload.");
  }

  const startTimeScheduled = asString(series?.startTimeScheduled) ?? asString(root.startTimeScheduled) ?? null;
  if (!startTimeScheduled) {
    notes.add("Start time not found in end-state payload.");
  }

  const seriesWinnerTeamId = extractSeriesWinnerId(root, series) ?? null;
  if (!seriesWinnerTeamId) {
    notes.add("Series winner not found in end-state payload.");
  }

  const teams = extractTeams(root, notes);
  if (teams.length === 0) {
    notes.add("Teams not found in end-state payload.");
  }

  const maps = extractMaps(root, notes);
  if (maps.length === 0) {
    notes.add("Map list not found in end-state payload.");
  }

  return {
    series: {
      seriesId,
      startTimeScheduled,
      teams,
      maps,
      seriesWinnerTeamId,
      dataQuality: Array.from(notes),
    },
    raw: root,
  };
}

export function getSeriesTeamIds(series: NormalizedSeries): Set<string> {
  const ids = new Set<string>();
  series.teams.forEach((team) => ids.add(team.id));
  series.maps.forEach((map) => {
    map.teams.forEach((team) => ids.add(team.id));
  });
  return ids;
}

function extractSeriesWinnerId(root: Record<string, unknown>, series?: Record<string, unknown>) {
  const candidatePaths = [
    "winnerTeamId",
    "winner.id",
    "winner.team.id",
    "winnerId",
    "winningTeamId",
    "outcome.winner.id",
    "result.winner.id",
  ];

  for (const path of candidatePaths) {
    const value = series ? pickString(series, path) : null;
    if (value) {
      return value;
    }
  }

  for (const path of candidatePaths) {
    const value = pickString(root, path);
    if (value) {
      return value;
    }
  }

  return null;
}

function extractTeams(root: Record<string, unknown>, notes: Set<string>): NormalizedTeam[] {
  const teams = new Map<string, NormalizedTeam>();

  for (const path of TEAM_ARRAY_PATHS) {
    const array = pickFirstArray(root, path);
    if (!array || array.length === 0) {
      continue;
    }

    for (const entry of array) {
      const team = parseTeam(entry);
      if (team && !teams.has(team.id)) {
        teams.set(team.id, team);
      }
    }
  }

  if (teams.size === 0) {
    notes.add("No team objects were detected in known payload paths.");
  }

  return Array.from(teams.values());
}

function extractMaps(root: Record<string, unknown>, notes: Set<string>): NormalizedMap[] {
  const maps: NormalizedMap[] = [];
  let missingMapName = false;
  let missingWinner = false;

  for (const path of MAP_ARRAY_PATHS) {
    const array = pickFirstArray(root, path);
    if (!array || array.length === 0) {
      continue;
    }

    for (const entry of array) {
      const map = parseMap(entry);
      if (!map) {
        continue;
      }

      if (!map.mapName) {
        missingMapName = true;
      }
      if (!map.winnerTeamId) {
        missingWinner = true;
      }

      maps.push(map);
    }
  }

  if (missingMapName) {
    notes.add("Some maps are missing map names.");
  }
  if (missingWinner) {
    notes.add("Some maps are missing winner team ids.");
  }

  return maps;
}

function parseTeam(entry: unknown): NormalizedTeam | null {
  if (typeof entry === "string") {
    return { id: entry };
  }

  if (!isRecord(entry)) {
    return null;
  }

  const teamObject = isRecord(entry.team) ? entry.team : entry;
  const id =
    asString(teamObject.id) ??
    asString(entry.teamId) ??
    asString(entry.participantId) ??
    asString(entry.competitorId) ??
    asString(entry.id);

  if (!id) {
    return null;
  }

  const name =
    asString(teamObject.name) ??
    asString(teamObject.displayName) ??
    asString(teamObject.shortName) ??
    asString(teamObject.abbreviation) ??
    null;

  return { id, name };
}

function parseMap(entry: unknown): NormalizedMap | null {
  if (!isRecord(entry)) {
    return null;
  }

  const mapName =
    asString(pickValue(entry, "map.name")) ??
    asString(pickValue(entry, "map.displayName")) ??
    asString(entry.mapName) ??
    asString(entry.map);

  const id =
    asString(entry.id) ??
    asString(pickValue(entry, "map.id")) ??
    null;

  const teams = parseTeamResults(entry);

  let winnerTeamId =
    asString(entry.winnerTeamId) ??
    asString(entry.winnerId) ??
    asString(entry.winningTeamId) ??
    asString(pickValue(entry, "winner.id")) ??
    asString(pickValue(entry, "winner.team.id")) ??
    asString(pickValue(entry, "outcome.winner.id")) ??
    asString(pickValue(entry, "result.winner.id")) ??
    null;

  if (!winnerTeamId) {
    const winningTeam = teams.find((team) => team.isWinner);
    if (winningTeam) {
      winnerTeamId = winningTeam.id;
    }
  }

  return {
    id,
    mapName: mapName ?? null,
    winnerTeamId: winnerTeamId ?? null,
    teams,
  };
}

function parseTeamResults(entry: Record<string, unknown>): NormalizedTeamResult[] {
  const teamArrays = [
    entry.teams,
    entry.participants,
    entry.competitors,
    entry.sides,
    entry.results,
  ];

  for (const candidate of teamArrays) {
    if (!Array.isArray(candidate)) {
      continue;
    }

    const results = candidate
      .map((item) => {
        if (typeof item === "string") {
          return { id: item } as NormalizedTeamResult;
        }

        if (!isRecord(item)) {
          return null;
        }

        const teamObject =
          (isRecord(item.team) ? item.team : null) ??
          (isRecord(item.participant) ? item.participant : null) ??
          item;

        const id =
          asString(teamObject.id) ??
          asString(item.teamId) ??
          asString(item.participantId) ??
          asString(item.competitorId) ??
          asString(item.id);

        if (!id) {
          return null;
        }

        const score =
          asNumber(item.score) ??
          asNumber(item.points) ??
          asNumber(pickValue(item, "result.score")) ??
          asNumber(pickValue(item, "stats.score")) ??
          null;

        const isWinner = resolveWinnerFlag(item);

        return { id, score, isWinner } as NormalizedTeamResult;
      })
      .filter((item): item is NormalizedTeamResult => Boolean(item));

    if (results.length > 0) {
      return results;
    }
  }

  return [];
}

function resolveWinnerFlag(item: Record<string, unknown>): boolean | null {
  if (typeof item.isWinner === "boolean") {
    return item.isWinner;
  }

  const outcome = asString(item.outcome) ?? asString(pickValue(item, "result.outcome"));
  if (!outcome) {
    return null;
  }

  const normalized = outcome.toLowerCase();
  if (normalized === "win" || normalized === "won") {
    return true;
  }
  if (normalized === "loss" || normalized === "lost") {
    return false;
  }

  return null;
}

function pickFirstObject(root: Record<string, unknown>, paths: string[]): Record<string, unknown> | undefined {
  for (const path of paths) {
    const value = pickValue(root, path);
    if (isRecord(value)) {
      return value;
    }
  }
  return undefined;
}

function pickFirstArray(root: Record<string, unknown>, path: string): unknown[] | null {
  const value = pickValue(root, path);
  if (Array.isArray(value)) {
    return value;
  }
  return null;
}

function pickValue(root: Record<string, unknown>, path: string): unknown {
  const segments = path.split(".");
  let current: unknown = root;

  for (const segment of segments) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[segment];
  }

  return current;
}

function pickString(root: Record<string, unknown>, path: string): string | null {
  const value = pickValue(root, path);
  return asString(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  if (typeof value === "number") {
    return String(value);
  }
  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
