import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border-white/5 bg-white/5 backdrop-blur-sm h-32">
        <CardContent className="p-6 flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-2xl bg-white/10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-white/10" />
            <Skeleton className="h-4 w-32 bg-white/10" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border-white/5 bg-white/5 backdrop-blur-sm h-24">
            <CardHeader className="pb-2">
              <Skeleton className="h-3 w-16 bg-white/10" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-12 bg-white/10" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/5 bg-white/5 backdrop-blur-sm h-64">
        <CardHeader>
          <Skeleton className="h-6 w-32 bg-white/10" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full bg-white/10" />
          <Skeleton className="h-12 w-full bg-white/10" />
          <Skeleton className="h-12 w-full bg-white/10" />
        </CardContent>
      </Card>
    </div>
  );
}
