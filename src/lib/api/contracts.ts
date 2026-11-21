export class ApiError extends Error {
  constructor(message: string, public status: number, public details: Record<string, string[]> = {}, public code = "REQUEST_FAILED", public requestId?: string) { super(message); }
}
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type Query = Record<string, string | number | boolean | readonly (string | number)[] | null | undefined>;
export type ApiOptions = {
  path: string; method?: HttpMethod; payload?: unknown; query?: Query;
  pathParams?: Record<string, string | number>; signal?: AbortSignal;
};
export type ApiAction = ApiOptions & { method: Exclude<HttpMethod, "GET"> };

export function requestMethod(options: ApiOptions): HttpMethod {
  const method = options.method ?? "GET";
  if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method) || method === "GET" && options.payload !== undefined) throw new ApiError("Invalid API method or GET payload.", 400);
  return method;
}

export function apiPath({ path, pathParams = {}, query }: Pick<ApiOptions, "path" | "pathParams" | "query">): string {
  const staticPath = path.split("?")[0];
  if (!path.startsWith("/") || path.startsWith("//") || /[\\#\x00]/.test(path) || /%(2e|2f|5c)/i.test(staticPath) || /(?:^|\/)\.{1,2}(?:\/|$)/.test(staticPath)) throw new ApiError("Invalid API path.", 400);
  const resolved = path.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (_, key: string) => {
    const value = pathParams[key];
    if (value === undefined || String(value).length === 0 || [".", ".."].includes(String(value))) throw new ApiError("Missing or invalid path parameter.", 400);
    return encodeURIComponent(String(value));
  });
  if (/[{}]/.test(resolved)) throw new ApiError("Invalid path parameter.", 400);
  const divider = resolved.indexOf("?");
  const pathname = divider === -1 ? resolved : resolved.slice(0, divider);
  const search = divider === -1 ? "" : resolved.slice(divider + 1);
  const params = new URLSearchParams(search);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) continue;
    params.delete(key);
    for (const entry of Array.isArray(value) ? value : [value]) params.append(key, String(entry));
  }
  return pathname + (params.size ? `?${params}` : "");
}

export async function responseData<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  if (!response.headers.get("content-type")?.includes("application/json")) throw new ApiError("Invalid service response.", 503);
  let body;
  try { body = await response.json(); } catch { throw new ApiError("Invalid service response.", 503); }
  if (!response.ok) {
    const error = body?.error;
    throw new ApiError(typeof error?.message === "string" ? error.message : "Request failed.", response.status,
      fieldDetails(error?.data?.details), error?.data?.error_code ?? "REQUEST_FAILED",
      typeof body?.request_id === "string" ? body.request_id : response.headers.get("x-request-id") ?? undefined);
  }
  if (body?.error !== null || !body?.success || body.success.code !== response.status || !("data" in body.success)) throw new ApiError("Invalid service response.", 503);
  return body.success.data as T;
}

function fieldDetails(value: unknown, prefix = ""): Record<string, string[]> {
  if (Array.isArray(value)) return { [prefix || "non_field_errors"]: value.filter((entry): entry is string => typeof entry === "string") };
  if (!value || typeof value !== "object") return {};
  return Object.assign({}, ...Object.entries(value).map(([key, entry]) => {
    const field = prefix ? `${prefix}.${key}` : key;
    return typeof entry === "string" ? { [field]: [entry] } : fieldDetails(entry, field);
  }));
}

export function successEnvelope(data: unknown, status = 200, requestId?: string) {
  return { success: { code: status, data, message: null }, error: null, ...(requestId ? { request_id: requestId } : {}) };
}
export function errorEnvelope(status: number, message: string, code: string, requestId?: string) {
  return { success: null, error: { code: status, data: { error_code: code, details: {} }, message }, ...(requestId ? { request_id: requestId } : {}) };
}
