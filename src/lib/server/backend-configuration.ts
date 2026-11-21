import "server-only";
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
