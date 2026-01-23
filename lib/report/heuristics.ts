import type { GridSeries, TeamStatistics, PlayerStatistics, GameStatistics } from "@/lib/grid/types";

export type StrategySection = { bullets: string[]; evidence: Record<string, unknown>[] };

export type PlayerHighlight = {
  playerId: string;
  nickname: string | null;
  bullets: string[];
  evidence: Record<string, unknown>[];
};

export type PlayerSection = { highlights: PlayerHighlight[] };

export type RosterSection = { bullets: string[]; evidence: Record<string, unknown>[] };

export type InsightSection = { bullets: string[]; evidence: Record<string, unknown>[] };

export type TeamArchetype = {
  name: string;
  description: string;
  icon: string;
  color: string;
};

export type DraftAnalysis = {
  picks: Array<{ name: string; count: number }>;
  bans: Array<{ name: string; count: number }>;
  bullets: string[];
};

export function buildDraftAnalysis(data: any): DraftAnalysis {
  const actions = data?.seriesStatistics?.draftActions || [];
  const picks: Array<{ name: string; count: number }> = [];
  const bans: Array<{ name: string; count: number }> = [];

  actions.forEach((action: any) => {
    const name = action.name || "Unknown";
    const type = String(action.type || "").toLowerCase();
    const count = typeof action.count === "number" ? action.count : 0;

    if (type.includes("pick")) {
      picks.push({ name, count });
    } else if (type.includes("ban")) {
      bans.push({ name, count });
    }
  });

  const sortedPicks = picks.sort((a, b) => b.count - a.count);
  const topPicks = sortedPicks.slice(0, 3);
  const bullets = topPicks.map((p) => `High priority pick: ${p.name} (${p.count} matches).`);

  if (bullets.length === 0 && actions.length > 0) {
    bullets.push("Draft data available but no clear pick patterns identified.");
  }

  return { picks: sortedPicks, bans: bans.sort((a, b) => b.count - a.count), bullets };
}

export function buildTeamArchetype(stats: TeamStatistics): TeamArchetype {
  const wr = stats.winRate ?? 0;
  const kps = stats.killsAvg ?? 0;
  const dpr = stats.deathsPerRound ?? 0;

  if (wr > 65 && kps > 18) {
    return {
      name: "The Juggernaut",
      description: "Dominant offensive force with high win consistency.",
      icon: "Zap",
      color: "text-yellow-400",
    };
  }

  if (wr > 55 && dpr < 0.7) {
    return {
      name: "The Iron Wall",
      description: "Highly disciplined defense and tactical efficiency.",
      icon: "Shield",
      color: "text-blue-400",
    };
  }

  if (kps > 20 && wr < 50) {
    return {
      name: "Glass Cannon",
      description: "Extremely aggressive but prone to tactical collapses.",
      icon: "Flame",
      color: "text-orange-500",
    };
  }

  if (wr < 40) {
    return {
      name: "The Underdog",
      description: "Currently struggling but has pockets of individual brilliance.",
      icon: "TrendingUp",
      color: "text-slate-400",
    };
  }

  return {
    name: "The Balanced Tactician",
    description: "Versatile playstyle with no major statistical weaknesses.",
    icon: "Crosshair",
    color: "text-emerald-400",
  };
}

export function buildCommonStrategies(input: {
  overall: TeamStatistics;
  recent?: TeamStatistics | null;
  durationSeconds?: number | null;
  mapStats?: GameStatistics | null;
}): StrategySection {
  const bullets: string[] = [];
  const evidence: Record<string, unknown>[] = [];

  if (input.overall.winRate !== null) {
    bullets.push(`Win rate ${formatPercent(input.overall.winRate)} over recent stats window.`);
    evidence.push({ metric: "winRate", value: input.overall.winRate, scope: "overall" });
  }

  if (input.overall.killsAvg !== null) {
    bullets.push(`Average kills per series: ${input.overall.killsAvg.toFixed(1)}.`);
    evidence.push({ metric: "killsAvg", value: input.overall.killsAvg, scope: "overall" });
  }

  if (input.overall.deathsPerRound !== null) {
    bullets.push(`Deaths per round: ${input.overall.deathsPerRound.toFixed(2)} (round segment).`);
    evidence.push({ metric: "deathsPerRound", value: input.overall.deathsPerRound, scope: "overall" });
  }

  if (input.durationSeconds) {
    const minutes = input.durationSeconds / 60;
    bullets.push(`Average game duration: ${minutes.toFixed(1)} minutes.`);
    evidence.push({ metric: "avgDurationSeconds", value: input.durationSeconds });
  }

  if (input.recent && input.recent.winRate !== null && input.overall.winRate !== null) {
    const delta = input.recent.winRate - input.overall.winRate;
    if (Math.abs(delta) >= 5) {
      bullets.push(
        `Recent form ${delta > 0 ? "improving" : "declining"}: ` +
          `${formatPercent(input.recent.winRate)} vs ${formatPercent(input.overall.winRate)} overall.`
      );
      evidence.push({
        metric: "winRateTrend",
        recent: input.recent.winRate,
        overall: input.overall.winRate,
      });
    }
  }

  if (bullets.length === 0) {
    bullets.push("Limited statistics available to infer strategy.");
  }

  return { bullets, evidence };
}

