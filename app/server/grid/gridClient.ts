import { GRID_ENDPOINTS } from "@/app/server/grid/endpoints";
import { gridCache } from "@/app/server/grid/cache";
import { safeJsonParse } from "@/lib/utils/fetch";

export type GraphQLErrorItem = {
  message: string;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
};

export type GraphQLResponse<T> = {
  data?: T;
  errors?: GraphQLErrorItem[];
};

export type GridRequestOptions = {
  endpoint: keyof typeof GRID_ENDPOINTS;
  query: string;
  variables?: Record<string, unknown>;
  cacheTtlMs?: number;
  retries?: number;
};

export class GridMissingKeyError extends Error {
  constructor() {
    super("GRID_API_KEY missing");
    this.name = "GridMissingKeyError";
  }
}

export class GridGraphQLError extends Error {
  errors: GraphQLErrorItem[];
  context?: { endpoint: string; operationName?: string | null; variables: Record<string, unknown> };

  constructor(
    errors: GraphQLErrorItem[],
    context?: { endpoint: string; operationName?: string | null; variables: Record<string, unknown> }
  ) {
    super("GRID GraphQL error");
    this.name = "GridGraphQLError";
    this.errors = errors;
    this.context = context;
  }
}

export function isRateLimitGraphQLError(error: GridGraphQLError): boolean {
  return error.errors.some((entry) => {
    const message = entry.message.toLowerCase();
    const extensions = entry.extensions ?? {};
    const errorType = typeof extensions.errorType === "string" ? extensions.errorType : "";
    const errorDetail = typeof extensions.errorDetail === "string" ? extensions.errorDetail : "";
    return (
      message.includes("rate limit") ||
      errorType === "UNAVAILABLE" ||
      errorDetail === "ENHANCE_YOUR_CALM"
    );
  });
}

export class GridRequestError extends Error {
  status?: number;
  gridBody?: string;

  constructor(message: string, options?: { status?: number; gridBody?: string }) {
    super(message);
    this.name = "GridRequestError";
    this.status = options?.status;
    this.gridBody = options?.gridBody;
  }
}

export class GridAuthError extends GridRequestError {
  constructor(status: number, gridBody?: string) {
    super("Missing/invalid x-api-key header", { status, gridBody });
    this.name = "GridAuthError";
  }
}

export async function requestGrid<T>(options: GridRequestOptions): Promise<T> {
  const apiKey = process.env.GRID_API_KEY;
  if (!apiKey) {
    throw new GridMissingKeyError();
  }

  const variables = sanitizeVariables(options.variables ?? {});
  const operationName = getOperationName(options.query);
  const cacheKey = buildCacheKey(options.endpoint, options.query, variables);
  if (options.cacheTtlMs) {
    const cached = gridCache.get(cacheKey) as T | undefined;
    if (cached) {
      return cached;
    }
  }

  const attemptLimit = options.retries ?? 2;
  let attempt = 0;

  while (true) {
    try {
      const response = await fetch(GRID_ENDPOINTS[options.endpoint], {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ query: options.query, variables }),
      });

      const rawText = await response.text();
      const parsed = rawText ? (safeJsonParse(rawText) as GraphQLResponse<T>) : {};

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new GridAuthError(response.status, rawText);
        }
        throw new GridRequestError(`GRID request failed with status ${response.status}`, {
          status: response.status,
          gridBody: rawText,
        });
      }

      if (parsed && Array.isArray(parsed.errors) && parsed.errors.length > 0) {
        throw new GridGraphQLError(parsed.errors, {
          endpoint: options.endpoint,
          operationName,
          variables,
        });
      }

      if (!parsed || typeof parsed !== "object" || !("data" in parsed)) {
        throw new GridRequestError("GRID response missing data", { gridBody: rawText });
      }

      const data = parsed.data as T;
      if (options.cacheTtlMs) {
        gridCache.set(cacheKey, data, options.cacheTtlMs);
      }
      return data;
    } catch (error) {
      if (!shouldRetry(error) || attempt >= attemptLimit) {
        throw error;
      }
      await sleep(backoffMs(attempt, error));
      attempt += 1;
    }
  }
}

function buildCacheKey(endpoint: string, query: string, variables: Record<string, unknown>) {
  return `${endpoint}:${query}:${JSON.stringify(variables)}`;
}

function getOperationName(query: string): string | null {
  const match = query.match(/\b(query|mutation)\s+([A-Za-z0-9_]+)/);
  return match?.[2] ?? null;
}

function sanitizeVariables(input: Record<string, unknown>): Record<string, unknown> {
  const variables: Record<string, unknown> = { ...input };
  if ("filter" in variables) {
    const filterValue = variables.filter;
    if (Array.isArray(filterValue)) {
      variables.filter = firstObject(filterValue) ?? {};
    } else if (isPlainObject(filterValue)) {
      variables.filter = sanitizeFilter(filterValue);
    }
  }
  return variables;
}

function sanitizeFilter(filter: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...filter };
  if (Array.isArray(result.startedAt)) {
    result.startedAt = firstObject(result.startedAt) ?? {};
  }
  if (Array.isArray(result.timeWindow)) {
    result.timeWindow = result.timeWindow[0];
  }
  return result;
}

function firstObject(values: unknown[]): Record<string, unknown> | null {
  for (const value of values) {
    if (isPlainObject(value)) {
      return value;
    }
  }
  return null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function shouldRetry(error: unknown): boolean {
  if (error instanceof GridAuthError || error instanceof GridMissingKeyError) {
    return false;
  }

  if (error instanceof GridGraphQLError) {
    return isRateLimitGraphQLError(error);
  }

  if (error instanceof GridRequestError) {
    return Boolean(error.status && (error.status >= 500 || error.status === 429));
  }

  return error instanceof Error;
}

function backoffMs(attempt: number, error?: unknown): number {
  const isRateLimit =
    error instanceof GridGraphQLError ? isRateLimitGraphQLError(error) : false;
  const base = isRateLimit ? 1500 : 500;
  const multiplier = isRateLimit ? 2 : 1;
  const jitter = Math.floor(Math.random() * 250);
  return base * multiplier * (attempt + 1) + jitter;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
