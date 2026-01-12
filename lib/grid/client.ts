import { centralCache, statsCache } from "@/lib/cache";
import { getEnv } from "@/lib/env";

export type GridEndpoint = "central" | "stats";

export type GraphQLErrorItem = {
  message: string;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
};

export type GraphQLResponse<T> = {
  data?: T;
  errors?: GraphQLErrorItem[];
};

export class GridAuthError extends Error {
  status: number;
  constructor(status: number) {
    super("Missing/invalid x-api-key header");
    this.name = "GridAuthError";
    this.status = status;
  }
}

export class GridRequestError extends Error {
  status: number;
  gridBody: string | null;
  constructor(message: string, status: number, gridBody: string | null) {
    super(message);
    this.name = "GridRequestError";
    this.status = status;
    this.gridBody = gridBody;
  }
}

export class GridGraphQLError extends Error {
  errors: GraphQLErrorItem[];
  context: { endpoint: GridEndpoint; operationName: string | null; variables: Record<string, unknown> };
  constructor(
    errors: GraphQLErrorItem[],
    context: { endpoint: GridEndpoint; operationName: string | null; variables: Record<string, unknown> }
  ) {
    super("GRID GraphQL error");
    this.name = "GridGraphQLError";
    this.errors = errors;
    this.context = context;
  }
}

export type GridRequestOptions = {
  endpoint: GridEndpoint;
  query: string;
  variables?: Record<string, unknown>;
  cacheTtlMs?: number;
  retries?: number;
};

export async function requestGrid<T>(options: GridRequestOptions): Promise<T> {
  const { GRID_API_KEY, GRID_CENTRAL_URL, GRID_STATS_URL } = getEnv();
  const variables = options.variables ?? {};
  const cacheKey = `${options.endpoint}:${options.query}:${JSON.stringify(variables)}`;

  const cache = options.endpoint === "central" ? centralCache : statsCache;
  const ttl = options.cacheTtlMs ?? (options.endpoint === "central" ? 5 * 60 * 1000 : 15 * 60 * 1000);

  const cached = cache.get(cacheKey) as T | undefined;
  if (cached) {
    return cached;
  }

  const operationName = getOperationName(options.query);
  const retries = options.retries ?? 1;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const endpointUrl =
      options.endpoint === "central" ? GRID_CENTRAL_URL : GRID_STATS_URL;
    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": GRID_API_KEY,
      },
      body: JSON.stringify({ query: options.query, variables }),
    });

    const rawText = await response.text();
    const parsed = rawText ? (safeJsonParse(rawText) as GraphQLResponse<T>) : {};

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new GridAuthError(response.status);
      }
      throw new GridRequestError(`GRID request failed with status ${response.status}`, response.status, rawText);
    }

    if (parsed.errors?.length) {
      const error = new GridGraphQLError(parsed.errors, {
        endpoint: options.endpoint,
        operationName,
        variables,
      });

      if (attempt < retries && isRetryableGraphQLError(error)) {
        await sleep(500 + attempt * 300);
        continue;
      }

      throw error;
    }

    if (!parsed || !parsed.data) {
      throw new GridRequestError("GRID response missing data", 502, rawText);
    }

    cache.set(cacheKey, parsed.data, ttl);
    return parsed.data;
  }

  throw new GridRequestError("GRID request failed", 502, null);
}

export function isPermissionDenied(error: GridGraphQLError): boolean {
  return error.errors.some((entry) => {
    const message = entry.message.toLowerCase();
    const extensions = entry.extensions ?? {};
    const errorType = typeof extensions.errorType === "string" ? extensions.errorType : "";
    return message.includes("permission") || errorType === "PERMISSION_DENIED";
  });
}

export function isFieldNotFound(error: GridGraphQLError): boolean {
  return error.errors.some((entry) => {
    const message = entry.message.toLowerCase();
    const errorType = typeof entry.extensions?.errorType === "string" ? entry.extensions?.errorType : "";
    const hasField = message.includes("field");
    const isMissing =
      message.includes("undefined") || message.includes("cannot query") || message.includes("unknown field");
    return (hasField && isMissing) || errorType === "FIELD_NOT_FOUND";
  });
}

export function isRateLimited(error: GridGraphQLError): boolean {
  return error.errors.some((entry) => {
    const message = entry.message.toLowerCase();
    const detail = typeof entry.extensions?.errorDetail === "string" ? entry.extensions.errorDetail : "";
    return message.includes("rate limit") || detail === "ENHANCE_YOUR_CALM";
  });
}

function isRetryableGraphQLError(error: GridGraphQLError): boolean {
  return isRateLimited(error);
}

function getOperationName(query: string): string | null {
  const match = query.match(/\b(query|mutation)\s+([A-Za-z0-9_]+)/);
  return match?.[2] ?? null;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
