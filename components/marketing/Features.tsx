import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, TrendingUp, Search, FileJson, Share2, MousePointer2 } from "lucide-react";

const features = [
  {
    title: "KPI Dashboard",
    description: "Instantly see win rates, kill averages, and death metrics across different time windows.",
    icon: TrendingUp,
  },
  {
    title: "Matchup Analysis",
    description: "Compare team performance against specific opponents to find exploitable weaknesses.",
    icon: Search,
  },
  {
    title: "Evidence Tracking",
    description: "Every insight is backed by raw GRID data. No more guessing—verify every claim.",
    icon: FileJson,
  },
  {
    title: "AI Insights",
    description: "Automated analysis provides strengths, weaknesses, and game plan suggestions.",
    icon: CheckCircle2,
  },
  {
    title: "Export & Share",
    description: "Export reports to Markdown, copy to clipboard, or print for your team meetings.",
    icon: Share2,
  },
  {
    title: "Data Availability",
    description: "Clear callouts on data limitations ensure you know exactly what you're working with.",
    icon: MousePointer2,
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-[#0b1118]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-base font-semibold uppercase tracking-wider text-cyan-400">Features</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything you need for elite scouting.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Card key={i} className="border-white/5 bg-white/5 backdrop-blur-sm transition-all hover:border-cyan-500/50 hover:bg-white/[0.07]">
              <CardContent className="p-8">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
