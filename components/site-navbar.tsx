import Link from "next/link";
import { ShieldCheck, Radar, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteNavbar() {
  return (
    <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
      <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-200">
          <Target className="h-5 w-5" />
        </div>
        GRID Scout
      </Link>
      <div className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
        <a href="#how" className="transition hover:text-cyan-200">How it works</a>
        <a href="#features" className="transition hover:text-cyan-200">What you get</a>
        <a href="#coverage" className="transition hover:text-cyan-200">Coverage</a>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" asChild>
          <Link href="/app">
            <Target className="h-4 w-4" />
            Generate a report
          </Link>
        </Button>
        <Button asChild className="hidden sm:inline-flex">
          <Link href="/app">
            <ShieldCheck className="h-4 w-4" />
            Get started
          </Link>
        </Button>
      </div>
    </nav>
  );
}
