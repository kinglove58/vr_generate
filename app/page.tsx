"use client";

import { useState } from "react";

type ReportResponse = {
  report?: unknown;
  markdown?: string;
  evidence?: unknown;
  error?: string;
  details?: unknown;
};

export default function Home() {
  const [title, setTitle] = useState<"val" | "lol">("val");
  const [teamName, setTeamName] = useState("G2");
  const [lastXMatches, setLastXMatches] = useState(5);
  const [result, setResult] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/scouting-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          opponentTeamName: teamName,
          lastXMatches,
        }),
      });

      const data = (await response.json()) as ReportResponse;
      setResult(data);
    } catch (error) {
      setResult({ error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Category 2</p>
          <h1 className="mt-3 text-3xl font-semibold">Automated Scouting Report Generator</h1>
          <p className="mt-2 text-sm text-slate-300">
            Minimal test UI for generating a scouting report from GRID Open Access data.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <label className="grid gap-2 text-sm">
            Title
            <select
              value={title}
              onChange={(event) => setTitle(event.target.value as "val" | "lol")}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            >
              <option value="val">VALORANT</option>
              <option value="lol">League of Legends</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            Opponent team name
            <input
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              placeholder="G2"
            />
          </label>

          <label className="grid gap-2 text-sm">
            Last X matches
            <input
              type="number"
              min={1}
              max={20}
              value={lastXMatches}
              onChange={(event) => setLastXMatches(Number(event.target.value))}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate report"}
          </button>
        </form>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-slate-200">Response</h2>
          <pre className="mt-4 max-h-[400px] overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-200">
            {result ? JSON.stringify(result, null, 2) : "No response yet."}
          </pre>
        </section>
      </main>
    </div>
  );
}