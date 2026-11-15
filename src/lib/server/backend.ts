import "server-only";

export type BackendHealth = { status: "ok" };

export class BackendUnavailableError extends Error {
  constructor() {
    super("The service is temporarily unavailable.");
    this.name = "BackendUnavailableError";
  }
}

export function backendConfiguration(): { baseUrl: string; timeoutMs: number } {
  const value = process.env.BACKEND_API_URL;
  let url: URL;
  try {
    url = new URL(value ?? "");
  } catch {
    throw new Error("Configure BACKEND_API_URL in .env.local; see .env.example.");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username || url.password || url.search || url.hash ||
    !/^\/api\/v1\/?$/.test(url.pathname)
  ) {
    throw new Error("BACKEND_API_URL must be an HTTP(S) API origin ending in /api/v1.");
  }
  const timeoutMs = Number(process.env.BACKEND_API_TIMEOUT_MS ?? "5000");
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 15000) {
    throw new Error("BACKEND_API_TIMEOUT_MS must be an integer from 100 to 15000.");
  }
  return { baseUrl: url.origin + url.pathname.replace(/\/$/, ""), timeoutMs };
}

/** Fixed destination and fixed headers: this client is not a general proxy. */
export async function getBackendHealth(requestId: string): Promise<BackendHealth> {
  try {
    const { baseUrl, timeoutMs } = backendConfiguration();
    const response = await fetch(`${baseUrl}/health/ready/`, {
      cache: "no-store",
      redirect: "error",
      headers: { Accept: "application/json", "X-Request-ID": requestId },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
      throw new BackendUnavailableError();
    }
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || !("status" in body) || body.status !== "ok") {
      throw new BackendUnavailableError();
    }
    return { status: "ok" };
  } catch {
    // Never forward raw errors, URLs, backend diagnostics or configuration values.
    throw new BackendUnavailableError();
  }
}
