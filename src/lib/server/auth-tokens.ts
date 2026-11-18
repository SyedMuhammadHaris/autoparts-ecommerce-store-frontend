import "server-only";
import { createHash } from "node:crypto";
import type { JWT } from "next-auth/jwt";
import { backendConfiguration } from "@/lib/server/backend";
import { readSiteUrl } from "@/lib/env";

export type TokenPair = { access: string; refresh: string; access_expires_at: number; refresh_expires_at: number };
export class SessionEnded extends Error {}

export function authConfiguration() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error("Configure NEXTAUTH_SECRET with at least 32 random bytes.");
  const origin = readSiteUrl(process.env.NEXTAUTH_URL);
  if (origin !== readSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)) throw new Error("NEXTAUTH_URL must match NEXT_PUBLIC_SITE_URL.");
  return { secret, origin, secure: origin.startsWith("https:") };
}

export function readTokenPair(value: unknown): TokenPair {
  if (!value || typeof value !== "object") throw new Error("Invalid authentication response");
  const pair = value as TokenPair;
  if (![pair.access, pair.refresh].every(token => typeof token === "string" && /^[A-Za-z0-9_.-]{1,2048}$/.test(token))) throw new Error("Invalid authentication response");
  if (![pair.access_expires_at, pair.refresh_expires_at].every(expiry => Number.isSafeInteger(expiry) && expiry > Date.now() / 1000)) throw new SessionEnded();
  return pair;
}

export function withTokens(token: JWT, pair: TokenPair): JWT {
  return { ...token, accessToken: pair.access, refreshToken: pair.refresh, accessExpiresAt: pair.access_expires_at, refreshExpiresAt: pair.refresh_expires_at };
}

// Single-flight coordination for this one-process Next server. Values are never logged.
// A short completed-result window lets parallel requests carrying the old cookie converge.
const refreshes = new Map<string, Promise<TokenPair>>();
async function fetchRefresh(refresh: string): Promise<TokenPair> {
  const { baseUrl, timeoutMs } = backendConfiguration();
  const response = await fetch(`${baseUrl}/auth/refresh/`, {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refresh }), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(timeoutMs),
  });
  if (response.status === 401 || response.status === 400) throw new SessionEnded();
  if (!response.ok) throw new Error("Authentication service unavailable");
  return readTokenPair(await response.json());
}

export async function refreshTokens(token: JWT): Promise<JWT> {
  if (!token.refreshToken || !token.refreshExpiresAt || token.refreshExpiresAt <= Date.now() / 1000) throw new SessionEnded();
  if (token.accessToken && token.accessExpiresAt && token.accessExpiresAt > Date.now() / 1000 + 15) return token;
  const key = createHash("sha256").update(token.refreshToken).digest("hex");
  let pending = refreshes.get(key);
  if (!pending) {
    if (refreshes.size >= 1000) throw new Error("Authentication service busy");
    pending = fetchRefresh(token.refreshToken);
    refreshes.set(key, pending);
    const clear = () => { setTimeout(() => refreshes.delete(key), 5000).unref(); };
    void pending.then(clear, () => refreshes.delete(key));
  }
  return withTokens(token, await pending);
}
