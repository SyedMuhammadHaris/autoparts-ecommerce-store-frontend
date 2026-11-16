import "server-only";
import { randomUUID } from "node:crypto";
import { backendConfiguration } from "@/lib/server/backend";
import { readSiteUrl } from "@/lib/env";

function errorResponse(status: number, requestId: string, code: string, message: string) {
  return Response.json({ error: { code, message, details: {} }, request_id: requestId }, {
    status, headers: { "Cache-Control": "no-store", "Vary": "Cookie", "X-Request-ID": requestId },
  });
}

async function limitedBody(request: Request): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    length += next.value.byteLength;
    if (length > 65536) { await reader.cancel(); throw new Error("Request too large"); }
    chunks.push(next.value);
  }
  return Buffer.concat(chunks).toString("utf8");
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
    const cookies = (request.headers.get("cookie") ?? "").split(";").map(value => value.trim()).filter(value => /^(sessionid|csrftoken)=[A-Za-z0-9_-]{1,256}$/.test(value));
    if (cookies.length) headers.Cookie = cookies.join("; ");
    let body: string | undefined;
    if (unsafe) {
      const csrf = request.headers.get("x-csrftoken") ?? "";
      if (!/^[A-Za-z0-9]{32,64}$/.test(csrf)) {
        return errorResponse(403, requestId, "CSRF_FAILED", "Refresh the page and try again.");
      }
      headers["X-CSRFToken"] = csrf;
      headers.Origin = origin;
      headers.Referer = origin + "/";
      headers["Content-Type"] = "application/json";
      try { body = await limitedBody(request); if (body) JSON.parse(body); } catch {
        return errorResponse(400, requestId, "INVALID_BODY", "Send a valid JSON request smaller than 64 KB.");
      }
    }
    const upstream = await fetch(baseUrl + endpoint, {
      method: request.method, headers, body, cache: "no-store", redirect: "error",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (upstream.status >= 500) {
      return errorResponse(503, requestId, "SERVICE_UNAVAILABLE", "This service is temporarily unavailable. Please try again.");
    }
    const responseHeaders = new Headers({ "Cache-Control": "no-store", "Vary": "Cookie", "X-Request-ID": requestId });
    for (const cookie of upstream.headers.getSetCookie()) {
      if (/^(sessionid|csrftoken)=/.test(cookie)) {
        responseHeaders.append("Set-Cookie", cookie.replace(/;\s*Domain=[^;]*/gi, ""));
      }
    }
    const retry = upstream.headers.get("retry-after");
    if (retry && /^\d{1,6}$/.test(retry)) responseHeaders.set("Retry-After", retry);
    if (upstream.status === 204) return new Response(null, { status: 204, headers: responseHeaders });
    if (!upstream.headers.get("content-type")?.includes("application/json")) throw new Error("Invalid upstream response");
    const payload = await upstream.json();
    if (!upstream.ok && payload?.error) payload.request_id = requestId;
    return Response.json(payload, { status: upstream.status, headers: responseHeaders });
  } catch {
    return errorResponse(503, requestId, "SERVICE_UNAVAILABLE", "This service is temporarily unavailable. Please try again.");
  }
}
