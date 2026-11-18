import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { encode, getToken, type JWT } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { authConfiguration, refreshTokens, SessionEnded } from "@/lib/server/auth-tokens";

export function checkBrowserMutation(request: Request): boolean {
  const { secret, origin, secure } = authConfiguration();
  if (request.headers.get("origin") !== origin) return false;
  const name = secure ? "__Host-next-auth.csrf-token" : "next-auth.csrf-token";
  const entry = (request.headers.get("cookie") ?? "").split(";").map(value => value.trim()).find(value => value.startsWith(name + "="));
  if (!entry) return false;
  try {
    const [csrf, signature] = decodeURIComponent(entry.slice(name.length + 1)).split("|");
    const supplied = request.headers.get("x-csrftoken");
    if (!/^[a-f0-9]{64}$/.test(csrf) || !/^[a-f0-9]{64}$/.test(signature) || supplied !== csrf) return false;
    const expected = createHash("sha256").update(csrf + secret).digest("hex");
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch { return false; }
}

export async function readAuthState(request: Request): Promise<JWT> {
  const { secret, secure } = authConfiguration();
  // Deliberately ignore Authorization supplied by the browser: only our encrypted cookie authenticates BFF calls.
  const cookieRequest = new NextRequest(request.url, { headers: { cookie: request.headers.get("cookie") ?? "" } });
  const token = await getToken({ req: cookieRequest, secret, secureCookie: secure });
  if (!token || token.authError) throw new SessionEnded();
  return refreshTokens(token);
}

export async function setAuthCookie(response: Response, token: JWT) {
  const { secret, secure } = authConfiguration();
  const maxAge = Math.min(86400, Math.floor((token.refreshExpiresAt ?? 0) - Date.now() / 1000));
  if (maxAge <= 0) throw new SessionEnded();
  const value = await encode({ token, secret, maxAge });
  if (value.length > 3800) throw new Error("Authentication cookie exceeds supported size");
  const name = secure ? "__Secure-next-auth.session-token" : "next-auth.session-token";
  response.headers.append("Set-Cookie", `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`);
}
