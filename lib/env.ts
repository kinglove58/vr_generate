import { z } from "zod";

const envSchema = z.object({
  GRID_API_KEY: z.string().min(1),
  GRID_CENTRAL_URL: z.string().url(),
  GRID_STATS_URL: z.string().url(),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().min(1),
});

let cachedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }
  return cachedEnv;
}
