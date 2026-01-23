
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Target, ShieldAlert, Swords } from "lucide-react";

interface ScoutsInsightProps {
  comparison: {
    ownTeam: { name: string };
    opponentTeam: { name: string };
    metrics: Array<{
      label: string;
      own: number | null;
      opponent: number | null;
      type: "percent" | "number";
    }>;
  };
}

export function ScoutsInsight({ comparison }: ScoutsInsightProps) {
  const getInsights = () => {
    const insights = [];
    const wr = comparison.metrics.find(m => m.label === "Win Rate");
    const kills = comparison.metrics.find(m => m.label === "Kills/Series");
    const deaths = comparison.metrics.find(m => m.label === "Deaths/Round");

    if (wr && (wr.own || 0) > (wr.opponent || 0) + 0.1) {
      insights.push({
        icon: Target,
        title: "Macro Dominance",
        text: `You have a significant win rate advantage. Focus on standard play and avoid high-variance gambles.`,
        color: "text-emerald-400"
      });
    } else if (wr) {
      insights.push({
        icon: ShieldAlert,
        title: "Uphill Battle",
        text: `${comparison.opponentTeam.name} is statistically more consistent. Look for unconventional 'cheese' strats or early aggression to disrupt them.`,
        color: "text-orange-400"
      });
    }

    if (kills && (kills.own || 0) > (kills.opponent || 0) + 2) {
      insights.push({
        icon: Swords,
        title: "Firepower Edge",
        text: `Your team averages more kills. Force skirmishes and individual duels where your mechanics can shine.`,
        color: "text-cyan-400"
      });
    }

    if (deaths && (deaths.own || 0) < (deaths.opponent || 0) - 0.05) {
      insights.push({
        icon: Lightbulb,
        title: "Efficiency Gap",
        text: `The opponent dies more frequently per round. Play for late-round scenarios where their lack of discipline usually shows.`,
        color: "text-yellow-400"
      });
    }

    return insights.slice(0, 3);
  };

  const insights = getInsights();

  return (
    <Card className="border-white/5 bg-white/5 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-yellow-400" />
          Scout's Tactical Brief
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, i) => (
          <div key={i} className="flex gap-3 p-3 rounded-lg bg-slate-900/50 border border-white/5">
            <div className={`mt-1 ${insight.color}`}>
              <insight.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">{insight.title}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{insight.text}</p>
            </div>
          </div>
        ))}
        {insights.length === 0 && (
          <p className="text-xs text-slate-500 italic text-center py-4">
            Insufficient comparative data for specific tactical insights.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
