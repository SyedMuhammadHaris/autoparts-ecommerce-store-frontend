import "server-only";
import { randomUUID } from "node:crypto";
import { errorEnvelope } from "@/lib/api/contracts";

export function routeErrorResponse(status: number, message: string, code: string) {
  const requestId = randomUUID();
  return Response.json(errorEnvelope(status, message, code, requestId), {
    status, headers: { "Cache-Control": "no-store", "X-Request-ID": requestId },
  });
}
