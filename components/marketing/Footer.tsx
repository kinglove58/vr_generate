import Link from "next/link";
import { Target } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0b1118] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <Target className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">ScoutIQ</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-8">
            <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">Home</Link>
            <Link href="/app" className="text-sm text-slate-400 hover:text-white transition-colors">App</Link>
            <Link href="/terms" className="text-sm text-slate-400 hover:text-white transition-colors">Terms of Service</Link>
          </nav>
          <div className="text-sm text-slate-500">
            © {new Date().getFullYear()} ScoutIQ. Powered by GRID Open Access.
          </div>
        </div>
      </div>
    </footer>
  );
}
