import "server-only";
import type { MetadataRoute } from "next";
import { absoluteUrl, indexingEnabled } from "@/lib/seo/policy";
import { serverFetch } from "./fetch";

type SitemapBatch = { results: { slug: string; updated_at: string }[]; next_after: number | null };

export async function publicSitemap(): Promise<MetadataRoute.Sitemap> {
  if (!indexingEnabled()) return [];
  const urls: MetadataRoute.Sitemap = [{ url: absoluteUrl("/") }, { url: absoluteUrl("/products") }];
  for (const kind of ["products", "pages"] as const) {
    let after = 0;
    for (let batch = 0; batch < 50; batch++) {
      const data = await serverFetch<SitemapBatch>({ path: "/catalog/sitemap/", query: { kind, after } });
      if (!Array.isArray(data.results) || data.results.length > 1000) throw new Error("Sitemap unavailable.");
      for (const entry of data.results) {
        if (!/^[A-Za-z0-9_-]{1,255}$/.test(entry.slug) || !Number.isFinite(Date.parse(entry.updated_at))) throw new Error("Sitemap unavailable.");
        urls.push({ url: absoluteUrl(`/${kind}/${encodeURIComponent(entry.slug)}`), lastModified: entry.updated_at });
      }
      if (urls.length > 50000) throw new Error("Sitemap requires partitioning before indexing.");
      if (data.next_after === null) break;
      if (!Number.isSafeInteger(data.next_after) || data.next_after <= after || batch === 49) throw new Error("Sitemap unavailable.");
      after = data.next_after;
    }
  }
  // Never return a silently truncated or duplicate sitemap.
  if (new Set(urls.map(entry => entry.url)).size !== urls.length) throw new Error("Sitemap unavailable.");
  return urls;
}
