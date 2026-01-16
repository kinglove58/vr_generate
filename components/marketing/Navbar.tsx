"use client";

import Link from "next/link";
import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0b1118]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <Target className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">ScoutIQ</span>
          </Link>
        </div>
        <nav className="hidden md:flex md:items-center md:gap-8">
          <Link href="#features" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
            Features
          </Link>
          <Link href="#how-it-works" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
            How it works
          </Link>
          <Link href="/terms" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
            Data Usage
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" className="hidden text-slate-400 hover:text-white sm:inline-flex">
            <Link href="/app">Demo</Link>
          </Button>
          <Button asChild className="bg-cyan-600 text-white hover:bg-cyan-500">
            <Link href="/app">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
