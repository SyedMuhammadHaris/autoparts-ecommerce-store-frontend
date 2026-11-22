import "server-only";
import type { Metadata } from "next";
import { readSiteUrl } from "@/lib/env";

export const privateMetadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true },
};

/** Server-only opt-in; setting NODE_ENV=production alone must never index a preview. */
export function indexingEnabled(): boolean {
  const flag = process.env.SITE_INDEXING_ENABLED ?? "false";
  if (!["true", "false"].includes(flag)) throw new Error("SITE_INDEXING_ENABLED must be true or false.");
  if (flag === "false") return false;
  const url = new URL(readSiteUrl(process.env.NEXT_PUBLIC_SITE_URL));
  if (url.protocol !== "https:" || !url.hostname.includes(".") || /(^[\d.]+$|:|\.(localhost|local|invalid|test)$)/i.test(url.hostname)) {
    throw new Error("Enable SITE_INDEXING_ENABLED only with a public HTTPS NEXT_PUBLIC_SITE_URL.");
  }
  return true;
}

export function publicRobots() {
  const enabled = indexingEnabled();
  return { index: enabled, follow: enabled };
}

export function absoluteUrl(path: string): string {
  return new URL(path, readSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)).href;
}
