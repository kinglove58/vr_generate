"use client";

import { Download, Clipboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

type EvidenceViewerProps = {
  data: unknown;
  fileName?: string;
};

export function EvidenceViewer({
  data,
  fileName = "evidence.json",
}: EvidenceViewerProps) {
  const { toast } = useToast();
  const json = JSON.stringify(data, null, 2);

  const handleDownload = () => {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(json);
    toast({
      title: "Copy",
      description: "Copied to clipboard.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4" />
          Download JSON
        </Button>
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          <Clipboard className="h-4 w-4" />
          Copy JSON
        </Button>
      </div>
      <pre className="max-h-[480px] overflow-auto rounded-lg border border-slate-800/70 bg-slate-950/70 p-4 text-xs text-slate-200">
        {json}
      </pre>
    </div>
  );
}
