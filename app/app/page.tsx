"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Clipboard,
  Download,
  Flame,
  Gamepad2,
  Gauge,
  Loader2,
  Lock,
  Radar,
  Search,
  Settings,
  Share2,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { LimitationsCallout } from "@/components/limitations-callout";
import { EvidenceViewer } from "@/components/evidence-viewer";
import { useToast } from "@/components/ui/use-toast";

type ReportResponse = {
  report?: {
    meta: {
      titleId: string;
      titleName: string | null;
      opponentTeam: { id: string; name: string | null };
      generatedAt: string;
      lastXMatches: number;
      seriesSample: Array<{
        id: string;
        startTime: string | null;
        tournamentName: string | null;
        opponentVs: string | null;
      }>;
    };
    sections: {
      commonStrategies?: { bullets: string[]; evidence?: Array<Record<string, unknown>> };
      howToWin?: {
        bullets?: string[];
        evidence?: Array<Record<string, unknown>>;
        recommendations?: Array<{ title: string; why: string; evidenceRefs: string[] }>;
      };
      dataConstraints?: { bullets?: string[] };
    };
    summary?: { executiveSummary: string; evidenceRefs: string[]; coverageNote: string };
  };
  markdown?: string;
  evidence?: {
    statsSummary?: {
      team?: {
        winRate?: number | null;
        killsAvg?: number | null;
        deathsPerRound?: number | null;
      };
    };
  };
  limitations?: string[];
  error?: string;
  details?: unknown;
};

const timeWindowOptions = [
  { value: "LAST_MONTH", label: "Last month" },
  { value: "LAST_3_MONTHS", label: "Last 3 months" },
  { value: "LAST_6_MONTHS", label: "Last 6 months" },
  { value: "LAST_YEAR", label: "Last year" },
];

