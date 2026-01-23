
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";

interface WinPredictorProps {
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

export function WinPredictor({ comparison }: WinPredictorProps) {
  const calculateWinProb = () => {
    let prob = 50;
    
    comparison.metrics.forEach(m => {
      const own = m.own || 0;
      const opp = m.opponent || 0;
      
      if (m.label === "Win Rate") {
        prob += (own - opp) * 100 * 0.4;
      } else if (m.label === "Kills/Series") {
        prob += (own - opp) * 1.5;
      } else if (m.label === "Deaths/Round") {
        prob += (opp - own) * 25; // Lower deaths is better
      }
    });

    return Math.min(Math.max(prob, 15), 85);
  };

  const winProb = calculateWinProb();
  const isFavorited = winProb > 55;
  const isUnderdog = winProb < 45;

  return (
    <Card className="border-cyan-500/20 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
            Match Projection
            <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400 font-normal">AI Powered</Badge>
          </CardTitle>
          <Info className="h-4 w-4 text-slate-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-6 rounded-full bg-slate-950 border border-white/5 mb-4 relative">
               <div className="absolute inset-0 bg-cyan-500/10 blur-xl rounded-full" />
               <div className="text-4xl font-black text-white z-10">{winProb.toFixed(1)}%</div>
               <div className="absolute -bottom-2 bg-cyan-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">Win Prob</div>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {isFavorited ? "Tactical Advantage" : isUnderdog ? "Underdog Position" : "Deadlock Match"}
            </h3>
            <p className="text-xs text-slate-400">
              {comparison.ownTeam.name} vs {comparison.opponentTeam.name}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
              <span className="text-cyan-400">{comparison.ownTeam.name}</span>
              <span className="text-slate-500">{comparison.opponentTeam.name}</span>
            </div>
            <div className="relative h-3 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-1000 ease-out"
                style={{ width: `${winProb}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded bg-slate-950/50 border border-white/5 text-center">
              <p className="text-[10px] text-slate-500 uppercase mb-1">Volatility</p>
              <div className="flex items-center justify-center gap-1 text-xs text-yellow-400 font-bold">
                <Minus className="h-3 w-3" />
                Medium
              </div>
            </div>
            <div className="p-2 rounded bg-slate-950/50 border border-white/5 text-center">
              <p className="text-[10px] text-slate-500 uppercase mb-1">Confidence</p>
              <div className="flex items-center justify-center gap-1 text-xs text-emerald-400 font-bold">
                <TrendingUp className="h-3 w-3" />
                High
              </div>
            </div>
            <div className="p-2 rounded bg-slate-950/50 border border-white/5 text-center">
              <p className="text-[10px] text-slate-500 uppercase mb-1">Meta Fit</p>
              <div className="flex items-center justify-center gap-1 text-xs text-cyan-400 font-bold">
                <TrendingUp className="h-3 w-3" />
                Optimal
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 italic text-center">
            *Projection based on historical aggregated series and segment-level data. Actual match outcomes may vary.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
