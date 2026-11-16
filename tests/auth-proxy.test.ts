/** @jest-environment node */
import { proxyApi } from "@/lib/server/proxy";
import { GET as authGet } from "@/app/api/auth/[...path]/route";
import { GET as adminGet } from "@/app/api/admin/[...path]/route";

const originalFetch = global.fetch;
beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
  process.env.BACKEND_API_URL = "http://backend:8000/api/v1";
  global.fetch = jest.fn().mockResolvedValue(Response.json({ user: { id: 1 } }));
});
afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks(); });
const token = "a".repeat(64);
function mutation(origin = "http://localhost:3000", csrf = token, body = "{}") {
  return new Request("http://localhost:3000/api/auth/login", { method: "POST", body, headers: { origin, "x-csrftoken": csrf, cookie: "sessionid=abc123; csrftoken=def456; secret=not-forwarded", authorization: "not-forwarded" } });
}
it("forwards only session cookies and verified CSRF/origin headers to a fixed destination", async () => {
  const response = await proxyApi(mutation(), "/auth/login/", ["POST"]);
  expect(response.status).toBe(200);
  const [url, options] = (fetch as jest.Mock).mock.calls[0];
  expect(url).toBe("http://backend:8000/api/v1/auth/login/");
  expect(options).toMatchObject({ redirect: "error", cache: "no-store", headers: { Cookie: "sessionid=abc123; csrftoken=def456", Origin: "http://localhost:3000", "X-CSRFToken": token } });
  expect(options.headers).not.toHaveProperty("authorization");
  expect(response.headers.get("cache-control")).toBe("no-store");
});
it.each([["https://evil.example", token], ["null", token], ["http://localhost:3000", ""]])("rejects foreign origins and missing CSRF before upstream calls", async (origin, csrf) => {
  expect((await proxyApi(mutation(origin, csrf), "/auth/login/", ["POST"])).status).toBe(403);
  expect(fetch).not.toHaveBeenCalled();
});
it.each(["not-json", "x".repeat(65537)])("rejects malformed and oversized bodies", async body => {
  expect((await proxyApi(mutation(undefined, undefined, body), "/auth/login/", ["POST"])).status).toBe(400);
  expect(fetch).not.toHaveBeenCalled();
});
it("preserves separate HttpOnly cookies, removes domains and drops unrelated cookies", async () => {
  const headers = new Headers();
  headers.append("Set-Cookie", "sessionid=session; HttpOnly; Path=/; SameSite=Lax; Domain=backend");
  headers.append("Set-Cookie", "csrftoken=csrf; HttpOnly; Path=/; SameSite=Lax");
  headers.append("Set-Cookie", "other=discard; Path=/");
  global.fetch = jest.fn().mockResolvedValue(Response.json({ user: {} }, { headers }));
  const response = await proxyApi(mutation(), "/auth/login/", ["POST"]);
  expect(response.headers.getSetCookie()).toEqual(["sessionid=session; HttpOnly; Path=/; SameSite=Lax", "csrftoken=csrf; HttpOnly; Path=/; SameSite=Lax"]);
});
it("preserves logout's cookie deletion and empty response", async () => {
  global.fetch = jest.fn().mockResolvedValue(new Response(null, { status: 204, headers: { "Set-Cookie": "sessionid=; Max-Age=0; Path=/" } }));
  const response = await proxyApi(mutation(), "/auth/logout/", ["POST"]);
  expect(response.status).toBe(204);
  expect(await response.text()).toBe("");
  expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
});
it("sanitizes upstream diagnostics and propagates bounded rate-limit responses", async () => {
  global.fetch = jest.fn().mockResolvedValue(Response.json({ password: "private-diagnostic" }, { status: 500 }));
  const failed = await proxyApi(mutation(), "/auth/login/", ["POST"]);
  expect(failed.status).toBe(503);
  expect(await failed.text()).not.toContain("private-diagnostic");
  global.fetch = jest.fn().mockResolvedValue(Response.json({ error: { message: "Wait" } }, { status: 429, headers: { "Retry-After": "60" } }));
  expect((await proxyApi(mutation(), "/auth/login/", ["POST"])).headers.get("retry-after")).toBe("60");
});
it("rejects arbitrary auth/admin paths without contacting Django", async () => {
  for (const path of [["https:", "evil.example"], ["products", "abc"], ["products", "1", "delete"]]) {
    const response = await adminGet(new Request("http://localhost:3000/api/admin/x"), { params: Promise.resolve({ path }) });
    expect(response.status).toBe(404);
  }
  expect((await authGet(new Request("http://localhost:3000/api/auth/x"), { params: Promise.resolve({ path: ["arbitrary"] }) })).status).toBe(404);
  expect(fetch).not.toHaveBeenCalled();
});