export default function ReportBuilderPage() {
  const { toast } = useToast();
  const [title, setTitle] = useState<"val" | "lol">("val");
  const [opponentTeamName, setOpponentTeamName] = useState("G2 Esports");
  const [lastXMatches, setLastXMatches] = useState(5);
  const [timeWindow, setTimeWindow] = useState("LAST_6_MONTHS");
  const [tournamentNameContains, setTournamentNameContains] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ReportResponse | null>(null);

  const limitations = response?.limitations ?? response?.report?.sections?.dataConstraints?.bullets ?? [];
  const hasReport = Boolean(response?.report);

  const teamSignals = response?.evidence?.statsSummary?.team ?? {};
  const confidenceLevel = limitations.length === 0 ? "High Confidence" : "Limited Coverage";

  const executiveSummary = useMemo(() => {
    if (!response?.report) {
      return "Generate a report to see a summary.";
    }
    if (response.report.summary?.executiveSummary) {
      return response.report.summary.executiveSummary;
    }
    const common = response.report.sections.commonStrategies?.bullets ?? [];
    const howToWin = response.report.sections.howToWin?.bullets ?? [];
    return [common[0], howToWin[0]].filter(Boolean).join(" ") || "Summary unavailable.";
  }, [response]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("/api/scouting-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          opponentTeamName,
          lastXMatches,
          timeWindow,
          tournamentNameContains,
        }),
      });

      const data = (await res.json()) as ReportResponse;
      if (!res.ok) {
        setResponse(data);
        toast({ title: "Report failed", description: data.error ?? "Unable to generate report." });
        return;
      }

      setResponse(data);
      toast({ title: "Report ready", description: "Scouting report generated successfully." });
    } catch (error) {
      setResponse({ error: (error as Error).message });
      toast({ title: "Network error", description: "Unable to reach the server." });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied", description: "Shareable link copied to clipboard." });
  };

  const handleExport = () => {
    if (!response?.markdown) {
      toast({ title: "No report", description: "Generate a report before exporting." });
      return;
    }
    const blob = new Blob([response.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "scouting-report.md";
    link.click();
    URL.revokeObjectURL(url);
  };

  const generatedLabel = response?.report?.meta.generatedAt
    ? formatRelativeTime(response.report.meta.generatedAt)
    : "Not generated yet";

  return (
    <div className="min-h-screen bg-[#0b1118] text-slate-100">
      <header className="border-b border-slate-900/80 bg-[#0b1118]/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Gamepad2 className="h-5 w-5 text-cyan-200" />
            ScoutIQ
          </div>
          <nav className="hidden items-center gap-6 text-xs text-slate-400 lg:flex">
            <Link href="/" className="hover:text-cyan-200">Dashboard</Link>
            <span className="text-cyan-200">Reports</span>
            <Link href="/app" className="hover:text-cyan-200">Teams</Link>
            <Link href="/app" className="hover:text-cyan-200">Scrims</Link>
          </nav>
          <div className="flex items-center gap-3 text-slate-300">
            <button type="button" className="rounded-full border border-slate-800 p-2 hover:text-cyan-200">
              <Bell className="h-4 w-4" />
            </button>
            <button type="button" className="rounded-full border border-slate-800 p-2 hover:text-cyan-200">
              <Settings className="h-4 w-4" />
            </button>
            <button type="button" className="rounded-full border border-slate-800 p-2">
              <UserCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[360px_1fr]">
        <section className="flex flex-col gap-6 rounded-2xl border border-slate-900/70 bg-[#0f1722] p-6 shadow-xl">
          <div>
            <h2 className="text-lg font-semibold">Report Builder</h2>
            <p className="mt-1 text-xs text-slate-400">Configure parameters for your opponent analysis.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Game Title</label>
              <select
                value={title}
                onChange={(event) => setTitle(event.target.value as "val" | "lol")}
                className="w-full rounded-full border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100"
              >
                <option value="val">Valorant</option>
                <option value="lol">League of Legends</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400">Target Team</label>
              <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950 px-4 py-3 text-sm">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  value={opponentTeamName}
                  onChange={(event) => setOpponentTeamName(event.target.value)}
                  className="w-full bg-transparent text-slate-100 outline-none"
                  placeholder="G2 Esports"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Match History Depth</span>
                <Badge variant="secondary">Last {lastXMatches} Matches</Badge>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                value={lastXMatches}
                onChange={(event) => setLastXMatches(Number(event.target.value))}
                className="mt-4 w-full accent-cyan-400"
              />
              <div className="mt-2 flex justify-between text-[10px] text-slate-500">
                <span>RECENT</span>
                <span>DEEP DIVE</span>
              </div>
            </div>

            <Accordion type="single" collapsible>
              <AccordionItem value="advanced">
                <AccordionTrigger>Advanced Filters</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <label className="grid gap-2 text-xs text-slate-400">
                      Time Window
                      <select
                        value={timeWindow}
                        onChange={(event) => setTimeWindow(event.target.value)}
                        className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                      >
                        {timeWindowOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2 text-xs text-slate-400">
                      Tournament Name Contains
                      <input
                        value={tournamentNameContains}
                        onChange={(event) => setTournamentNameContains(event.target.value)}
                        className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                        placeholder="Champions"
                      />
                    </label>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Radar className="h-4 w-4" /> Generate Report
                </>
              )}
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-900/70 bg-[#0f1722] p-6 shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">
                {response?.report?.meta.opponentTeam.name ?? "Opponent"}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span>Generated {generatedLabel}</span>
                <span>Title: {response?.report?.meta.titleName ?? response?.report?.meta.titleId ?? "N/A"}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={limitations.length ? "warning" : "success"}>{confidenceLevel}</Badge>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4" /> Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4" /> Export
              </Button>
            </div>
          </div>

          <Tabs defaultValue="report" className="mt-6">
            <TabsList>
              <TabsTrigger value="report">Report Analysis</TabsTrigger>
              <TabsTrigger value="evidence">Evidence Clips</TabsTrigger>
              <TabsTrigger value="limitations">Limitations</TabsTrigger>
            </TabsList>

            <TabsContent value="report" className="space-y-6">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-44 w-full" />
                </div>
              ) : !hasReport ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-400">
                  Run a report to see analysis here.
                </div>
              ) : (
                <>
                  <Card className="border-slate-800/80 bg-slate-950/60">
                    <CardHeader className="flex flex-row items-center gap-3 border-none">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-200">
                        <Gauge className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-base">Executive Summary</CardTitle>
                        <CardDescription className="text-xs text-slate-400">
                          {response?.report?.summary?.coverageNote ?? "Evidence-backed summary from GRID metrics."}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-slate-200">
                      <p>{executiveSummary}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="text-slate-500">Evidence</span>
                        {(response?.report?.summary?.evidenceRefs ?? ["teamStatistics"]).slice(0, 3).map((ref) => (
                          <Badge key={ref} variant="secondary">{ref}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                    <Card className="border-slate-800/80 bg-slate-950/60">
                      <CardHeader>
                        <CardTitle className="text-sm">Team Signals</CardTitle>
                        <CardDescription className="text-xs">Verified team metrics.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <SignalPill label="Win Rate" value={formatPercent(teamSignals.winRate)} />
                        <SignalPill label="Kills / Series" value={formatNumber(teamSignals.killsAvg)} />
                        <SignalPill label="Deaths / Round" value={formatNumber(teamSignals.deathsPerRound)} />
                      </CardContent>
                    </Card>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-slate-200">How to Win</h3>
                      <div className="grid gap-4">
                        {(response?.report?.sections.howToWin?.recommendations?.length
                          ? response.report.sections.howToWin.recommendations.map((rec, index) => ({
                              title: rec.title,
                              why: rec.why,
                              evidenceRefs: rec.evidenceRefs,
                              key: `${rec.title}-${index}`,
                            }))
                          : (response?.report?.sections.howToWin?.bullets ?? []).map((bullet, index) => ({
                              title: `Recommendation ${index + 1}`,
                              why: bullet,
                              evidenceRefs: ["teamStatistics"],
                              key: `${bullet}-${index}`,
                            }))).map((item) => (
                          <Card key={item.key} className="border-slate-800/80 bg-slate-950/60">
                            <CardHeader className="flex flex-row items-center justify-between">
                              <CardTitle className="text-sm">{item.title}</CardTitle>
                              <Badge variant="secondary">Macro Strategy</Badge>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-slate-200">
                              <div>
                                <p className="text-xs text-slate-400">Why this works</p>
                                <p className="leading-relaxed">{item.why}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                <span className="text-slate-500">Evidence</span>
                                {item.evidenceRefs.slice(0, 2).map((ref) => (
                                  <Badge key={ref} variant="secondary">{ref}</Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Card className="border-slate-800/80 bg-slate-950/60">
                    <CardHeader className="flex flex-row items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-slate-300">
                        <Lock className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">Unlock Deep Player Tendencies</CardTitle>
                        <CardDescription className="text-xs">
                          Player-level insights require series access not available in Open Access.
                        </CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="evidence" className="space-y-6">
              {!hasReport ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-400">
                  Generate a report to view evidence.
                </div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    {(response?.report?.meta.seriesSample ?? []).map((series) => (
                      <Card key={series.id} className="border-slate-800/80 bg-slate-950/60">
                        <CardHeader>
                          <CardTitle className="text-sm">Series {series.id}</CardTitle>
                          <CardDescription className="text-xs">
                            {series.tournamentName ?? "Tournament unknown"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="text-xs text-slate-400">
                          <p>Start: {series.startTime ?? "Unknown"}</p>
                          <p>Matchup: {series.opponentVs ?? "Unavailable"}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (!response?.evidence) return;
                        const blob = new Blob([JSON.stringify(response.evidence, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = "evidence.json";
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="h-4 w-4" /> Download Evidence
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (!response?.evidence) return;
                        await navigator.clipboard.writeText(JSON.stringify(response.evidence, null, 2));
                        toast({ title: "Copied", description: "Evidence JSON copied to clipboard." });
                      }}
                    >
                      <Clipboard className="h-4 w-4" /> Copy JSON
                    </Button>
                  </div>
                  {response?.evidence ? <EvidenceViewer data={response.evidence} /> : null}
                </>
              )}
            </TabsContent>

            <TabsContent value="limitations">
              {limitations.length > 0 ? (
                <LimitationsCallout items={limitations} />
              ) : (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-400">
                  No limitations detected for this report.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}

function formatRelativeTime(isoDate: string) {
  const timestamp = Date.parse(isoDate);
  if (!Number.isFinite(timestamp)) {
    return "Unknown";
  }
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  const diffHours = Math.round(diffMinutes / 60);
  return `${diffHours} hours ago`;
}

function formatPercent(value?: number | null) {
  if (typeof value !== "number") return "N/A";
  return `${Math.round(value)}%`;
}

function formatNumber(value?: number | null) {
  if (typeof value !== "number") return "N/A";
  return value.toFixed(2);
}

function SignalPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-full border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
      <span>{label}</span>
      <span className="font-semibold text-slate-100">{value}</span>
    </div>
  );
}
