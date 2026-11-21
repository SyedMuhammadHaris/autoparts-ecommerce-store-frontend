import { proxyApi } from "@/lib/server/proxy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path?: string[] }> };
async function handle(request: Request, context: Context) {
  const path = (await context.params).path ?? [];
  if (!path.length) {
    const page = new URL(request.url).searchParams.get("page");
    return proxyApi(request, `/orders/${page && /^[1-9][0-9]{0,8}$/.test(page) ? `?page=${page}` : ""}`, ["GET"]);
  }
  if (path.length <= 2 && /^[a-f0-9]{24}$/.test(path[0]) && (!path[1] || path[1] === "cancel")) return proxyApi(request, `/orders/${path.join("/")}/`, path[1] ? ["POST"] : ["GET"]);
  return Response.json({ error: { message: "Not found." } }, { status: 404 });
}
export const GET = handle;
export const POST = handle;
