import { z } from "zod";
import { SeriesTypeValues } from "@/lib/grid/types";

const seriesTypeSchema = z.enum(SeriesTypeValues);

const startTimeSchema = z
  .object({
    gte: z.string().datetime().optional(),
    lte: z.string().datetime().optional(),
  })
  .refine((value) => value.gte || value.lte, {
    message: "startTime must include gte or lte",
  });

const dateRangeSchema = z
  .object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  })
  .refine((value) => new Date(value.from).getTime() <= new Date(value.to).getTime(), {
    message: "dateRange.from must be before or equal to dateRange.to",
    path: ["from"],
  });

export const seriesRequestSchema = z.object({
  titleId: z.number().int().positive().default(6),
  types: seriesTypeSchema.default("ESPORTS"),
  first: z.number().int().min(1).max(50).default(20),
  after: z.string().min(1).optional(),
  startTime: startTimeSchema.optional(),
});

export const endStateQuerySchema = z.object({
  seriesId: z.string().min(1),
});

export const reportGenerateSchema = z.object({
  opponentTeamId: z.string().min(1),
  lastN: z.number().int().min(1).max(30).default(12),
  dateRange: dateRangeSchema.optional(),
  types: seriesTypeSchema.default("ESPORTS"),
});

export function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}