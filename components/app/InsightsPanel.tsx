import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Lightbulb } from "lucide-react";

interface Insight {
  title: string;
  why: string;
  evidenceRefs?: string[];
}

interface InsightsPanelProps {
  insights: Insight[];
  limitations: string[];
}

export function InsightsPanel({ insights, limitations }: InsightsPanelProps) {
  return (
    <div className="space-y-6">
      <Card className="border-white/5 bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-400" />
            Scouting Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.length > 0 ? (
            insights.map((insight, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-900/50 border border-white/5">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{insight.title}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {insight.why}
                    </p>
                    {insight.evidenceRefs && insight.evidenceRefs.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {insight.evidenceRefs.map((ref, j) => (
                          <Badge key={j} variant="outline" className="text-[10px] py-0 border-white/10 text-slate-500 font-normal">
                            Based on: {ref}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 italic">No specific insights generated for this team.</p>
          )}
        </CardContent>
      </Card>

      {limitations.length > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-400 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Data Availability & Constraints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {limitations.map((limit, i) => (
                <li key={i} className="text-xs text-amber-200/70 flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-amber-500/50 shrink-0" />
                  {limit}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
