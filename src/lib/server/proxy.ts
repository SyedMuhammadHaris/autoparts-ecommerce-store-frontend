import "server-only";
import { randomUUID } from "node:crypto";
import { backendConfiguration } from "@/lib/server/backend";
import { readSiteUrl } from "@/lib/env";
import type { JWT } from "next-auth/jwt";
import { checkBrowserMutation, readAuthState, setAuthCookie } from "@/lib/server/auth-session";
import { SessionEnded } from "@/lib/server/auth-tokens";
import { limitedBody } from "@/lib/server/request-body";
import { cartCookie, hasAuthCookie } from "@/lib/server/cart-cookie";
import { errorEnvelope } from "@/lib/api/contracts";

function errorResponse(status: number, requestId: string, code: string, message: string) {
  return Response.json(errorEnvelope(status, message, code, requestId), {
    status, headers: { "Cache-Control": "no-store", "Vary": "Cookie", "X-Request-ID": requestId },
  });
}

export async function proxyApi(request: Request, endpoint: string, allowedMethods: string[]): Promise<Response> {
  const requestId = randomUUID();
  if (!allowedMethods.includes(request.method)) {
    return errorResponse(405, requestId, "METHOD_NOT_ALLOWED", "This request method is not allowed.");
  }
  try {
    const { baseUrl, timeoutMs } = backendConfiguration();
    const origin = readSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
    const unsafe = !["GET", "HEAD", "OPTIONS"].includes(request.method);
    if (unsafe && request.headers.get("origin") !== origin) {
      return errorResponse(403, requestId, "ORIGIN_REJECTED", "Refresh the page and try again.");
    }
    const headers: Record<string, string> = { Accept: "application/json", "X-Request-ID": requestId };
    let body: string | undefined;
    if (unsafe) {
      if (!checkBrowserMutation(request)) {
        return errorResponse(403, requestId, "CSRF_FAILED", "Refresh the page and try again.");
      }
      headers["Content-Type"] = "application/json";
      try { body = await limitedBody(request); if (body) JSON.parse(body); } catch {
        return errorResponse(400, requestId, "INVALID_BODY", "Send a valid JSON request smaller than 64 KB.");
      }
    }
    let state: JWT | undefined;
    const commerce = endpoint.startsWith("/cart/") || endpoint.startsWith("/checkout/") || endpoint.startsWith("/orders/");
    const guest = commerce ? cartCookie(request) : undefined;
    if (guest) headers["X-Cart-Token"] = guest.token;
    const anonymous = endpoint === "/auth/register/" || endpoint.startsWith("/catalog/") || endpoint === "/shipping/options/";
    if (!anonymous && (!commerce || hasAuthCookie(request))) {
      state = await readAuthState(request);
      headers.Authorization = `Bearer ${state.accessToken}`;
    }
    const upstream = await fetch(baseUrl + endpoint, {
      method: request.method, headers, body, cache: "no-store", redirect: "error",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (upstream.status >= 500) {
      return errorResponse(503, requestId, "SERVICE_UNAVAILABLE", "This service is temporarily unavailable. Please try again.");
    }
    const responseHeaders = new Headers({ "Cache-Control": "no-store", "Vary": "Cookie", "X-Request-ID": requestId });
    const retry = upstream.headers.get("retry-after");
    if (retry && /^\d{1,6}$/.test(retry)) responseHeaders.set("Retry-After", retry);
    if (upstream.status === 204) {
      const response = new Response(null, { status: 204, headers: responseHeaders });
      if (state) await setAuthCookie(response, state);
      return response;
    }
    if (!upstream.headers.get("content-type")?.includes("application/json")) throw new Error("Invalid upstream response");
    const payload = await upstream.json();
    if (!upstream.ok && payload?.error) payload.request_id = requestId;
    const response = Response.json(payload, { status: upstream.status, headers: responseHeaders });
    if (guest) response.headers.append("Set-Cookie", guest.header);
    if (state && upstream.ok) await setAuthCookie(response, state);
    return response;
  } catch (failure) {
    if (failure instanceof SessionEnded) return errorResponse(401, requestId, "NOT_AUTHENTICATED", "Sign in to continue.");
    return errorResponse(503, requestId, "SERVICE_UNAVAILABLE", "This service is temporarily unavailable. Please try again.");
  }
}
