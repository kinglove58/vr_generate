import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface MatchupHeaderProps {
  teamName: string;
  title: string;
  timeWindow: string;
  matchesCount: number;
}

export function MatchupHeader({ teamName, title, timeWindow, matchesCount }: MatchupHeaderProps) {
  return (
    <Card className="border-white/5 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 backdrop-blur-sm overflow-hidden mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-2xl font-bold text-white shadow-inner">
              {teamName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-white">{teamName}</h2>
                <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 uppercase">
                  {title}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-slate-400">
                <span>Window: <span className="text-slate-200">{timeWindow}</span></span>
                <span>•</span>
                <span>Matches: <span className="text-slate-200">{matchesCount}</span></span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="border-white/10 text-slate-400 font-normal">
              Data: Team-level
            </Badge>
            <Badge variant="outline" className="border-white/10 text-slate-400 font-normal">
              Source: GRID OA
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
