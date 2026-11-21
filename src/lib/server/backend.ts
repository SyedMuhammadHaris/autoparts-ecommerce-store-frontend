import "server-only";
import { serverFetch } from "./fetch";
export { backendConfiguration } from "./backend-configuration";

export type BackendHealth = { status: "ok" };

export class BackendUnavailableError extends Error {
  constructor() {
    super("The service is temporarily unavailable.");
    this.name = "BackendUnavailableError";
  }
}

/** Fixed destination and fixed headers: this client is not a general proxy. */
export async function getBackendHealth(requestId: string): Promise<BackendHealth> {
  try {
    const body = await serverFetch<unknown>({ path: "/health/ready/", requestId });
    if (!body || typeof body !== "object" || !("status" in body) || body.status !== "ok") {
      throw new BackendUnavailableError();
    }
    return { status: "ok" };
  } catch {
    // Never forward raw errors, URLs, backend diagnostics or configuration values.
    throw new BackendUnavailableError();
  }
}
