"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TITLE_OPTIONS, TIME_RANGE_OPTIONS } from "@/lib/ui/constants";
import { Loader2, Search } from "lucide-react";

const formSchema = z.object({
  title: z.enum(["val", "lol"]),
  opponentTeamName: z.string().min(2, "Team name must be at least 2 characters"),
  ownTeamName: z.string().optional(),
  lastXMatches: z.coerce.number().min(1).max(20),
  timeWindow: z.string(),
});

export type ReportFormValues = z.infer<typeof formSchema>;

interface ReportFormProps {
  onSubmit: (values: ReportFormValues) => void;
  isLoading: boolean;
}

export function ReportForm({ onSubmit, isLoading }: ReportFormProps) {
  const [opponentSuggestions, setOpponentSuggestions] = useState<any[]>([]);
  const [ownSuggestions, setOwnSuggestions] = useState<any[]>([]);
  const [activeField, setActiveField] = useState<"opponent" | "own" | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "val",
      opponentTeamName: "",
      lastXMatches: 10,
      timeWindow: "LAST_6_MONTHS",
    },
  });

  const opponentTeamName = form.watch("opponentTeamName");
  const ownTeamName = form.watch("ownTeamName");

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (opponentTeamName && opponentTeamName.length >= 2 && activeField === "opponent") {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/search-teams?q=${encodeURIComponent(opponentTeamName)}`);
          const data = await res.json();
          setOpponentSuggestions(data.teams || []);
        } catch {} finally {
          setIsSearching(false);
        }
      } else {
        setOpponentSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [opponentTeamName, activeField]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (ownTeamName && ownTeamName.length >= 2 && activeField === "own") {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/search-teams?q=${encodeURIComponent(ownTeamName)}`);
          const data = await res.json();
          setOwnSuggestions(data.teams || []);
        } catch {} finally {
          setIsSearching(false);
        }
      } else {
        setOwnSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [ownTeamName, activeField]);

  return (
    <Card className="border-white/5 bg-white/5 backdrop-blur-sm no-print">
      <CardHeader>
        <CardTitle className="text-white">Report Inputs</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Title</label>
            <Select 
              onValueChange={(value) => form.setValue("title", value as any)} 
              defaultValue={form.getValues("title")}
            >
              <SelectTrigger className="bg-slate-900/50 border-white/10 text-white">
                <SelectValue placeholder="Select a title" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white">
                {TITLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.title && (
              <p className="text-xs text-red-400">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2 relative">
            <label className="text-sm font-medium text-slate-300">Opponent Team Name</label>
            <div className="relative">
              <Input 
                {...form.register("opponentTeamName")}
                placeholder="e.g. Sentinels, G2, etc."
                className="bg-slate-900/50 border-white/10 text-white pr-10"
                onFocus={() => setActiveField("opponent")}
                onBlur={() => setTimeout(() => setActiveField(null), 200)}
                autoComplete="off"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isSearching && activeField === "opponent" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                ) : (
                  <Search className="h-4 w-4 text-slate-500" />
                )}
              </div>
            </div>
            {activeField === "opponent" && (opponentSuggestions.length > 0 || (isSearching && opponentTeamName.length >= 2)) && (
              <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-white/10 rounded-lg shadow-2xl max-h-48 overflow-auto animate-in fade-in zoom-in-95 duration-200">
                {isSearching && opponentSuggestions.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-slate-500 italic">Searching teams...</div>
                ) : (
                  opponentSuggestions.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-cyan-600 transition-colors border-b border-white/5 last:border-0 flex items-center justify-between group"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        form.setValue("opponentTeamName", t.name);
                        setOpponentSuggestions([]);
                        setActiveField(null);
                      }}
                    >
                      <span>{t.name}</span>
                      <span className="text-[10px] text-slate-500 group-hover:text-cyan-200 uppercase">{t.id.split('-')[0]}</span>
                    </button>
                  ))
                )}
              </div>
            )}
            {form.formState.errors.opponentTeamName && (
              <p className="text-xs text-red-400">{form.formState.errors.opponentTeamName.message}</p>
            )}
          </div>

          <div className="space-y-2 relative">
            <label className="text-sm font-medium text-slate-300 flex items-center justify-between">
              Your Team Name 
              <span className="text-[10px] text-slate-500 font-normal uppercase tracking-wider">Optional (Comparison)</span>
            </label>
            <div className="relative">
              <Input 
                {...form.register("ownTeamName")}
                placeholder="e.g. Fnatic, LOUD, etc."
                className="bg-slate-900/50 border-white/10 text-white pr-10"
                onFocus={() => setActiveField("own")}
                onBlur={() => setTimeout(() => setActiveField(null), 200)}
                autoComplete="off"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isSearching && activeField === "own" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                ) : (
                  <Search className="h-4 w-4 text-slate-500" />
                )}
              </div>
            </div>
            {activeField === "own" && (ownSuggestions.length > 0 || (isSearching && ownTeamName && ownTeamName.length >= 2)) && (
              <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-white/10 rounded-lg shadow-2xl max-h-48 overflow-auto animate-in fade-in zoom-in-95 duration-200">
                {isSearching && ownSuggestions.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-slate-500 italic">Searching teams...</div>
                ) : (
                  ownSuggestions.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-cyan-600 transition-colors border-b border-white/5 last:border-0 flex items-center justify-between group"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        form.setValue("ownTeamName", t.name);
                        setOwnSuggestions([]);
                        setActiveField(null);
                      }}
                    >
                      <span>{t.name}</span>
                      <span className="text-[10px] text-slate-500 group-hover:text-cyan-200 uppercase">{t.id.split('-')[0]}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Last X Matches</label>
              <Input 
                {...form.register("lastXMatches")}
                type="number"
                min={1}
                max={20}
                className="bg-slate-900/50 border-white/10 text-white"
              />
              {form.formState.errors.lastXMatches && (
                <p className="text-xs text-red-400">{form.formState.errors.lastXMatches.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Time Window</label>
              <Select 
                onValueChange={(value) => form.setValue("timeWindow", value)} 
                defaultValue={form.getValues("timeWindow")}
              >
                <SelectTrigger className="bg-slate-900/50 border-white/10 text-white">
                  <SelectValue placeholder="Select window" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  {TIME_RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Report"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
