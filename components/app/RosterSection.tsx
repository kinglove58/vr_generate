"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPercent, formatNumber } from "@/lib/ui/format";
import { User } from "lucide-react";

interface RosterSectionProps {
  playerTendencies: {
    highlights: Array<{
      playerId: string;
      nickname: string | null;
      bullets: string[];
      evidence: any[];
    }>;
  };
  playerStats: Array<{
    playerId: string;
    nickname: string | null;
    stats: {
      winRate: number | null;
      killsAvg: number | null;
      deathsAvg: number | null;
    };
  }>;
}

export function RosterSection({ playerTendencies, playerStats }: RosterSectionProps) {
  const hasData = playerStats && playerStats.length > 0;

  if (!hasData) {
    return (
      <Card className="border-white/5 bg-white/5">
        <CardContent className="py-10 text-center">
          <p className="text-slate-500">No player-level data available for this team.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {playerTendencies.highlights.map((highlight, i) => (
          <Card key={i} className="border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-cyan-400" />
                </div>
                <CardTitle className="text-sm font-bold text-white">
                  {highlight.nickname || "Unknown Player"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {highlight.bullets.map((bullet, j) => (
                  <li key={j} className="text-xs text-cyan-200/70 flex items-start gap-2">
                    <span className="mt-1 h-1 w-1 rounded-full bg-cyan-400 shrink-0" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/5 bg-white/5 overflow-hidden">
        <CardHeader className="border-b border-white/5">
          <CardTitle className="text-sm font-semibold text-white">Full Roster Performance</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Player</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest text-right">Win Rate</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest text-right">Avg Kills</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest text-right">Avg Deaths</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {playerStats.map((player) => (
              <TableRow key={player.playerId} className="border-white/5 hover:bg-white/5 transition-colors">
                <TableCell className="font-medium text-white">{player.nickname || "N/A"}</TableCell>
                <TableCell className="text-right text-slate-300">{formatPercent(player.stats.winRate)}</TableCell>
                <TableCell className="text-right text-slate-300">{formatNumber(player.stats.killsAvg, 1)}</TableCell>
                <TableCell className="text-right text-slate-300">{formatNumber(player.stats.deathsAvg, 1)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
