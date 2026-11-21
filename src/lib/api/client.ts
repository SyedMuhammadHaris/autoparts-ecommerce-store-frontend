"use client";
import { ApiError, apiPath, responseData, requestMethod, type ApiOptions, type ApiAction } from "./contracts";

export async function clientFetch<T>(options: ApiOptions): Promise<T> {
  const path = apiPath(options);
  if (!path.startsWith("/api/")) throw new ApiError("Use a same-origin API endpoint.", 400);
  const method = requestMethod(options);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (method !== "GET") {
    // NextAuth owns this native protocol endpoint; it deliberately has no application envelope.
    const csrfResponse = await fetch("/api/auth/csrf", { cache: "no-store", credentials: "same-origin", signal: options.signal });
    if (!csrfResponse.ok) throw new ApiError("Unable to prepare the request. Please try again.", csrfResponse.status);
    const csrf = await csrfResponse.json();
    if (typeof csrf.csrfToken !== "string") throw new ApiError("Unable to prepare the request.", 503);
    headers["X-CSRFToken"] = csrf.csrfToken;
    headers["Content-Type"] = "application/json";
  }
  return responseData<T>(await fetch(path, { method, headers, cache: "no-store", credentials: "same-origin", signal: options.signal,
    body: options.payload === undefined ? undefined : JSON.stringify(options.payload) }));
}
export function apiAction<T>(options: ApiAction): Promise<T> { return clientFetch<T>(options); }
