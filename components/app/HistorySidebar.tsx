
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getReportHistory, SavedReport, clearHistory } from "@/lib/storage/history";
import { Clock, Trash2, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HistorySidebarProps {
  onLoadReport: (data: any) => void;
  refreshTrigger: number;
}

export function HistorySidebar({ onLoadReport, refreshTrigger }: HistorySidebarProps) {
  const [history, setHistory] = useState<SavedReport[]>([]);

  useEffect(() => {
    setHistory(getReportHistory());
  }, [refreshTrigger]);

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  if (history.length === 0) return null;

  return (
    <Card className="border-white/5 bg-white/5 backdrop-blur-sm no-print">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Recent Reports
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-slate-500 hover:text-red-400"
          onClick={handleClear}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {history.map((report) => (
          <button
            key={report.id}
            onClick={() => onLoadReport(report.data)}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-900/40 border border-white/5 hover:border-cyan-500/30 hover:bg-slate-900/60 transition-all group text-left"
          >
            <div className="h-8 w-8 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {report.opponentName}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-tight">
                {report.title} • {new Date(report.timestamp).toLocaleDateString()}
              </p>
            </div>
            <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-cyan-400 transition-colors" />
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
