import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from "recharts";

interface TrendsSectionProps {
  winRate: number | null;
  winCount: number | null;
  mapStats: Array<{ name: string; count: number | null; winRate: number | null }>;
}

export function TrendsSection({ winRate, winCount, mapStats }: TrendsSectionProps) {
  // Derive wins vs losses
  const totalGames = winCount && winRate ? Math.round(winCount / winRate) : null;
  const losses = totalGames && winCount ? totalGames - winCount : null;

  const winData = winCount !== null && losses !== null ? [
    { name: "Wins", value: winCount, color: "#22d3ee" },
    { name: "Losses", value: losses, color: "#1e293b" },
  ] : [];

  const mapData = mapStats.slice(0, 5).map(m => ({
    name: m.name,
    winRate: m.winRate ? m.winRate * 100 : 0,
    count: m.count || 0
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <Card className="border-white/5 bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white text-sm font-medium">Win/Loss Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            {winData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={winData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {winData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0b1118", borderColor: "#1e293b", borderRadius: "8px" }}
                    itemStyle={{ color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                Insufficient data for win distribution
              </div>
            )}
          </div>
          {winCount !== null && (
            <div className="mt-4 flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-cyan-400" />
                <span className="text-xs text-slate-400">Wins: {winCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-slate-800" />
                <span className="text-xs text-slate-400">Losses: {losses}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/5 bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white text-sm font-medium">Map Performance (Win %)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            {mapData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mapData} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fill: "#94a3b8", fontSize: 12 }} 
                    width={80}
                  />
                  <Tooltip 
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{ backgroundColor: "#0b1118", borderColor: "#1e293b", borderRadius: "8px" }}
                    itemStyle={{ color: "#22d3ee" }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, "Win Rate"]}
                  />
                  <Bar dataKey="winRate" fill="#0891b2" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm italic">
                No map-level data available for this window
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
