"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0b1118] px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-red-500">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-white">Something went wrong!</h1>
      <p className="mb-8 max-w-md text-slate-400">
        An unexpected error occurred. Please try again or contact support if the problem persists.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} className="bg-cyan-600 hover:bg-cyan-500 text-white">
          Try again
        </Button>
        <Button variant="outline" asChild className="border-white/10 text-slate-300 hover:bg-white/10">
          <a href="/">Go to Home</a>
        </Button>
      </div>
    </div>
  );
}
