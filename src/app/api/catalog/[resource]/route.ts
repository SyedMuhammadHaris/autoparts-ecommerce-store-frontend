import { proxyApi } from "@/lib/server/proxy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const resources = new Set(["vehicle-makes", "vehicle-models", "vehicle-fitments"]);
export async function GET(request: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params;
  if (!resources.has(resource)) return Response.json({ error: { message: "Not found." } }, { status: 404 });
  const source = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of ["make", "model", "page", "page_size"]) {
    const value = source.get(key);
    if (value && /^[1-9][0-9]{0,9}$/.test(value)) query.set(key, value);
  }
  return proxyApi(request, `/catalog/${resource}/?${query}`, ["GET"]);
}
