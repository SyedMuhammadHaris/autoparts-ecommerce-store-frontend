import { proxyApi } from "@/lib/server/proxy";
import { routeErrorResponse } from "@/lib/server/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
async function handle(request: Request, context: Context) {
  const path = (await context.params).path;
  if (!path[0] || !/^[A-Za-z0-9_-]{1,255}$/.test(path[0]) || path.length > 2 || path[1] && path[1] !== "mine") return routeErrorResponse(404, "Not found.", "NOT_FOUND");
  if (path[1]) return proxyApi(request, `/reviews/products/${encodeURIComponent(path[0])}/mine/`, ["GET", "POST", "PATCH"]);
  const page = new URL(request.url).searchParams.get("page");
  return proxyApi(request, `/catalog/products/${encodeURIComponent(path[0])}/reviews/${page && /^[1-9][0-9]{0,8}$/.test(page) ? `?page=${page}` : ""}`, ["GET"]);
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
