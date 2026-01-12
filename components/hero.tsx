import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_55%)]" />
      <div className="relative mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-xs text-cyan-200">
            <Target className="h-3.5 w-3.5" />
            Category 2 · Automated Scouting
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-slate-100 sm:text-5xl">
            Automated Scouting Report Generator
          </h1>
          <p className="max-w-xl text-base text-slate-300">
            Generate opponent scouting reports from official GRID data in seconds. Built for coaches who need crisp,
            evidence-backed signals before match day.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/app">
                Generate a report <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#how">See how it works</a>
            </Button>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
            <span>Powered by GRID Open Access</span>
            <span>Evidence-first insights</span>
            <span>VALORANT + LoL support</span>
          </div>
        </div>
        <div className="relative flex h-full items-center justify-center">
          <div className="absolute -right-16 top-12 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/80 via-slate-950/80 to-slate-900/80 p-6 shadow-2xl shadow-cyan-500/10">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Live report preview</span>
              <span className="rounded-full border border-slate-700 px-2 py-0.5">Auto</span>
            </div>
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-4">
                <p className="text-xs text-slate-400">Common signals</p>
                <p className="mt-2 text-sm text-slate-200">Win rate 71% · 185.9 kills/series</p>
              </div>
              <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-4">
                <p className="text-xs text-slate-400">How to win</p>
                <p className="mt-2 text-sm text-slate-200">Force scrappy fights · punish high deaths/round</p>
              </div>
              <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-4">
                <p className="text-xs text-slate-400">Coverage</p>
                <p className="mt-2 text-sm text-slate-200">Player-level data unavailable in Open Access</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
