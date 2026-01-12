import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ReportSectionProps = {
  title: string;
  description?: string;
  items: Array<{ text: string; evidenceRef?: string; confidence?: "low" | "medium" | "high" }>;
};

export function ReportSection({ title, description, items }: ReportSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <p className="text-sm text-slate-400">{description}</p> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">No insights available for this section.</p>
        ) : (
          items.map((item, index) => (
            <div key={`${item.text}-${index}`} className="flex flex-col gap-2 rounded-lg border border-slate-800/70 bg-slate-950/60 p-4">
              <div className="flex flex-wrap items-center gap-2">
                {item.confidence ? (
                  <Badge variant={item.confidence === "high" ? "success" : item.confidence === "medium" ? "secondary" : "warning"}>
                    {item.confidence} confidence
                  </Badge>
                ) : null}
                {item.evidenceRef ? <Badge variant="secondary">{item.evidenceRef}</Badge> : null}
              </div>
              <p className="text-sm text-slate-200">{item.text}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
