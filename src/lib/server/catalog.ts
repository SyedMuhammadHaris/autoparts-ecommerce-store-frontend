import "server-only";
import { backendConfiguration } from "@/lib/server/backend";
import type { Page, Product, Taxonomy } from "@/lib/catalog-types";

export class CatalogNotFound extends Error {}

async function readCatalog<T>(path: string): Promise<T> {
  const { baseUrl, timeoutMs } = backendConfiguration();
  const response = await fetch(baseUrl + "/catalog/" + path, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(timeoutMs), headers: { Accept: "application/json" } });
  if (response.status === 404) throw new CatalogNotFound("Not found");
  if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new Error("Catalog unavailable");
  return response.json() as Promise<T>;
}
export function readProducts(query: Record<string, string | string[] | undefined>): Promise<Page<Product>> {
  const params = new URLSearchParams();
  for (const key of ["search", "category", "brand", "min_price", "max_price", "ordering", "page"]) {
    const value = query[key];
    if (typeof value === "string" && value.trim() && value.length <= 180) params.set(key, value);
  }
  return readCatalog(`products/?${params}`);
}
export function readProduct(slug: string): Promise<Product> {
  if (!/^[A-Za-z0-9_-]{1,255}$/.test(slug)) throw new CatalogNotFound("Not found");
  return readCatalog(`products/${encodeURIComponent(slug)}/`);
}
export function readCategories(): Promise<Page<Taxonomy>> { return readCatalog("categories/?page_size=100"); }
export function readBrands(): Promise<Page<Taxonomy>> { return readCatalog("brands/?page_size=100"); }
