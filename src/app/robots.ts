import type { MetadataRoute } from "next";
import { absoluteUrl, indexingEnabled } from "@/lib/seo/policy";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  if (!indexingEnabled()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/cart", "/checkout", "/orders", "/login", "/signup", "/verify-email", "/api/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
