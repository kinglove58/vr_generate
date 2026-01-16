import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileJson, Table as TableIcon } from "lucide-react";

interface EvidenceSectionProps {
  evidence: {
    seriesIds: string[];
    statsSummary: any;
  };
}

export function EvidenceSection({ evidence }: EvidenceSectionProps) {
  const metrics = [
    { metric: "Win Rate (%)", value: evidence.statsSummary.team?.winRate ?? "N/A", source: "teamStatistics.game.wins.percentage" },
    { metric: "Avg Kills / Series", value: evidence.statsSummary.team?.killsAvg ?? "N/A", source: "teamStatistics.series.kills.avg" },
    { metric: "Deaths / Round", value: evidence.statsSummary.team?.deathsPerRound ?? "N/A", source: "teamStatistics.segment.deaths.avg" },
    { metric: "Analyzed Series Count", value: evidence.seriesIds.length, source: "central.allSeries" },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-white/5 bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TableIcon className="h-5 w-5 text-emerald-400" />
            Curated Evidence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="hover:bg-transparent">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-slate-400">Metric</TableHead>
                <TableHead className="text-slate-400">Value</TableHead>
                <TableHead className="text-slate-400">Source Path</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((m, i) => (
                <TableRow key={i} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="text-slate-200 font-medium">{m.metric}</TableCell>
                  <TableCell className="text-slate-300">{m.value}</TableCell>
                  <TableCell className="text-xs text-slate-500 font-mono">{m.source}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="raw-json" className="border-white/5">
          <AccordionTrigger className="text-slate-400 hover:text-slate-200 text-sm py-4">
            <div className="flex items-center gap-2">
              <FileJson className="h-4 w-4" />
              View Raw Evidence JSON
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="bg-slate-950/80 rounded-lg p-4 overflow-x-auto border border-white/5">
              <pre className="text-[10px] text-emerald-400/80 leading-relaxed font-mono">
                {JSON.stringify(evidence, null, 2)}
              </pre>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
