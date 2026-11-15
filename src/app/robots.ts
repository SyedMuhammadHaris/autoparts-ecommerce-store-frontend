import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Local foundation only. Revisit indexing deliberately during launch readiness.
  return { rules: { userAgent: "*", disallow: "/" } };
}
