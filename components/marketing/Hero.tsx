import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, ShieldCheck, Zap } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -z-10 h-[1000px] w-[1000px] -translate-x-1/2 -translate-y-1/2 opacity-20 [background:radial-gradient(circle_at_center,_var(--tw-gradient-from),_transparent_70%)] from-cyan-500"></div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Automated <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Scouting Reports</span>
            <br />
            Powered by GRID Data.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            Generate professional-grade esports scouting reports in seconds. 
            Deep-dive into team performance, player tendencies, and win conditions using official GRID Open Access data.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-cyan-600 text-white hover:bg-cyan-500 h-12 px-8 text-base">
              <Link href="/app">
                Generate Report <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800 h-12 px-8 text-base">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
          
          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              { icon: Zap, title: "Instant Generation", desc: "Get full reports in seconds, not hours." },
              { icon: BarChart3, title: "Deep Analytics", desc: "KPIs, trends, and evidence-backed insights." },
              { icon: ShieldCheck, title: "Official Data", desc: "Built on GRID Open Access for accuracy." },
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-400 text-center">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
