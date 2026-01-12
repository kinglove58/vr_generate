import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type LimitationsCalloutProps = {
  items: string[];
};

export function LimitationsCallout({ items }: LimitationsCalloutProps) {
  return (
    <Card className="border-amber-500/30 bg-amber-500/10">
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-200">
          <AlertTriangle className="h-4 w-4" />
          Data coverage limitations
        </div>
        <ul className="space-y-2 text-sm text-amber-100/90">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="flex gap-2">
              <span>•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
