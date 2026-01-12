import { fetchJson, safeJsonParse } from "@/lib/utils/fetch";
import { buildLlmPrompt, type PromptInput } from "@/lib/llm/prompts";
import { llmReportSchema, type LlmScoutingNarrative } from "@/lib/llm/schema";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

type OpenAiResponse = {
  output_text?: string;
  output?: Array<Record<string, unknown>>;
  error?: { message?: string };
};

export async function generateScoutingNarrative(input: PromptInput): Promise<LlmScoutingNarrative> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const model = process.env.OPENAI_MODEL;
  if (!model) {
    throw new Error("OPENAI_MODEL is missing");
  }

  const { system, user } = buildLlmPrompt(input);

  const payload = {
    model,
    input: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  };

  const response = await fetchJson<OpenAiResponse>(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
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
  if (typeof parsed === "string") {
    throw new Error("OpenAI returned non-JSON output");
  }

  return llmReportSchema.parse(parsed);
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