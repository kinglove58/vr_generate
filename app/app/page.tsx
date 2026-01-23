"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { ReportForm, ReportFormValues } from "@/components/app/ReportForm";
import { MatchupHeader } from "@/components/app/MatchupHeader";
import { KpiGrid } from "@/components/app/KpiGrid";
import { InsightsPanel } from "@/components/app/InsightsPanel";
import { TrendsSection } from "@/components/app/TrendsSection";
import { EvidenceSection } from "@/components/app/EvidenceSection";
import { ExportSection } from "@/components/app/ExportSection";
import { DraftAnalysis } from "@/components/app/DraftAnalysis";
import { RosterSection } from "@/components/app/RosterSection";
import { ComparisonView } from "@/components/app/ComparisonView";
import { PerformanceDNA } from "@/components/app/PerformanceDNA";
import { MetaAnalysis } from "@/components/app/MetaAnalysis";
import { LiveSeriesFeed } from "@/components/app/LiveSeriesFeed";
import { EmptyState } from "@/components/app/EmptyState";
import { LoadingSkeleton } from "@/components/app/LoadingSkeleton";
import { DataUnavailableState } from "@/components/app/DataUnavailableState";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { saveReportToHistory } from "@/lib/storage/history";
import { HistorySidebar } from "@/components/app/HistorySidebar";
import { WinPredictor } from "@/components/app/WinPredictor";
import { ScoutsInsight } from "@/components/app/ScoutsInsight";

export default function AppPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [errorState, setErrorState] = useState<{ type: "not-found" | "insufficient" | "forbidden" | "error"; message?: string } | null>(null);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const handleGenerateReport = async (values: ReportFormValues) => {
    setIsLoading(true);
    setReportData(null);
    setErrorState(null);

    try {
      const response = await fetch("/api/scouting-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        let type: "not-found" | "insufficient" | "forbidden" | "error" = "error";
        if (response.status === 404) type = "not-found";
        if (response.status === 422) type = "insufficient";
        if (response.status === 403 || response.status === 429) type = "forbidden";

        setErrorState({ type, message: data.error });

        toast({
          title: "Generation Failed",
          description: data.error || "Failed to generate report",
        });
        return;
      }

      setReportData(data);
      saveReportToHistory(data);
      setRefreshHistory(prev => prev + 1);

      toast({
        title: "Success",
        description: "Scouting report generated successfully!",
      });
      
      // Scroll to report section
      setTimeout(() => {
        document.getElementById("report-output")?.scrollIntoView({ behavior: "smooth" });
      }, 100);

    } catch (error) {
      toast({
        title: "Error",
        description: "A network error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadReport = (data: any) => {
    setErrorState(null);
    setReportData(data);
    toast({
      title: "Report Loaded",
      description: "Successfully loaded report from history.",
    });
    setTimeout(() => {
      document.getElementById("report-output")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#0b1118] text-white">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Scouting Generator</h1>
            <p className="text-slate-400 mt-1">Configure and generate professional esports reports.</p>
          </div>
          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
            GRID Open Access
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
          <aside className="space-y-6">
            <ReportForm onSubmit={handleGenerateReport} isLoading={isLoading} />
            <HistorySidebar onLoadReport={handleLoadReport} refreshTrigger={refreshHistory} />
            <LiveSeriesFeed />
            <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">Connection Status</h4>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm text-slate-300">Connected to GRID API</span>
              </div>
            </div>
          </aside>

          <section id="report-output" className="min-h-[600px]">
            {isLoading ? (
              <LoadingSkeleton />
            ) : errorState ? (
              <DataUnavailableState type={errorState.type} message={errorState.message} />
            ) : reportData ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <MatchupHeader 
                  teamName={reportData.report.meta.opponentTeam.name || "Unknown Team"}
                  title={reportData.report.meta.titleName || reportData.report.meta.titleId}
                  timeWindow={reportData.evidence.filters.timeWindow}
                  matchesCount={reportData.evidence.seriesIds.length}
                  archetype={reportData.report.meta.opponentTeam.archetype}
                />

                <Tabs defaultValue="overview" className="space-y-6">
                  <TabsList className="bg-white/5 border border-white/10 p-1 flex-wrap h-auto">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">Overview</TabsTrigger>
                    {reportData.comparison && (
                      <TabsTrigger value="matchup" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">Matchup</TabsTrigger>
                    )}
                    <TabsTrigger value="meta" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">Meta</TabsTrigger>
                    <TabsTrigger value="draft" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">Draft</TabsTrigger>
                    <TabsTrigger value="roster" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">Roster</TabsTrigger>
                    <TabsTrigger value="trends" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">Trends</TabsTrigger>
                    <TabsTrigger value="evidence" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">Evidence</TabsTrigger>
                    <TabsTrigger value="export" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">Export</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        <KpiGrid 
                          stats={{
                            winRate: reportData.evidence.statsSummary.team?.winRate,
                            winCount: reportData.evidence.statsSummary.team?.winCount,
                            killsAvg: reportData.evidence.statsSummary.team?.killsAvg,
                            deathsPerRound: reportData.evidence.statsSummary.team?.deathsPerRound,
                            seriesCount: reportData.evidence.seriesIds.length
                          }} 
                        />
                        <InsightsPanel 
                          insights={reportData.report.sections.howToWin?.recommendations || []}
                          limitations={reportData.limitations || []}
                        />
                      </div>
                      <div className="lg:col-span-1">
                         <PerformanceDNA 
                            opponentStats={reportData.evidence.statsSummary.team}
                            ownStats={reportData.evidence.statsSummary.ownTeam}
                            opponentName={reportData.report.meta.opponentTeam.name}
                            ownName={reportData.report.meta.ownTeam?.name}
                         />
                      </div>
                    </div>
                  </TabsContent>

                  {reportData.comparison && (
                    <TabsContent value="matchup" className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                           <ComparisonView comparison={reportData.comparison} />
                        </div>
                        <div className="lg:col-span-1 space-y-6">
                           <WinPredictor comparison={reportData.comparison} />
                           <ScoutsInsight comparison={reportData.comparison} />
                        </div>
                      </div>
                    </TabsContent>
                  )}

                  <TabsContent value="meta">
                    <MetaAnalysis 
                      globalMeta={reportData.report.globalMeta} 
                      titleName={reportData.report.meta.titleName} 
                    />
                  </TabsContent>

                  <TabsContent value="draft">
                    <DraftAnalysis draftAnalysis={reportData.report.sections.draftAnalysis} />
                  </TabsContent>

                  <TabsContent value="roster">
                    <RosterSection 
                      playerTendencies={reportData.report.sections.playerTendencies || { highlights: [] }}
                      playerStats={reportData.evidence.statsSummary.players || []} 
                    />
                  </TabsContent>

                  <TabsContent value="trends">
                    <TrendsSection 
                      winRate={reportData.evidence.statsSummary.team?.winRate}
                      winCount={reportData.evidence.statsSummary.team?.winCount}
                      mapStats={reportData.evidence.statsSummary.mapStats || []}
                    />
                  </TabsContent>

                  <TabsContent value="evidence">
                    <EvidenceSection evidence={reportData.evidence} />
                  </TabsContent>

                  <TabsContent value="export">
                    <ExportSection 
                      markdown={reportData.markdown} 
                      teamName={reportData.report.meta.opponentTeam.name || "Team"} 
                    />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <EmptyState />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
