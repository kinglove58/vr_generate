"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, ExternalLink, Calendar } from "lucide-react";

interface SeriesInfo {
  id: string;
  startTime: string;
  tournamentName: string;
  titleName: string;
  matchLabel: string;
}

export function LiveSeriesFeed() {
  const [series, setSeries] = useState<SeriesInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecent() {
      try {
        const res = await fetch("/api/recent-series");
        const data = await res.json();
        setSeries(data.series || []);
      } catch (err) {
        console.error("Failed to fetch live feed", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRecent();
    const interval = setInterval(fetchRecent, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="border-white/5 bg-white/5 backdrop-blur-sm no-print">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
          <Activity className="h-3 w-3 animate-pulse" />
          Live Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 w-full bg-white/5 animate-pulse rounded-lg" />
          ))
        ) : series.length > 0 ? (
          series.map((s) => (
            <div key={s.id} className="group p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/5">
              <div className="flex justify-between items-start mb-1">
                <Badge variant="outline" className="text-[9px] h-4 border-white/10 text-slate-400 px-1">
                  {s.titleName}
                </Badge>
                <div className="flex items-center gap-1 text-[9px] text-slate-500">
                  <Calendar className="h-2 w-2" />
                  {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="text-xs font-medium text-slate-200 truncate">{s.matchLabel}</div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">{s.tournamentName}</div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-xs text-slate-500 italic">No recent activity found</div>
        )}
      </CardContent>
    </Card>
  );
}
