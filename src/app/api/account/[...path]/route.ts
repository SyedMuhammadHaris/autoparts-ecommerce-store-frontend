import { proxyApi } from "@/lib/server/proxy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const routes: Record<string, string[]> = { register: ["POST"], logout: ["POST"], me: ["GET", "PATCH"], "verification/send": ["POST"], "verification/confirm": ["POST"] };
type Context = { params: Promise<{ path: string[] }> };
async function handle(request: Request, context: Context) {
  const key = (await context.params).path.join("/");
  if (!Object.hasOwn(routes, key)) return Response.json({ error: { message: "Not found." } }, { status: 404 });
  return proxyApi(request, `/auth/${key}/`, routes[key]);
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
