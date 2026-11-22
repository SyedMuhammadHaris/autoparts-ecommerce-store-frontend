import { routeErrorResponse } from "@/lib/server/response";
import { proxyApi } from "@/lib/server/proxy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const resources = new Set(["categories", "brands", "products", "variants", "attributes", "attribute-values", "images", "inventory", "locations", "staff", "roles", "audit", "vehicle-makes", "vehicle-models", "vehicle-fitments", "product-fitments", "cities", "shipping-zones", "shipping-methods", "shipping-rates", "checkout-policies"]);
type Context = { params: Promise<{ path: string[] }> };
async function handle(request: Request, context: Context) {
  const path = (await context.params).path;
  if (path[0] === "customers") {
    if (path.length > 3 || path[1] && !/^[1-9][0-9]*$/.test(path[1]) || path[2] && !["orders", "status"].includes(path[2])) return routeErrorResponse(404, "Not found.", "NOT_FOUND");
    const incoming = new URL(request.url).searchParams;
    const query = new URLSearchParams();
    for (const key of ["search", "page"]) {
      const value = incoming.get(key);
      if (value !== null) {
        if (value.length > 100) return routeErrorResponse(400, "Invalid customer filters.", "VALIDATION_ERROR");
        query.set(key, value);
      }
    }
    return proxyApi(request, `/admin/${path.join("/")}/${query.size ? "?" + query : ""}`, path[2] === "status" ? ["POST"] : ["GET"]);
  }
  if (path[0] === "reports") {
    if (path.length !== 2 || !["dashboard", "orders-export"].includes(path[1])) return routeErrorResponse(404, "Not found.", "NOT_FOUND");
    const query = new URL(request.url).searchParams;
    const forwarded = new URLSearchParams();
    for (const key of ["start", "end", "low_stock"]) {
      const value = query.get(key);
      if (value !== null) {
        if (value.length > 10) return routeErrorResponse(400, "Invalid report filters.", "VALIDATION_ERROR");
        forwarded.set(key, value);
      }
    }
    return proxyApi(request, `/admin/reports/${path[1]}/?${forwarded}`, ["GET"]);
  }
  if (["fulfillment", "returns", "refunds"].includes(path[0])) {
    if (path.length > 2 || path[1] && !/^[1-9][0-9]*$/.test(path[1])) return routeErrorResponse(404, "Not found.", "NOT_FOUND");
    const page = new URL(request.url).searchParams.get("page");
    const query = path.length === 1 && page && /^[1-9][0-9]{0,8}$/.test(page) ? `?page=${page}` : "";
    return proxyApi(request, `/admin/${path.join("/")}/${query}`, path[1] || path[0] === "refunds" ? ["GET", "POST"] : ["GET"]);
  }
  if (path[0] === "payments") {
    if (path.length > 3 || path[1] && !/^[1-9][0-9]*$/.test(path[1]) || path[2] && !["verify", "confirm-cod", "collect-cod"].includes(path[2])) return routeErrorResponse(404, "Not found.", "NOT_FOUND");
    const page = new URL(request.url).searchParams.get("page");
    const query = path.length === 1 && page && /^[1-9][0-9]{0,8}$/.test(page) ? `?page=${page}` : "";
    return proxyApi(request, `/admin/${path.join("/")}/${query}`, path[2] ? ["POST"] : ["GET"]);
  }
  if (!(resources.has(path[0]) || ["bank-accounts", "return-policies", "pages", "banners", "homepage-sections", "store-settings", "coupons", "reviews", "notification-templates", "notifications"].includes(path[0])) || path.length > 3 || path[1] && !/^[1-9][0-9]*$/.test(path[1]) || path[2] && !((path[0] === "inventory" && path[2] === "adjust") || (path[0] === "staff" && ["roles", "status"].includes(path[2])) || (path[0] === "reviews" && path[2] === "moderate") || (path[0] === "notifications" && path[2] === "retry"))) {
    return routeErrorResponse(404, "Not found.", "NOT_FOUND");
  }
  const query = new URL(request.url).searchParams;
  const forwarded = new URLSearchParams();
  for (const key of ["page", "page_size", "product", "actor", "object_id"]) {
    const value = query.get(key);
    if (value && /^[0-9]{1,10}$/.test(value)) forwarded.set(key, value);
  }
  for (const key of path[0] === "staff" ? ["search"] : path[0] === "audit" ? ["action", "object_type"] : path[0] === "reviews" ? ["status"] : path[0] === "notifications" ? ["state"] : []) {
    const value = query.get(key);
    if (value !== null) {
      if (value.length > 100) return routeErrorResponse(400, "Invalid management filters.", "VALIDATION_ERROR");
      forwarded.set(key, value);
    }
  }
  return proxyApi(request, `/admin/${path.join("/")}/${forwarded.size ? "?" + forwarded : ""}`, ["GET", "POST", "PATCH"]);
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
