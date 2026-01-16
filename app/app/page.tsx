"use client";

import { useState } from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { ReportForm, ReportFormValues } from "@/components/app/ReportForm";
import { MatchupHeader } from "@/components/app/MatchupHeader";
import { KpiGrid } from "@/components/app/KpiGrid";
import { InsightsPanel } from "@/components/app/InsightsPanel";
import { TrendsSection } from "@/components/app/TrendsSection";
import { EvidenceSection } from "@/components/app/EvidenceSection";
import { ExportSection } from "@/components/app/ExportSection";
import { EmptyState } from "@/components/app/EmptyState";
import { LoadingSkeleton } from "@/components/app/LoadingSkeleton";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function AppPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const handleGenerateReport = async (values: ReportFormValues) => {
    setIsLoading(true);
    setReportData(null);

    try {
      const response = await fetch("/api/scouting-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to generate report",
        });
        return;
      }

      setReportData(data);
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
            ) : reportData ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <MatchupHeader 
                  teamName={reportData.report.meta.opponentTeam.name || "Unknown Team"}
                  title={reportData.report.meta.titleName || reportData.report.meta.titleId}
                  timeWindow={reportData.evidence.filters.timeWindow}
                  matchesCount={reportData.evidence.seriesIds.length}
                />

                <Tabs defaultValue="overview" className="space-y-6">
                  <TabsList className="bg-white/5 border border-white/10 p-1">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">Overview</TabsTrigger>
                    <TabsTrigger value="trends" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">Trends</TabsTrigger>
                    <TabsTrigger value="evidence" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">Evidence</TabsTrigger>
                    <TabsTrigger value="export" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">Export</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
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
