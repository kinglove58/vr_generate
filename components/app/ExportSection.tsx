import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Download, Printer, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ExportSectionProps {
  markdown: string;
  teamName: string;
}

export function ExportSection({ markdown, teamName }: ExportSectionProps) {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdown);
    toast({
      title: "Copied to clipboard",
      description: "Markdown report has been copied to your clipboard.",
    });
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Scouting_Report_${teamName.replace(/\s+/g, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "Your scouting report is being downloaded.",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="border-white/5 bg-white/5 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-400" />
          Export & Share
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            onClick={copyToClipboard}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Markdown
          </Button>
          <Button 
            variant="outline" 
            className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            onClick={downloadMarkdown}
          >
            <Download className="mr-2 h-4 w-4" />
            Download .md
          </Button>
          <Button 
            variant="outline" 
            className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            onClick={handlePrint}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print View
          </Button>
        </div>
        
        <div className="mt-8">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Markdown Preview</h4>
          <div className="bg-slate-950/50 rounded-lg p-4 border border-white/5">
            <pre className="text-xs text-slate-400 whitespace-pre-wrap font-sans leading-relaxed">
              {markdown}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
