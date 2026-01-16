"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TITLE_OPTIONS, TIME_RANGE_OPTIONS } from "@/lib/ui/constants";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  title: z.enum(["val", "lol"]),
  opponentTeamName: z.string().min(2, "Team name must be at least 2 characters"),
  lastXMatches: z.coerce.number().min(1).max(20),
  timeWindow: z.string(),
});

export type ReportFormValues = z.infer<typeof formSchema>;

interface ReportFormProps {
  onSubmit: (values: ReportFormValues) => void;
  isLoading: boolean;
}

export function ReportForm({ onSubmit, isLoading }: ReportFormProps) {
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "val",
      opponentTeamName: "",
      lastXMatches: 10,
      timeWindow: "LAST_6_MONTHS",
    },
  });

  return (
    <Card className="border-white/5 bg-white/5 backdrop-blur-sm">
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Opponent Team Name</label>
            <Input 
              {...form.register("opponentTeamName")}
              placeholder="e.g. Sentinels, G2, etc."
              className="bg-slate-900/50 border-white/10 text-white"
            />
            {form.formState.errors.opponentTeamName && (
              <p className="text-xs text-red-400">{form.formState.errors.opponentTeamName.message}</p>
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
