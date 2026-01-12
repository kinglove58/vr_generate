import { z } from "zod";

export const scoutingReportSchema = z.object({
  title: z.enum(["val", "lol"]),
  opponentTeamName: z.string().min(2),
  lastXMatches: z.number().int().min(1).max(20).default(5),
});

export const teamsSearchSchema = z.object({
  q: z.string().min(2),
  limit: z.number().int().min(1).max(50).default(10),
});

export const seriesByTournamentSchema = z.object({
  titleId: z.number().int().positive(),
  tournament: z.string().min(2),
  first: z.number().int().min(1).max(50).default(20),
});