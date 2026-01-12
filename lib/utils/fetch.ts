export type FetchOptions = RequestInit & { timeoutMs?: number };

export class HttpError extends Error {
  status: number;
  body: unknown;
  rawText: string;

  constructor(status: number, message: string, body: unknown, rawText: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
    this.rawText = rawText;
  }
}

export async function fetchJson<T>(input: RequestInfo | URL, options: FetchOptions = {}): Promise<T> {
  const { timeoutMs = 15000, ...init } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    const text = await response.text();
    const parsed = text.length ? safeJsonParse(text) : null;

    if (!response.ok) {
      const message = `Request failed with status ${response.status}`;
      throw new HttpError(response.status, message, parsed ?? text, text);
    }

    return parsed as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
