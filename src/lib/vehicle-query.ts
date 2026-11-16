export function vehicleQuery(query: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  for (const key of ["make", "model", "year", "engine", "trim"]) {
    const value = query[key];
    if (typeof value === "string" && value.trim() && value.length <= 120) params.set(key, value);
  }
  return params.toString();
}
