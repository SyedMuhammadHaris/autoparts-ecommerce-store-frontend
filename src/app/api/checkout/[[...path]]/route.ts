import { routeErrorResponse } from "@/lib/server/response";
import { proxyApi } from "@/lib/server/proxy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path?: string[] }> };
async function handle(request: Request, context: Context) {
  const path = (await context.params).path ?? [];
  if (!path.length) return proxyApi(request, "/checkout/", ["POST"]);
  if (path.length === 1 && path[0] === "quote") return proxyApi(request, "/checkout/quote/", ["POST"]);
  if (path.length === 2 && path[0] === "attempt" && /^[A-Za-z0-9_-]{16,80}$/.test(path[1])) return proxyApi(request, `/checkout/attempt/${path[1]}/`, ["GET"]);
  return routeErrorResponse(404, "Not found.", "NOT_FOUND");
}
export const GET = handle;
export const POST = handle;
