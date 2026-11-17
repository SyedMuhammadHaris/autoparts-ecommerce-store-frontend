import { proxyApi } from "@/lib/server/proxy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const resources = new Set(["categories", "brands", "products", "variants", "attributes", "attribute-values", "images", "inventory", "locations", "staff", "roles", "audit", "vehicle-makes", "vehicle-models", "vehicle-fitments", "product-fitments"]);
type Context = { params: Promise<{ path: string[] }> };
async function handle(request: Request, context: Context) {
  const path = (await context.params).path;
  if (!resources.has(path[0]) || path.length > 3 || path[1] && !/^[1-9][0-9]*$/.test(path[1]) || path[2] && !((path[0] === "inventory" && path[2] === "adjust") || (path[0] === "staff" && path[2] === "roles"))) {
    return Response.json({ error: { message: "Not found." } }, { status: 404 });
  }
  const query = new URL(request.url).searchParams;
  const forwarded = new URLSearchParams();
  for (const key of ["page", "page_size", "product"]) {
    const value = query.get(key);
    if (value && /^[0-9]{1,10}$/.test(value)) forwarded.set(key, value);
  }
  return proxyApi(request, `/admin/${path.join("/")}/${forwarded.size ? "?" + forwarded : ""}`, ["GET", "POST", "PATCH"]);
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
