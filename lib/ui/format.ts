export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "N/A";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatNumber(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) return "N/A";
  return value.toFixed(decimals);
}

export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  const keys = path.split(".");
  let result = obj;
  for (const key of keys) {
    if (result === null || result === undefined) return defaultValue;
    result = result[key];
  }
  return result === undefined || result === null ? defaultValue : result;
}
