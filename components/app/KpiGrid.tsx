import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent, formatNumber } from "@/lib/ui/format";
import { BarChart3, Target, Skull, Layers, History, Trophy } from "lucide-react";

interface KpiGridProps {
  stats: {
    winRate: number | null;
    winCount: number | null;
    killsAvg: number | null;
    deathsPerRound: number | null;
    seriesCount: number;
    gamesCount?: number | null;
  };
}

export function KpiGrid({ stats }: KpiGridProps) {
  const kpis = [
    {
      title: "Win Rate",
      value: formatPercent(stats.winRate),
      icon: Trophy,
      color: "text-yellow-400",
    },
    {
      title: "Series Count",
      value: stats.seriesCount.toString(),
      icon: History,
      color: "text-blue-400",
    },
    {
      title: "Avg Kills / Series",
      value: formatNumber(stats.killsAvg, 1),
      icon: Target,
      color: "text-red-400",
    },
    {
      title: "Deaths / Round",
      value: formatNumber(stats.deathsPerRound, 2),
      icon: Skull,
      color: "text-purple-400",
    },
    {
      title: "Aggregated IDs",
      value: stats.seriesCount.toString(),
      icon: Layers,
      color: "text-emerald-400",
    },
    {
      title: "Performance Score",
      value: stats.winRate ? (stats.winRate * 100).toFixed(0) : "N/A",
      icon: BarChart3,
      color: "text-cyan-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {kpis.map((kpi, i) => (
        <Card key={i} className="border-white/5 bg-white/5 backdrop-blur-sm overflow-hidden group hover:border-white/10 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {kpi.title}
            </CardTitle>
            <kpi.icon className={`h-4 w-4 ${kpi.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{kpi.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
