import { proxyApi } from "@/lib/server/proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(request: Request) {
  const page = new URL(request.url).searchParams.get("page");
  return proxyApi(request, `/notifications/${page && /^[1-9][0-9]{0,8}$/.test(page) ? `?page=${page}` : ""}`, ["GET", "POST"]);
}
export const GET = handle;
export const POST = handle;
