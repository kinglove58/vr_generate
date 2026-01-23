"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

interface PerformanceDNAProps {
  opponentStats: {
    winRate: number | null;
    killsAvg: number | null;
    deathsPerRound: number | null;
  };
  ownStats?: {
    winRate: number | null;
    killsAvg: number | null;
    deathsPerRound: number | null;
  } | null;
  opponentName: string;
  ownName?: string;
}

export function PerformanceDNA({ opponentStats, ownStats, opponentName, ownName }: PerformanceDNAProps) {
  // Normalize stats to 0-100 scale for radar
  const data = [
    {
      subject: "Win %",
      A: (opponentStats.winRate || 0) * 100,
      B: ownStats ? (ownStats.winRate || 0) * 100 : 50, // 50 is baseline
      fullMark: 100,
    },
    {
      subject: "Kills",
      A: Math.min(((opponentStats.killsAvg || 0) / 25) * 100, 100),
      B: ownStats ? Math.min(((ownStats.killsAvg || 0) / 25) * 100, 100) : 60,
      fullMark: 100,
    },
    {
      subject: "Efficiency",
      A: Math.max(100 - (opponentStats.deathsPerRound || 1) * 100, 0),
      B: ownStats ? Math.max(100 - (ownStats.deathsPerRound || 1) * 100, 0) : 70,
      fullMark: 100,
    },
    {
      subject: "Consistency",
      A: opponentStats.winRate ? opponentStats.winRate * 90 : 40,
      B: ownStats ? (ownStats.winRate ? ownStats.winRate * 90 : 40) : 50,
      fullMark: 100,
    },
    {
      subject: "Aggression",
      A: Math.min(((opponentStats.killsAvg || 0) / 20) * 110, 100),
      B: ownStats ? Math.min(((ownStats.killsAvg || 0) / 20) * 110, 100) : 65,
      fullMark: 100,
    },
  ];

  return (
    <Card className="border-white/5 bg-white/5 backdrop-blur-sm h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-white flex items-center justify-between">
          <span>Performance DNA</span>
          <div className="flex gap-4 text-[10px] uppercase tracking-tighter">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-cyan-500" />
              <span className="text-slate-400">{opponentName}</span>
            </div>
            {ownName && (
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="text-slate-400">{ownName}</span>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center items-center h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <Radar
              name={opponentName}
              dataKey="A"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.5}
            />
            {ownStats && (
              <Radar
                name={ownName}
                dataKey="B"
                stroke="#f43f5e"
                fill="#f43f5e"
                fillOpacity={0.3}
              />
            )}
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
