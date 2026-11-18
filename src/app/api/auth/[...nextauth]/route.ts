import NextAuth from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/server/auth-options";
import { authConfiguration } from "@/lib/server/auth-tokens";
import { limitedBody } from "@/lib/server/request-body";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const nextAuth = NextAuth(authOptions);
type Context = { params: Promise<{ nextauth: string[] }> };
async function handle(request: Request, context: Context) {
  try {
    const { origin } = authConfiguration();
    if (request.method === "POST") {
      if (request.headers.get("origin") !== origin) return Response.json({ error: { message: "Refresh the page and try again." } }, { status: 403, headers: { "Cache-Control": "no-store" } });
      let body: string;
      try { body = await limitedBody(request); }
      catch { return Response.json({ error: { message: "Request exceeds the supported size." } }, { status: 413, headers: { "Cache-Control": "no-store" } }); }
      request = new NextRequest(request, { body });
    }
    const response = await nextAuth(request, { params: await context.params });
    response.headers.set("Cache-Control", "no-store");
    response.headers.append("Vary", "Cookie");
    return response;
  } catch {
    return Response.json({ error: { message: "Authentication is temporarily unavailable. Check configuration and try again." } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
export const GET = handle;
export const POST = handle;
