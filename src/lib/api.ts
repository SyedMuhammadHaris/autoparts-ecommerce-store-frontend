export type User = {
  id: number; name: string; email: string; email_verified: boolean;
  is_staff: boolean; is_superuser: boolean; permissions: string[];
};
export class ApiError extends Error {
  constructor(message: string, public status: number, public details: Record<string, string[]> = {}) { super(message); }
}

export async function apiRequest<T>(path: string, method = "GET", data?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (method !== "GET") {
    const csrfResponse = await fetch("/api/auth/csrf", { cache: "no-store", credentials: "same-origin" });
    if (!csrfResponse.ok) throw new ApiError("Unable to prepare the request. Please try again.", csrfResponse.status);
    const csrf = await csrfResponse.json();
    headers["X-CSRFToken"] = csrf.csrfToken;
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(path, {
    method, headers, cache: "no-store", credentials: "same-origin",
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  if (response.status === 204) return undefined as T;
  const payload = await response.json();
  if (!response.ok) throw new ApiError(payload.error?.message ?? "Request failed.", response.status, payload.error?.details ?? {});
  return payload;
}

export function friendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    const details = Object.values(error.details).flat().filter(value => typeof value === "string");
    return details.length ? details.join(" ") : error.message;
  }
  return "Unable to connect. Please try again.";
}
