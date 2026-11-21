import "server-only";
import { serverFetch } from "@/lib/server/fetch";
import { ApiError } from "@/lib/api/contracts";
import { vehicleQuery } from "@/lib/vehicle-query";
import type { Page, Product, Taxonomy, VehicleMake, VehicleModel, VehicleFitment } from "@/lib/catalog-types";

export class CatalogNotFound extends Error {}
export class CatalogInvalidFilters extends Error {}

async function readCatalog<T>(path: string): Promise<T> {
  try { return await serverFetch<T>({ path: "/catalog/" + path }); }
  catch (failure) {
    if (failure instanceof ApiError && failure.status === 404) throw new CatalogNotFound("Not found");
    if (failure instanceof ApiError && failure.status === 400) throw new CatalogInvalidFilters("Check the selected filters");
    throw new Error("Catalog unavailable");
  }
}
export function readProducts(query: Record<string, string | string[] | undefined>): Promise<Page<Product>> {
  const params = new URLSearchParams();
  for (const key of ["search", "category", "brand", "min_price", "max_price", "ordering", "page", "make", "model", "year", "engine", "trim"]) {
    const value = query[key];
    if (typeof value === "string" && value.trim() && value.length <= 180) params.set(key, value);
  }
  return readCatalog(`products/?${params}`);
}
export function readProduct(slug: string, query: Record<string, string | string[] | undefined> = {}): Promise<Product> {
  if (!/^[A-Za-z0-9_-]{1,255}$/.test(slug)) throw new CatalogNotFound("Not found");
  const filters = vehicleQuery(query);
  return readCatalog(`products/${encodeURIComponent(slug)}/${filters ? "?" + filters : ""}`);
}
export function readCategories(): Promise<Page<Taxonomy>> { return readCatalog("categories/?page_size=100"); }
export function readBrands(): Promise<Page<Taxonomy>> { return readCatalog("brands/?page_size=100"); }

async function readVehicleRows<T>(resource: string, query = ""): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 1; page <= 100; page++) {
    const result = await readCatalog<Page<T>>(`${resource}/?page_size=100&page=${page}${query}`);
    rows.push(...result.results);
    if (!result.next) return rows;
  }
  throw new Error("Vehicle list exceeds the initial catalog limit");
}
export function readVehicleMakes() { return readVehicleRows<VehicleMake>("vehicle-makes"); }
export function readVehicleModels(make: string) { return make ? readVehicleRows<VehicleModel>("vehicle-models", `&make=${encodeURIComponent(make)}`) : Promise.resolve([]); }
export function readVehicleFitments(make: string, model: string) { return make && model ? readVehicleRows<VehicleFitment>("vehicle-fitments", `&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`) : Promise.resolve([]); }