export function buildPlayerHighlights(players: Array<{ playerId: string; nickname: string | null; stats: PlayerStatistics }>): PlayerSection {
  const highlights: PlayerHighlight[] = [];

  const sortedByKills = [...players].sort((a, b) => (b.stats.killsAvg ?? 0) - (a.stats.killsAvg ?? 0));
  const topKills = sortedByKills[0];
  const sortedByDeaths = [...players].sort((a, b) => (a.stats.deathsAvg ?? Number.MAX_VALUE) - (b.stats.deathsAvg ?? Number.MAX_VALUE));
  const lowestDeaths = sortedByDeaths[0];

  if (topKills && topKills.stats.killsAvg !== null) {
    highlights.push({
      playerId: topKills.playerId,
      nickname: topKills.nickname,
      bullets: [`Top kills avg: ${topKills.stats.killsAvg.toFixed(1)}.`],
      evidence: [{ metric: "killsAvg", value: topKills.stats.killsAvg }],
    });
  }

  if (lowestDeaths && lowestDeaths.stats.deathsAvg !== null && lowestDeaths.playerId !== topKills?.playerId) {
    highlights.push({
      playerId: lowestDeaths.playerId,
      nickname: lowestDeaths.nickname,
      bullets: [`Lowest deaths avg: ${lowestDeaths.stats.deathsAvg.toFixed(1)}.`],
      evidence: [{ metric: "deathsAvg", value: lowestDeaths.stats.deathsAvg }],
    });
  }

  for (const player of players) {
    if (!player.stats.winRate) {
      continue;
    }
    if (player.stats.winRate >= 60 && !highlights.some((item) => item.playerId === player.playerId)) {
      highlights.push({
        playerId: player.playerId,
        nickname: player.nickname,
        bullets: [`High win rate: ${formatPercent(player.stats.winRate)}.`],
        evidence: [{ metric: "winRate", value: player.stats.winRate }],
      });
    }
  }

  return { highlights };
}

export function buildRosterPatterns(seriesList: GridSeries[]): RosterSection {
  const occurrence = new Map<string, { nickname: string | null; count: number }>();
  const totalSeries = seriesList.length;

  for (const series of seriesList) {
    const seen = new Set<string>();
    for (const player of series.players) {
      if (!player.id || seen.has(player.id)) {
        continue;
      }
      seen.add(player.id);
      const current = occurrence.get(player.id) ?? { nickname: player.nickname, count: 0 };
      current.count += 1;
      if (!current.nickname && player.nickname) {
        current.nickname = player.nickname;
      }
      occurrence.set(player.id, current);
    }
  }

  const corePlayers = Array.from(occurrence.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .filter(([, info]) => info.count >= Math.max(2, Math.ceil(totalSeries * 0.6)));

  if (corePlayers.length === 0) {
    return {
      bullets: ["Roster continuity is unclear from recent series."],
      evidence: [{ totalSeries }],
    };
  }

  const names = corePlayers.map(([, info]) => info.nickname ?? "Unknown").join(", ");
  const minCount = Math.min(...corePlayers.map(([, info]) => info.count));

  return {
    bullets: [`Most common roster core: ${names} appeared in ${minCount}/${totalSeries} series.`],
    evidence: corePlayers.map(([playerId, info]) => ({ playerId, count: info.count })),
  };
}

export function buildHowToWin(input: {
  overall: TeamStatistics;
  recent?: TeamStatistics | null;
  mapStats?: GameStatistics | null;
  playerHighlights: PlayerHighlight[];
}): InsightSection {
  const bullets: string[] = [];
  const evidence: Record<string, unknown>[] = [];

  if (input.recent && input.overall.winRate !== null && input.recent.winRate !== null) {
    const delta = input.recent.winRate - input.overall.winRate;
    if (delta < -5) {
      bullets.push("Momentum trending down; press early to exploit recent dip.");
      evidence.push({ metric: "winRateTrend", recent: input.recent.winRate, overall: input.overall.winRate });
    }
  }

  if (input.overall.deathsPerRound !== null && input.overall.deathsPerRound > 1.1) {
    bullets.push("Deaths per round are elevated; punish trades and slow the tempo.");
    evidence.push({ metric: "deathsPerRound", value: input.overall.deathsPerRound });
  }

  if (input.overall.killsAvg !== null && input.overall.killsAvg < 20) {
    bullets.push("Low kills per series; deny early fights and force utility trades.");
    evidence.push({ metric: "killsAvg", value: input.overall.killsAvg });
  }

  if (input.mapStats && input.mapStats.mapStats.length > 0) {
    const weakest = [...input.mapStats.mapStats]
      .filter((map) => map.winRate !== null)
      .sort((a, b) => (a.winRate ?? 0) - (b.winRate ?? 0))[0];
    if (weakest && weakest.winRate !== null) {
      bullets.push(`Target ${weakest.name} where win rate is ${formatPercent(weakest.winRate)}.`);
      evidence.push({ metric: "mapWinRate", map: weakest.name, winRate: weakest.winRate });
    }
  }

  const topKiller = input.playerHighlights[0];
  if (topKiller?.nickname) {
    bullets.push(`Focus shutdown on ${topKiller.nickname} to limit kill impact.`);
    evidence.push({ playerId: topKiller.playerId, metric: "killsAvg" });
  }

  if (bullets.length === 0) {
    bullets.push("Limited data; prioritize fundamentals and map veto preparation.");
  }

  return { bullets, evidence };
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return "N/A";
  }
  return `${Math.round(value)}%`;
}