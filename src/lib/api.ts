export type User = {
  id: number; name: string; email: string; email_verified: boolean;
  is_staff: boolean; is_superuser: boolean; permissions: string[];
};
import { ApiError, type HttpMethod } from "./api/contracts";
import { clientFetch } from "./api/client";
export { ApiError } from "./api/contracts";
export { clientFetch, apiAction } from "./api/client";

export async function apiRequest<T>(path: string, method = "GET", data?: unknown): Promise<T> {
  return clientFetch<T>({ path, method: method as HttpMethod, payload: data });
}

export function friendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    const details = Object.values(error.details).flat().filter(value => typeof value === "string");
    return details.length ? details.join(" ") : error.message;
  }
  return "Unable to connect. Please try again.";
}
