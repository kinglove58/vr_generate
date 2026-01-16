"use client";

import { Navbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { Features } from "@/components/marketing/Features";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import Link from "next/link";

const sampleData = [
  { name: "Game 1", kills: 12 },
  { name: "Game 2", kills: 18 },
  { name: "Game 3", kills: 15 },
  { name: "Game 4", kills: 22 },
  { name: "Game 5", kills: 14 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b1118] text-white">
      <Navbar />
      
      <main>
        <Hero />
        
        {/* Sample Preview Section */}
        <section className="py-24 bg-slate-900/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2">
                <h2 className="text-3xl font-bold mb-6">Data-backed insights at your fingertips.</h2>
                <p className="text-slate-400 mb-8 text-lg">
                  Stop relying on gut feelings. Our reports aggregate thousands of data points into actionable insights. 
                  Identify patterns in enemy rotations, objective priority, and player performance.
                </p>
                <div className="space-y-4">
                  {[
                    "Automated Win Rate Analysis",
                    "Kill & Death Trends",
                    "AI-generated Strengths & Weaknesses",
                    "Raw Evidence Tables",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-cyan-500"></div>
                      </div>
                      <span className="text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="lg:w-1/2 w-full">
                <Card className="border-white/10 bg-[#0b1118] shadow-2xl">
                  <CardHeader className="border-b border-white/5">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-white">Sample Team Analysis</CardTitle>
                        <p className="text-xs text-slate-500 mt-1">LAST_6_MONTHS • 24 Matches</p>
                      </div>
                      <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">VALORANT</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-xs text-slate-500 uppercase font-semibold">Win Rate</p>
                        <p className="text-2xl font-bold text-white">68.2%</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-xs text-slate-500 uppercase font-semibold">Avg Kills</p>
                        <p className="text-2xl font-bold text-white">16.4</p>
                      </div>
                    </div>
                    
                    <div className="h-48 w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sampleData}>
                          <XAxis dataKey="name" hide />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#0b1118", borderColor: "#1e293b" }}
                            itemStyle={{ color: "#22d3ee" }}
                          />
                          <Bar dataKey="kills" fill="#0891b2" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-center text-xs text-slate-500 mt-2">Kill Trends (Recent Matches)</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <Features />

        {/* Limitations Callout */}
        <section className="py-24 border-t border-white/5">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Open Access Transparency</h2>
            <p className="text-slate-400">
              ScoutIQ is built on GRID Open Access. While we provide powerful insights, some data fields (like specific round-by-round player positioning) may be restricted based on tournament permissions. We always disclose when data is limited.
            </p>
            <Button asChild variant="link" className="text-cyan-400 mt-4">
              <Link href="/terms">Read our Data Disclosure</Link>
            </Button>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyan-500/10 -z-10"></div>
          <div className="mx-auto max-w-7xl px-4 text-center">
            <h2 className="text-3xl font-bold mb-6 sm:text-4xl">Ready to level up your scouting?</h2>
            <p className="text-slate-400 mb-10 max-w-xl mx-auto">
              Join elite analysts and teams using ScoutIQ to gain a competitive edge.
            </p>
            <Button asChild size="lg" className="bg-cyan-600 text-white hover:bg-cyan-500 h-14 px-10 text-lg">
              <Link href="/app">Start Generating Now</Link>
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
