"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";

interface DraftAnalysisProps {
  draftAnalysis: {
    picks: Array<{ name: string; count: number }>;
    bans: Array<{ name: string; count: number }>;
    bullets: string[];
  };
}

export function DraftAnalysis({ draftAnalysis }: DraftAnalysisProps) {
  const hasData = draftAnalysis.picks.length > 0 || draftAnalysis.bans.length > 0;

  if (!hasData) {
    return (
      <Card className="border-white/5 bg-white/5">
        <CardContent className="py-10 text-center">
          <p className="text-slate-500">No draft data available for this team in the selected window.</p>
        </CardContent>
      </Card>
    );
  }

  // Combine top 10 picks/bans for visualization
  const chartData = draftAnalysis.picks.slice(0, 8).map(p => ({
    name: p.name,
    count: p.count,
    type: "Pick"
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-white/5 bg-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              Top Priority Picks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0b1118", borderColor: "#1e293b" }}
                    itemStyle={{ color: "#10b981" }}
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill="#10b981" fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              Pick Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {draftAnalysis.bullets.map((bullet, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cyan-500 shrink-0" />
                <p className="text-sm text-slate-300">{bullet}</p>
              </div>
            ))}
            
            <div className="pt-4 mt-4 border-t border-white/5">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Target Bans</h4>
              <div className="flex flex-wrap gap-2">
                {draftAnalysis.bans.slice(0, 5).map((ban, i) => (
                  <Badge key={i} variant="secondary" className="bg-red-500/10 text-red-400 border-red-500/20">
                    {ban.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
