"use client";
import { ApiError, apiPath, responseData, requestMethod, type ApiOptions, type ApiAction } from "./contracts";
import { notifyError, notifySuccess } from "@/lib/notifications";

export async function clientFetch<T>(options: ApiOptions): Promise<T> {
  const path = apiPath(options);
  if (!path.startsWith("/api/")) throw new ApiError("Use a same-origin API endpoint.", 400);
  const method = requestMethod(options);
  const mutation = method !== "GET";
  try {
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
    const response = await fetch(path, { method, headers, cache: "no-store", credentials: "same-origin", signal: options.signal,
      body: options.payload === undefined ? undefined : JSON.stringify(options.payload) });
    let message: string | null = null;
    const data = await responseData<T>(response, value => { message = value; });
    if (mutation && options.notifications?.success !== false) {
      notifySuccess(message || options.notifications?.success || (method === "DELETE" ? "Deleted successfully." : "Changes saved."));
    }
    return data;
  } catch (error) {
    if (mutation && options.notifications?.error !== false && !options.signal?.aborted) notifyError(error);
    throw error;
  }
}
export function apiAction<T>(options: ApiAction): Promise<T> { return clientFetch<T>(options); }
