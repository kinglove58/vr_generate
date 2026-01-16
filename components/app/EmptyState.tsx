import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

export function EmptyState() {
  return (
    <Card className="border-dashed border-white/10 bg-transparent h-[400px] flex items-center justify-center">
      <CardContent className="text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <Search className="h-8 w-8 text-slate-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Report Generated</h3>
        <p className="text-slate-400 max-w-xs mx-auto">
          Fill out the form on the left to generate a comprehensive scouting report for your opponent.
        </p>
      </CardContent>
    </Card>
  );
}
