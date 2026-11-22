import "server-only";
import { cache } from "react";
import { serverFetch } from "./fetch";
import type { PublicHome, PublicPage } from "@/features/content/types";
import { ApiError } from "@/lib/api/contracts";

export const readPublicHome = cache(async (): Promise<PublicHome | null> => {
  try { return await serverFetch<PublicHome>({ path: "/content/home/" }); }
  catch { return null; }
});
const fetchPublicPage = cache((slug: string) => serverFetch<PublicPage>({ path: "/content/pages/{slug}/", pathParams: { slug } }));
export function readPublicPage(slug: string) {
  if (!/^[A-Za-z0-9_-]{1,120}$/.test(slug)) throw new ApiError("Page not found.", 404);
  return fetchPublicPage(slug);
}
