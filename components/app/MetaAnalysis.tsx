"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Trophy, Ban, Map as MapIcon, Info } from "lucide-react";

interface MetaAnalysisProps {
  globalMeta: {
    game: any;
    series: any;
    draft: any;
  } | null;
  titleName: string;
}

export function MetaAnalysis({ globalMeta, titleName }: MetaAnalysisProps) {
  if (!globalMeta) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-xl bg-white/5">
        <Info className="h-8 w-8 text-slate-500 mb-4" />
        <p className="text-slate-400">Global meta data unavailable for this window.</p>
      </div>
    );
  }

  const mapStats = globalMeta.game?.mapStats || [];
  const topDraft = globalMeta.draft?.picks?.slice(0, 6) || [];
  const topBans = globalMeta.draft?.bans?.slice(0, 6) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-3 py-1">
          Global {titleName} Meta
        </Badge>
        <span className="text-xs text-slate-500">Aggregated across all tournament matches in window</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-white/5 bg-white/5 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <MapIcon className="h-4 w-4 text-cyan-400" />
            <CardTitle className="text-sm font-medium text-white">Map Popularity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mapStats.slice(0, 8)} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fill: "#94a3b8", fontSize: 11 }} 
                    width={90}
                  />
                  <Tooltip 
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{ backgroundColor: "#0b1118", borderColor: "#1e293b", borderRadius: "8px" }}
                    itemStyle={{ color: "#22d3ee" }}
                  />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-white/5 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <CardTitle className="text-sm font-medium text-white">High Priority Picks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDraft} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fill: "#94a3b8", fontSize: 11 }} 
                    width={90}
                  />
                  <Tooltip 
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{ backgroundColor: "#0b1118", borderColor: "#1e293b", borderRadius: "8px" }}
                    itemStyle={{ color: "#22d3ee" }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-white/5 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Ban className="h-4 w-4 text-rose-400" />
            <CardTitle className="text-sm font-medium text-white">Most Banned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topBans} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fill: "#94a3b8", fontSize: 11 }} 
                    width={90}
                  />
                  <Tooltip 
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{ backgroundColor: "#0b1118", borderColor: "#1e293b", borderRadius: "8px" }}
                    itemStyle={{ color: "#f43f5e" }}
                  />
                  <Bar dataKey="count" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-white/5 backdrop-blur-sm flex flex-col justify-center p-8">
           <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <Info className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Meta Insights</h3>
              <p className="text-sm text-slate-400">
                Understanding the global meta helps identify if a team is playing according to current power-levels or if they are innovators with unique pocket-picks.
              </p>
              <div className="pt-4 grid grid-cols-2 gap-4">
                 <div className="p-3 rounded-lg bg-white/5 text-left">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Total Matches</p>
                    <p className="text-xl font-bold text-white">{(globalMeta.game?.mapStats || []).reduce((acc: number, m: any) => acc + (m.count || 0), 0)}</p>
                 </div>
                 <div className="p-3 rounded-lg bg-white/5 text-left">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Avg Game Len</p>
                    <p className="text-xl font-bold text-white">{globalMeta.game?.avgDurationSeconds ? (globalMeta.game.avgDurationSeconds / 60).toFixed(1) + 'm' : 'N/A'}</p>
                 </div>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
}
