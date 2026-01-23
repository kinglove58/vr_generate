import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ShieldAlert, Database, Search } from "lucide-react";

interface DataUnavailableStateProps {
  type: "not-found" | "insufficient" | "forbidden" | "error";
  message?: string;
}

export function DataUnavailableState({ type, message }: DataUnavailableStateProps) {
  const configs = {
    "not-found": {
      icon: Search,
      title: "Team Not Found",
      description: message || "We couldn't find the team you're looking for. Please check the name and try again.",
      color: "text-orange-400",
      bg: "bg-orange-500/10"
    },
    "insufficient": {
      icon: Database,
      title: "Insufficient Data",
      description: message || "There are not enough recent matches for this team in the selected time window to generate a reliable report.",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10"
    },
    "forbidden": {
      icon: ShieldAlert,
      title: "Access Restricted",
      description: message || "Data access for this team or tournament is restricted under GRID Open Access policies.",
      color: "text-red-400",
      bg: "bg-red-500/10"
    },
    "error": {
      icon: AlertCircle,
      title: "Generation Failed",
      description: message || "An unexpected error occurred while generating the report. Please try again later.",
      color: "text-slate-400",
      bg: "bg-slate-500/10"
    }
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <Card className="border-white/5 bg-white/5 backdrop-blur-sm h-[400px] flex items-center justify-center animate-in fade-in zoom-in-95 duration-300">
      <CardContent className="text-center p-8">
        <div className={`mx-auto h-20 w-20 rounded-2xl ${config.bg} flex items-center justify-center mb-6 shadow-2xl`}>
          <Icon className={`h-10 w-10 ${config.color}`} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">{config.title}</h3>
        <p className="text-slate-400 max-w-md mx-auto leading-relaxed text-sm">
          {config.description}
        </p>
      </CardContent>
    </Card>
  );
}
