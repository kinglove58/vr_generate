"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent, formatNumber } from "@/lib/ui/format";

interface ComparisonViewProps {
  comparison: {
    ownTeam: { id: string; name: string };
    opponentTeam: { id: string; name: string };
    metrics: Array<{
      label: string;
      own: number | null;
      opponent: number | null;
      type: "percent" | "number";
    }>;
  };
}

export function ComparisonView({ comparison }: ComparisonViewProps) {
  return (
    <div className="space-y-6">
      <Card className="border-cyan-500/30 bg-cyan-500/5 backdrop-blur-sm">
        <CardHeader className="text-center border-b border-white/5 pb-6">
          <div className="flex items-center justify-around">
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Your Team</p>
              <h3 className="text-xl font-bold text-white">{comparison.ownTeam.name}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 font-bold italic">VS</div>
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Opponent</p>
              <h3 className="text-xl font-bold text-white">{comparison.opponentTeam.name}</h3>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          {comparison.metrics.map((metric, i) => {
            const ownVal = metric.own || 0;
            const oppVal = metric.opponent || 0;
            const total = ownVal + oppVal || 1;
            const ownPercent = (ownVal / total) * 100;
            
            return (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="text-left">
                    <p className="text-lg font-bold text-cyan-400">
                      {metric.type === "percent" ? formatPercent(metric.own) : formatNumber(metric.own, 1)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{metric.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">
                      {metric.type === "percent" ? formatPercent(metric.opponent) : formatNumber(metric.opponent, 1)}
                    </p>
                  </div>
                </div>
                <div className="relative h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-cyan-500 transition-all duration-500" 
                    style={{ width: `${ownPercent}%` }}
                  />
                  <div 
                    className="h-full bg-slate-600 transition-all duration-500" 
                    style={{ width: `${100 - ownPercent}%` }}
                  />
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 z-10" />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <Card className="border-white/5 bg-white/5 p-4">
            <h4 className="text-xs font-bold text-cyan-400 uppercase mb-2">Theoretical Edge</h4>
            <p className="text-sm text-slate-300">
              Based on the numbers, {comparison.ownTeam.name} shows a 
              {((comparison.metrics[0].own || 0) > (comparison.metrics[0].opponent || 0)) ? " higher " : " lower "}
              win rate than {comparison.opponentTeam.name} in this time window.
            </p>
         </Card>
         <Card className="border-white/5 bg-white/5 p-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Scout's Note</h4>
            <p className="text-sm text-slate-400 italic">
              "Numbers alone don't win games, but they reveal the path. Use these discrepancies to guide your prep."
            </p>
         </Card>
      </div>
    </div>
  );
}
