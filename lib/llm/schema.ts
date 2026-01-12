import { z } from "zod";

export const llmReportSchema = z.object({
  executiveSummary: z.string().min(1),
  strengths: z.array(z.string().min(1)),
  weaknesses: z.array(z.string().min(1)),
  recommendations: z.array(z.string().min(1)),
  mapVetoSuggestions: z.array(z.string().min(1)),
  playersToWatch: z.array(
    z.object({
      name: z.string().min(1),
      reason: z.string().min(1),
    })
  ),
});

export type LlmScoutingNarrative = z.infer<typeof llmReportSchema>;