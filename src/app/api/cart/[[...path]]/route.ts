import { proxyApi } from "@/lib/server/proxy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ path?: string[] }> };
async function handle(request: Request, context: Context) {
  const path = (await context.params).path ?? [];
  if (path.length === 0) return proxyApi(request, "/cart/", ["GET", "PUT"]);
  if (path.length === 1 && path[0] === "merge") return proxyApi(request, "/cart/merge/", ["POST"]);
  return Response.json({ error: { message: "Not found." } }, { status: 404 });
}
export const GET = handle;
export const PUT = handle;
export const POST = handle;
