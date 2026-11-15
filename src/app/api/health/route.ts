import { randomUUID } from "node:crypto";
import { getBackendHealth } from "@/lib/server/backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const candidate = request.headers.get("X-Request-ID") ?? "";
  const requestId = /^[A-Za-z0-9_-]{1,64}$/.test(candidate) ? candidate : randomUUID();
  const headers = { "Cache-Control": "no-store", "X-Request-ID": requestId };
  try {
    return Response.json(await getBackendHealth(requestId), { headers });
  } catch {
    return Response.json({
      error: { code: "BACKEND_UNAVAILABLE", message: "The service is temporarily unavailable.", details: {} },
      request_id: requestId,
    }, { status: 503, headers });
  }
}
