import { randomUUID } from "node:crypto";
import { getBackendHealth } from "@/lib/server/backend";
import { successEnvelope, errorEnvelope } from "@/lib/api/contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const candidate = request.headers.get("X-Request-ID") ?? "";
  const requestId = /^[A-Za-z0-9_-]{1,64}$/.test(candidate) ? candidate : randomUUID();
  const headers = { "Cache-Control": "no-store", "X-Request-ID": requestId };
  try {
    return Response.json(successEnvelope(await getBackendHealth(requestId), 200, requestId), { headers });
  } catch {
    return Response.json(errorEnvelope(503, "The service is temporarily unavailable.", "BACKEND_UNAVAILABLE", requestId), { status: 503, headers });
  }
}
