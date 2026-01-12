import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  ChevronRight,
  Crosshair,
  Crown,
  Eye,
  Flame,
  Radar,
  Target,
  Swords,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const coverageRows = [
  {
    label: "Team Stats",
    status: "Full",
    update: "Post-match",
    accuracy: "99.0%",
  },
  {
    label: "Player Tendencies",
    status: "Limited",
    update: "Post-match",
    accuracy: "~90%",
  },
  {
    label: "Draft / Comps",
    status: "Unavailable",
    update: "N/A",
    accuracy: "N/A",
  },
  {
    label: "Map / Objectives",
    status: "Unavailable",
    update: "N/A",
    accuracy: "N/A",
  },
];

const howItWorks = [
  {
    title: "Pick Title",
    description:
      "Choose the game you are scouting. We align metrics to verified GRID data.",
    icon: <Radar className="h-5 w-5" />,
  },
  {
    title: "Enter Opponent",
    description:
      "Search by team name and pull recent series IDs from Open Access.",
    icon: <Crosshair className="h-5 w-5" />,
  },
  {
    title: "Get Report",
    description:
      "Receive actionable, evidence-backed insights in under a minute.",
    icon: <Swords className="h-5 w-5" />,
  },
];

const features = [
  {
    title: "Team-wide Signals",
    description:
      "Macro metrics like win rate, kills per series, and deaths per round.",
    icon: <BarChart3 className="h-5 w-5 text-purple-200" />,
  },
  {
    title: "How-to-win Insights",
    description: "Recommendations grounded in the stats you can verify.",
    icon: <Flame className="h-5 w-5 text-sky-200" />,
  },
  {
    title: "Evidence Metrics",
    description:
      "Every insight includes evidence references for quick validation.",
    icon: <BadgeCheck className="h-5 w-5 text-emerald-200" />,
  },
  {
    title: "Shareable Reports",
    description: "Copy markdown or download evidence JSON for your analysts.",
    icon: <Eye className="h-5 w-5 text-amber-200" />,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b1118] text-slate-100">
      <div className="absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),_transparent_65%)]" />

      <header className="relative border-b border-slate-900/70 bg-[#0b1118]/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-cyan-200">
              <Target className="h-4 w-4" />
            </div>
            ScoutIQ
          </div>
          <nav className="hidden items-center gap-6 text-xs text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-cyan-200">
              Features
            </a>
            <a href="#how" className="transition hover:text-cyan-200">
              How it Works
            </a>
            <a href="#coverage" className="transition hover:text-cyan-200">
              Data Coverage
            </a>
          </nav>
          <Button
            asChild
            size="sm"
            className="bg-linear-to-r from-sky-400 to-indigo-400 text-white border rounded-full hover:scale-105"
          >
            <Link href="/app">Generate Report</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="relative mx-auto grid w-full max-w-6xl gap-12 px-6 pb-16 pt-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Automated Scouting Reports,{" "}
              <span className="bg-linear-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                Evidence-Backed.
              </span>
            </h1>
            <p className="max-w-xl text-sm text-slate-300">
              Dominate prep day with AI-assisted insights grounded in official
              GRID Open Access metrics. Get instant, data-backed strategies to
              counter your opponent in seconds.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                asChild
                className="text-white hover:scale-105 bg-linear-to-r from-sky-400 to-indigo-400"
              >
                <Link href="/app">
                  <Target className="h-4 w-4" />
                  Start Scouting Free
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <a href="#coverage">
                  Data Coverage
                  <ChevronRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              <span>VALORANT + LoL</span>
              <span>Open Access compatible</span>
              <span>Evidence-first output</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-10 top-8 h-52 w-52 rounded-full bg-sky-500/10 blur-3xl" />
            <Card className="border-slate-800/80 bg-gradient-to-br from-slate-900/80 via-slate-950/70 to-slate-900/70 shadow-2xl shadow-black/40">
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 text-blue-200">
                      TL
                    </span>
                    <span className="text-slate-300">vs</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-slate-200">
                      G2
                    </span>
                  </div>
                  <span>
                    Win Probability{" "}
                    <strong className="text-cyan-200">64%</strong>
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      label: "Kills / Series",
                      value: "42.5",
                      delta: "+12%",
                      color: "from-emerald-400",
                    },
                    {
                      label: "Deaths / Round",
                      value: "0.68",
                      delta: "-2%",
                      color: "from-rose-400",
                    },
                    {
                      label: "First Blood Rate",
                      value: "58%",
                      delta: "+4%",
                      color: "from-violet-400",
                    },
                    {
                      label: "Obj. Control",
                      value: "72%",
                      delta: "+6%",
                      color: "from-sky-400",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-slate-800/70 bg-slate-950/70 p-4"
                    >
                      <p className="text-[11px] text-slate-400">{stat.label}</p>
                      <div className="mt-2 flex items-center justify-between text-sm text-slate-200">
                        <span className="text-lg font-semibold">
                          {stat.value}
                        </span>
                        <span className="text-xs text-emerald-200">
                          {stat.delta}
                        </span>
                      </div>
                      <div className="mt-3 h-1.5 rounded-full bg-slate-800">
                        <div
                          className={`h-1.5 w-2/3 rounded-full bg-gradient-to-r ${stat.color} to-transparent`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-slate-800/70 bg-slate-950/80 p-4 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-cyan-200">
                    <Crown className="h-4 w-4" />
                    AI Insight
                  </div>
                  <p className="mt-2">
                    Opponent shows elevated deaths per round. Recommend forcing
                    scrappy fights and trading-heavy defenses.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="how" className="border-t border-slate-900/80 bg-[#0f1722]">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <div className="text-center">
              <h2 className="text-2xl font-semibold">How it Works</h2>
              <p className="mt-2 text-sm text-slate-400">
                Streamlined workflow designed for analysts and coaches.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {howItWorks.map((item, index) => (
                <Card
                  key={item.title}
                  className="border-slate-800/80 bg-slate-900/50"
                >
                  <CardContent className="space-y-4 p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-cyan-200">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {index + 1}. {item.title}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section
          id="features"
          className="border-t border-slate-900/80 bg-[#0b1118]"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="text-2xl font-semibold">What You Get</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="border-slate-800/80 bg-slate-900/50"
                >
                  <CardContent className="space-y-4 p-6">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800">
                      {feature.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {feature.title}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section
          id="coverage"
          className="border-t border-slate-900/80 bg-[#0f1722]"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <div className="text-center">
              <h2 className="text-2xl font-semibold">Data Coverage Matrix</h2>
              <p className="mt-2 text-xs text-slate-400">
                Open Access transparency: only verified data is surfaced in
                reports.
              </p>
            </div>
            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/50">
              <div className="grid grid-cols-4 gap-4 border-b border-slate-800/80 px-6 py-4 text-xs text-slate-400">
                <span>Data Category</span>
                <span>Availability</span>
                <span>Update Frequency</span>
                <span>Source Accuracy</span>
              </div>
              <div className="divide-y divide-slate-800/70">
                {coverageRows.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-4 gap-4 px-6 py-4 text-sm text-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-cyan-400/80" />
                      {row.label}
                    </div>
                    <div>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${
                          row.status === "Full"
                            ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                            : row.status === "Limited"
                            ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
                            : "border-slate-600/60 bg-slate-800/60 text-slate-300"
                        }`}
                      >
                        {row.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">{row.update}</div>
                    <div className="text-xs text-slate-400">{row.accuracy}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-900/80 bg-[#0f1722]">
          <div className="mx-auto w-full max-w-6xl px-6 py-14">
            <div className="rounded-3xl bg-gradient-to-r from-blue-800 via-indigo-900 to-purple-800 p-10 text-center text-white shadow-2xl shadow-indigo-500/20">
              <h2 className="text-2xl font-semibold">
                Ready to elevate your game analysis?
              </h2>
              <p className="mt-3 text-sm text-indigo-100">
                Join coaches and analysts building faster prep workflows with
                ScoutIQ.
              </p>
              <Button asChild variant="secondary" className="mt-6">
                <Link href="/app">
                  Get Started Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900/80 bg-[#0b1118]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>
            Built for Category 2 · Automated Scouting Report Generator
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/app" className="text-slate-400 hover:text-cyan-200">
              Generate Report
            </Link>
            <Link href="/terms" className="text-slate-400 hover:text-cyan-200">
              Terms of Service
            </Link>
            <a
              href="mailto:support@scoutiq.app"
              className="text-slate-400 hover:text-cyan-200"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
