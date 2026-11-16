import { NextRequest, NextResponse } from "next/server";
import { CatalogNotFound, readProduct } from "@/lib/server/catalog";

// Check existence before a loading boundary starts streaming a 200 response.
export async function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/")[2];
  try {
    await readProduct(slug);
    return NextResponse.next();
  } catch (failure) {
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
export const config = { matcher: "/products/:slug" };
