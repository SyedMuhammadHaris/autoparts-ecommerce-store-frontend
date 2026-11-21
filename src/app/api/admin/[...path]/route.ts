import { routeErrorResponse } from "@/lib/server/response";
import { proxyApi } from "@/lib/server/proxy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const resources = new Set(["categories", "brands", "products", "variants", "attributes", "attribute-values", "images", "inventory", "locations", "staff", "roles", "audit", "vehicle-makes", "vehicle-models", "vehicle-fitments", "product-fitments", "cities", "shipping-zones", "shipping-methods", "shipping-rates", "checkout-policies"]);
type Context = { params: Promise<{ path: string[] }> };
async function handle(request: Request, context: Context) {
  const path = (await context.params).path;
  if (path[0] === "payments") {
    if (path.length > 3 || path[1] && !/^[1-9][0-9]*$/.test(path[1]) || path[2] && !["verify", "confirm-cod", "collect-cod"].includes(path[2])) return routeErrorResponse(404, "Not found.", "NOT_FOUND");
    const page = new URL(request.url).searchParams.get("page");
    const query = path.length === 1 && page && /^[1-9][0-9]{0,8}$/.test(page) ? `?page=${page}` : "";
    return proxyApi(request, `/admin/${path.join("/")}/${query}`, path[2] ? ["POST"] : ["GET"]);
  }
  if (!(resources.has(path[0]) || path[0] === "bank-accounts") || path.length > 3 || path[1] && !/^[1-9][0-9]*$/.test(path[1]) || path[2] && !((path[0] === "inventory" && path[2] === "adjust") || (path[0] === "staff" && path[2] === "roles"))) {
    return routeErrorResponse(404, "Not found.", "NOT_FOUND");
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
