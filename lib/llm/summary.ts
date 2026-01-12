import { z } from "zod";
import { fetchJson, safeJsonParse } from "@/lib/utils/fetch";
import { getEnv } from "@/lib/env";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

const llmSummarySchema = z.object({
  executiveSummary: z.string().min(1),
  evidenceRefs: z.array(z.string().min(1)).min(1),
  coverageNote: z.string().min(1),
  howToWin: z
    .array(
      z.object({
        title: z.string().min(1),
        why: z.string().min(1),
        evidenceRefs: z.array(z.string().min(1)).min(1),
      })
    )
    .min(1),
});

export type LlmSummary = z.infer<typeof llmSummarySchema>;

type SummaryInput = {
  teamName: string;
  titleName: string | null;
  timeWindow: string;
  metrics: Record<string, number | null>;
  limitations: string[];
  evidenceRefs: string[];
};

type OpenAiResponse = {
  output_text?: string;
  output?: Array<Record<string, unknown>>;
  error?: { message?: string };
};

export async function generateExecutiveSummary(input: SummaryInput): Promise<LlmSummary> {
  const { OPENAI_API_KEY, OPENAI_MODEL } = getEnv();

  const system = [
    "You are an esports analyst.",
    "Use ONLY the provided metrics and limitations.",
    "Do not invent players, drafts, maps, or objectives.",
    "Use only evidenceRefs from the provided list.",
    "Each howToWin item must include a short title and a 1-2 sentence why with data-backed phrasing.",
    "Return concise, coach-friendly language.",
  ].join(" ");

  const payload = {
    model: OPENAI_MODEL,
    input: [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "scouting_summary",
        schema: {
          type: "object",
          properties: {
            executiveSummary: { type: "string" },
            evidenceRefs: { type: "array", items: { type: "string" } },
            coverageNote: { type: "string" },
            howToWin: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  why: { type: "string" },
                  evidenceRefs: { type: "array", items: { type: "string" } },
                },
                required: ["title", "why", "evidenceRefs"],
                additionalProperties: false,
              },
            },
          },
          required: ["executiveSummary", "evidenceRefs", "coverageNote", "howToWin"],
          additionalProperties: false,
        },
        strict: true,
      },
    },
    temperature: 0.2,
  };

  const response = await fetchJson<OpenAiResponse>(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
    timeoutMs: 30000,
  });

  if (response.error?.message) {
    throw new Error(response.error.message);
  }

  const text = extractOutputText(response);
  if (!text) {
    throw new Error("OpenAI response missing output text");
  }

  const parsed = safeJsonParse(text);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("OpenAI returned non-JSON output");
  }

  return llmSummarySchema.parse(parsed);
}

function extractOutputText(response: OpenAiResponse): string | null {
  if (typeof response.output_text === "string") {
    return response.output_text;
  }

  if (Array.isArray(response.output)) {
    for (const item of response.output) {
      if (!isRecord(item)) {
        continue;
      }

      const content = item.content;
      if (!Array.isArray(content)) {
        continue;
      }

      for (const chunk of content) {
        if (!isRecord(chunk)) {
          continue;
        }

        const type = chunk.type;
        if (type === "output_text" || type === "text") {
          const text = chunk.text;
          if (typeof text === "string") {
            return text;
          }
        }
      }
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
