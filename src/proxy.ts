import { NextRequest, NextResponse } from "next/server";
import { CatalogInvalidFilters, CatalogNotFound, readProduct } from "@/lib/server/catalog";
import { readPublicPage } from "@/lib/server/content";
import { ApiError } from "@/lib/api/contracts";

// Check existence before a loading boundary starts streaming a 200 response.
export async function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/")[2];
  if (request.nextUrl.pathname.startsWith("/pages/")) {
    try { await readPublicPage(slug); return NextResponse.next(); }
    catch (error) {
      if (error instanceof ApiError && error.status === 404) return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
      return new NextResponse("Page temporarily unavailable. Please try again shortly.", { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "30" } });
    }
  }
  try {
    await readProduct(slug, Object.fromEntries(request.nextUrl.searchParams));
    return NextResponse.next();
  } catch (failure) {
    if (failure instanceof CatalogInvalidFilters) {
      return new NextResponse("<!doctype html><html lang='en'><head><title>Check vehicle selection</title><meta name='robots' content='noindex'></head><body><main><h1>Check your vehicle selection.</h1><p>Select a make, its model, and a supported year.</p><a href='/products'>Choose a vehicle</a></main></body></html>", { status: 400, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
    }
    if (failure instanceof CatalogNotFound) {
      return NextResponse.rewrite(new URL("/_not-found", request.url), {
        status: 404, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
      });
    }
    return new NextResponse("<!doctype html><html lang='en'><head><title>Catalog unavailable</title><meta name='robots' content='noindex'></head><body><main><h1>Catalog temporarily unavailable.</h1><p>Please try again shortly.</p><a href='/products'>Back to parts</a></main></body></html>", {
      status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Retry-After": "30" },
    });
  }
}
export const config = { matcher: ["/products/:slug", "/pages/:slug"] };
