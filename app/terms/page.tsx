import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0b1118] text-slate-100">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-14">
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/">Back to landing</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/app">Generate Report</Link>
          </Button>
        </div>

        <Card className="border-slate-800/80 bg-slate-900/60">
          <CardHeader>
            <CardTitle>Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <p>
              ScoutIQ provides scouting reports based on available GRID Open Access data. Insights are informational
              and intended to support analysis workflows.
            </p>
            <p>
              By using this app, you agree to respect the underlying data provider terms and to avoid sharing or
              redistributing restricted content.
            </p>
            <p>
              Questions? Reach out at{" "}
              <a className="text-cyan-200 underline" href="mailto:support@scoutiq.app">
                support@scoutiq.app
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
