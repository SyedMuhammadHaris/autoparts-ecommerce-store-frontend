/** @jest-environment node */
import robots from "@/app/robots";
import { indexingEnabled, privateMetadata } from "@/lib/seo/policy";
import { productBreadcrumbs, productStructuredData, serializeStructuredData } from "@/lib/seo/structured-data";
import { publicSitemap } from "@/lib/server/sitemap";
import { serverFetch } from "@/lib/server/fetch";
import { catalogMetadata } from "@/features/catalog/catalog-metadata";
import { productMetadata } from "@/features/catalog/product-metadata";
import { readProduct } from "@/lib/server/catalog";
import type { Product } from "@/lib/catalog-types";
import nextConfig from "../next.config";

jest.mock("@/lib/server/fetch", () => ({ serverFetch: jest.fn() }));
jest.mock("@/lib/server/catalog", () => ({ readProduct: jest.fn() }));
const originalFlag = process.env.SITE_INDEXING_ENABLED;
const originalOrigin = process.env.NEXT_PUBLIC_SITE_URL;
beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_SITE_URL = "https://store.example.com";
  delete process.env.SITE_INDEXING_ENABLED;
});
afterAll(() => {
  if (originalFlag === undefined) delete process.env.SITE_INDEXING_ENABLED; else process.env.SITE_INDEXING_ENABLED = originalFlag;
  if (originalOrigin === undefined) delete process.env.NEXT_PUBLIC_SITE_URL; else process.env.NEXT_PUBLIC_SITE_URL = originalOrigin;
});

const product: Product = {
  id: 1, name: "Brake pad </script><script>alert(1)</script>", slug: "brake-pad", sku: "PAD", description: "Verified fitment needed", category_name: "Brakes", brand_name: "Test brand",
  base_price: "100.00", price: "100.00", currency: "PKR", display_image_url: "https://images.example.com/pad.jpg", images: [],
  variants: [
    { id: 1, sku: "PAD-A", price: "100.00", quantity_available: 2, values: [] },
    { id: 2, sku: "PAD-B", price: "120.00", quantity_available: 0, values: [] },
  ],
};

it("keeps local/preview indexing disabled and sitemap empty without contacting the backend", async () => {
  expect(indexingEnabled()).toBe(false);
  expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  expect(await publicSitemap()).toEqual([]);
  expect(serverFetch).not.toHaveBeenCalled();
});

it.each(["http://store.example.com", "https://localhost", "https://127.0.0.1", "https://store.invalid"])("rejects enabling indexing at %s", origin => {
  process.env.SITE_INDEXING_ENABLED = "true";
  process.env.NEXT_PUBLIC_SITE_URL = origin;
  expect(indexingEnabled).toThrow("public HTTPS");
});

it("lists only public canonical URLs and follows bounded backend cursors", async () => {
  process.env.SITE_INDEXING_ENABLED = "true";
  (serverFetch as jest.Mock)
    .mockResolvedValueOnce({ results: [{ slug: "brake-pad", updated_at: "2026-11-22T00:00:00Z" }], next_after: 5 })
    .mockResolvedValueOnce({ results: [], next_after: null })
    .mockResolvedValueOnce({ results: [{ slug: "about", updated_at: "2026-11-21T00:00:00Z" }], next_after: null });
  expect((await publicSitemap()).map(entry => entry.url)).toEqual([
    "https://store.example.com/", "https://store.example.com/products", "https://store.example.com/products/brake-pad", "https://store.example.com/pages/about",
  ]);
  expect(serverFetch).toHaveBeenNthCalledWith(2, { path: "/catalog/sitemap/", query: { kind: "products", after: 5 } });
  expect(robots()).toMatchObject({ sitemap: "https://store.example.com/sitemap.xml", rules: { disallow: expect.arrayContaining(["/admin", "/account", "/checkout", "/api/"]) } });
  expect(privateMetadata.robots).toMatchObject({ index: false, follow: false });
});

it("fails instead of publishing an incomplete or malicious sitemap", async () => {
  process.env.SITE_INDEXING_ENABLED = "true";
  (serverFetch as jest.Mock).mockResolvedValue({ results: [], next_after: 0 });
  await expect(publicSitemap()).rejects.toThrow("Sitemap unavailable");
  (serverFetch as jest.Mock).mockResolvedValue({ results: [{ slug: "../admin", updated_at: "2026-11-22" }], next_after: null });
  await expect(publicSitemap()).rejects.toThrow("Sitemap unavailable");
  (serverFetch as jest.Mock).mockRejectedValue(new Error("upstream offline"));
  await expect(publicSitemap()).rejects.toThrow();
});

it("escapes script terminators and uses actual per-variant PKR prices and stock", () => {
  const data = productStructuredData(product);
  const serialized = serializeStructuredData(data);
  expect(serialized).not.toContain("</script>");
  expect(JSON.parse(serialized).name).toBe(product.name);
  expect(data.offers).toEqual([
    expect.objectContaining({ price: "100.00", priceCurrency: "PKR", availability: "https://schema.org/InStock" }),
    expect.objectContaining({ price: "120.00", availability: "https://schema.org/OutOfStock" }),
  ]);
  expect(data).not.toHaveProperty("aggregateRating");
  expect(productBreadcrumbs(product).itemListElement.map(entry => entry.position)).toEqual([1, 2, 3]);
});

it("canonicalizes pagination, excludes filtered listing pages and uses unfiltered product metadata", async () => {
  process.env.SITE_INDEXING_ENABLED = "true";
  expect(await catalogMetadata({ searchParams: Promise.resolve({ page: "2" }) })).toMatchObject({ alternates: { canonical: "/products?page=2" }, robots: { index: true } });
  expect(await catalogMetadata({ searchParams: Promise.resolve({ search: "pad", page: "1" }) })).toMatchObject({ alternates: { canonical: "/products" }, robots: { index: false } });
  (readProduct as jest.Mock).mockResolvedValue(product);
  expect(await productMetadata({ params: Promise.resolve({ slug: product.slug }), searchParams: Promise.resolve({ make: "1" }) })).toMatchObject({ alternates: { canonical: "/products/brake-pad" } });
  expect(readProduct).toHaveBeenCalledWith("brake-pad");
});

it("sets browser security headers and always excludes private routes from indexing", async () => {
  const headers = await nextConfig.headers!();
  expect(headers[0].headers).toEqual(expect.arrayContaining([
    { key: "X-Frame-Options", value: "DENY" }, { key: "X-Content-Type-Options", value: "nosniff" },
  ]));
  expect(headers[1].headers).toContainEqual({ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" });
});
