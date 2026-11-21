/** @jest-environment node */
import { createHash } from "node:crypto";
import { proxyApi } from "@/lib/server/proxy";
import { PUT } from "@/app/api/cart/[[...path]]/route";
const originalFetch = global.fetch;
beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
  process.env.NEXTAUTH_URL = "http://localhost:3000";
  process.env.NEXTAUTH_SECRET = "s".repeat(64);
  process.env.BACKEND_API_URL = "http://backend:8000/api/v1";
  global.fetch = jest.fn().mockResolvedValue(Response.json({ items: [], item_count: 0 }));
});
afterEach(() => { global.fetch = originalFetch; });
it("creates a private guest capability without forwarding browser authorization or upstream cookies", async () => {
  const response = await proxyApi(new Request("http://localhost:3000/api/cart", { headers: { authorization: "Bearer forged", "x-cart-token": "forged" } }), "/cart/", ["GET"]);
  expect(response.status).toBe(200);
  const headers = (fetch as jest.Mock).mock.calls[0][1].headers;
  expect(headers.Authorization).toBeUndefined();
  expect(headers["X-Cart-Token"]).toMatch(/^[a-f0-9]{64}$/);
  expect(response.headers.get("set-cookie")).toContain("HttpOnly; SameSite=Lax");
  expect(await response.text()).not.toContain(headers["X-Cart-Token"]);
});
it("requires signed CSRF even for guest cart writes", async () => {
  const request = new Request("http://localhost:3000/api/cart", { method: "PUT", headers: { origin: "http://localhost:3000" }, body: "{}" });
  expect((await PUT(request, { params: Promise.resolve({}) })).status).toBe(403);
  expect(fetch).not.toHaveBeenCalled();
});
it("uses only the HttpOnly guest cookie for an allowed cart mutation", async () => {
  const csrf = "a".repeat(64);
  const signature = createHash("sha256").update(csrf + process.env.NEXTAUTH_SECRET).digest("hex");
  const request = new Request("http://localhost:3000/api/cart", { method: "PUT", headers: { origin: "http://localhost:3000", "x-csrftoken": csrf, cookie: `autoparts-cart=${"b".repeat(64)}; next-auth.csrf-token=${encodeURIComponent(csrf + "|" + signature)}` }, body: '{"variant":1,"quantity":2}' });
  expect((await PUT(request, { params: Promise.resolve({}) })).status).toBe(200);
  expect((fetch as jest.Mock).mock.calls[0][1].headers["X-Cart-Token"]).toBe("b".repeat(64));
});
